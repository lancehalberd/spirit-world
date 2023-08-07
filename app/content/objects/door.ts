import { addSparkleAnimation } from 'app/content/effects/animationEffect';
import { evaluateLogicDefinition } from 'app/content/logic';
import { doorStyles, DoorStyle } from 'app/content/objects/doorStyles';
import { objectHash } from 'app/content/objects/objectHash';
import {
    BITMAP_LEFT, BITMAP_RIGHT,
    BITMAP_BOTTOM, BITMAP_BOTTOM_LEFT_QUARTER, BITMAP_BOTTOM_RIGHT_QUARTER,
    BITMAP_TOP,
} from 'app/content/bitMasks';
import { playAreaSound } from 'app/musicController';
import { showMessage } from 'app/scriptEvents';
import { createAnimation, drawFrame } from 'app/utils/animations';
import { enterZoneByTarget, findObjectLocation, isLocationHot } from 'app/utils/enterZoneByTarget';
import { directionMap } from 'app/utils/field';
import { boxesIntersect, isObjectInsideTarget, isPointInShortRect, pad } from 'app/utils/index';
import { getObjectStatus, saveObjectStatus } from 'app/utils/objects';
import { drawText } from 'app/utils/simpleWhiteFont';
import { applyBehaviorToTile, resetTileBehavior } from 'app/utils/tileBehavior';

const BITMAP_SIDE_DOOR_TOP: Uint16Array = new Uint16Array([
    0xFFFF, 0xFFFF, 0xFFFF, 0xFFFF, 0xFFFF, 0xFFFF, 0xFFFF, 0xFFFF,
    0xFFFF, 0xFFFF, 0xFFFF, 0, 0, 0, 0, 0,
]);
const BITMAP_SIDE_DOOR_BOTTOM: Uint16Array = new Uint16Array([
    0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0xFFFF, 0xFFFF, 0xFFFF, 0xFFFF, 0xFFFF,
]);

const [
    entranceLightFrame
] = createAnimation('gfx/objects/cavelight.png', {w: 64, h: 32}).frames;

export class DoorTop implements ObjectInstance {
    get area(): AreaInstance {
        return this.door.area;
    }
    drawPriority: 'sprites' = 'sprites';
    status: ObjectStatus;
    x: number;
    y: number;
    ignorePits = true;
    isObject = <const>true;
    door: Door;
    constructor(door: Door) {
        this.door = door;
        this.x = this.door.x;
        this.y = this.door.y;
    }
    getHitbox(): Rect {
        return this.door.getHitbox();
    }
    getYDepth(): number {
        // These legacy door styles should eventually be removed, but for now make sure they
        // render correctly.
        if (this.door.style === 'cave' || this.door.style === 'lightCave') {
            if (this.door.definition.d === 'down') {
                return this.y + 64;
            }
        }
        if (this.door.definition.d === 'up' || this.door.definition.d === 'down') {
            // The top of the door frame is 20px from the ground.
            return this.y + 36;
        }
        // This left/right door frames are very tall because of the perspective.
        return this.y + 64;
    }
    render(context: CanvasRenderingContext2D, state: GameState) {
        const definition = this.door.definition;
        const doorStyle = doorStyles[this.door.style];
        if (doorStyle.renderForeground) {
            doorStyle.renderForeground(context, state, this.door);
            return;
        }
        if (doorStyle[definition.d] && this.door.status !== 'cracked') {
            let frame: Frame;
            if (this.door.status === 'blownOpen') {
                frame = doorStyle[definition.d].caveCeiling;
            } else {
                frame = doorStyle[definition.d].doorCeiling;
            }
            if (frame) {
                drawFrame(context, frame, { ...frame, x: this.door.x, y: this.door.y });
            }
        }
        if (this.door.status === 'frozen') {
            context.save();
                context.globalAlpha = 0.5;
                context.fillStyle = 'white';
                if (definition.d === 'up') {
                    context.fillRect(this.door.x, this.door.y, 32, 12);
                } else if (definition.d === 'down') {
                    context.fillRect(this.door.x, this.door.y + 20, 32, 12);
                } else if (definition.d === 'left') {
                    context.fillRect(this.door.x, this.door.y, 12, 32);
                } else if (definition.d === 'right') {
                    context.fillRect(this.door.x + 20, this.door.y, 12, 32);
                }
            context.restore();
        }
    }
}

export class Door implements ObjectInstance {
    behaviors: TileBehaviors = { };
    ignorePits = true;
    isObject = <const>true;
    linkedObject: Door;
    alwaysReset = true;
    updateDuringTransition = true;
    area: AreaInstance;
    drawPriority: DrawPriority = 'background';
    definition: EntranceDefinition = null;
    isNeutralTarget = true;
    x: number;
    y: number;
    status: ObjectStatus = 'normal';
    style: DoorStyle = 'cave';
    doorTop: DoorTop;
    // This gets set to true if this instance has been opened and is used to prevent the door
    // from closing automatically when logic is refreshed.
    wasOpened: boolean = false;
    isHot = false;
    constructor(state: GameState, definition: EntranceDefinition) {
        this.definition = definition;
        this.x = definition.x;
        this.y = definition.y;
        if (this.definition.d === 'up' && this.definition.price) {
            this.definition.status = 'closed';
        }
        this.status = definition.status || 'normal';
        this.refreshLogic(state);
        this.style = definition.style as DoorStyle;
        if (!doorStyles[this.style]) {
            this.style = 'cave';
        }
        this.doorTop = new DoorTop(this);
    }
    refreshLogic(state: GameState) {
        // If the player already opened this door, set it to the appropriate open status.
        if (getObjectStatus(state, this.definition) || this.wasOpened) {
            if (this.definition.status === 'cracked' || this.definition.status === 'blownOpen') {
                this.changeStatus(state, 'blownOpen');
            } else {
                this.changeStatus(state, 'normal');
            }
        } else {
            this.changeStatus(state, this.definition.status);
        }
        // 'closedEnemy' doors will start open and only close when we confirm there are enemies in the current
        // are section. This way we don't play the secret chime every time we enter a room with a closed enemy
        // door where the enemies are already defeated (or there are not yet enemies).
        if (this.definition.status === 'closedEnemy') {
            this.changeStatus(state, !this.area?.enemies.length ? 'normal' : 'closedEnemy');
        }
        this.refreshIsHot(state);
    }
    refreshIsHot(state: GameState) {
        if (!this.area) {
            return;
        }
        // For a door you can walk through, we need to check if the section on the other side is hot.
        if (!this.definition.targetObjectId || !this.definition.targetZone) {
            // This logic is only valid if this door is at the same coordinates as the current super tile.
            if (this.area !== state.areaInstance && this.area !== state.alternateAreaInstance) {
                return;
            }
            // This is a fairly crude way of choosing a point in the section that the player ought to be
            // in after walking through this door.
            let gridX = state.location.areaGridCoords.x;
            let gridY = state.location.areaGridCoords.y;
            let x = this.x + 8 + directionMap[this.definition.d][0] * 96;
            let y = this.y + 8 + directionMap[this.definition.d][1] * 96;
            if (x < 0) {
                x += 512;
                gridX--;
            } else if (x > 512) {
                x -= 512
                gridX++;
            }
            if (y < 0) {
                y += 512;
                gridY--;
            } else if (y > 512) {
                y -= 512
                gridY++;
            }
            this.isHot = isLocationHot(state, {
                ...state.location,
                isSpiritWorld: this.area.definition.isSpiritWorld,
                areaGridCoords: {x: gridX, y: gridY},
                x,
                y,
                d: state.hero.d,
            });
            return;
        }
        const location = findObjectLocation(
            state,
            this.definition.targetZone,
            this.definition.targetObjectId,
            this.area.definition.isSpiritWorld,
            this.definition
        );
        if (location) {
            this.isHot = isLocationHot(state, location);
        }
    }
    getParts(state: GameState) {
        return [this.doorTop];
    }
    isOpen(): boolean {
        return this.status === 'normal' || this.status === 'blownOpen';
    }
    // Hero cannot enter doors while they are jumping down/falling in front of a door.
    heroCanEnter(state: GameState): boolean {
        return state.hero.area === this.area && state.hero.action !== 'jumpingDown' && state.hero.z <= 8;
    }
    renderOpen(state: GameState): boolean {
        const heroIsTouchingDoor = boxesIntersect(pad(state.hero.getMovementHitbox(), 0), this.getHitbox()) && this.heroCanEnter(state);
        return heroIsTouchingDoor || this.status === 'normal' || this.status === 'blownOpen' || this.status === 'frozen' || state.hero.actionTarget === this;
    }
    changeStatus(state: GameState, status: ObjectStatus): void {
        const forceOpen = evaluateLogicDefinition(state, this.definition.openLogic, false);
        let isOpen = status === 'normal' || status === 'blownOpen';
        const wasOpen = this.status === 'normal' || this.status === 'blownOpen';
        this.wasOpened = isOpen;

        if (forceOpen) {
            status = (status === 'cracked') ? 'blownOpen' : 'normal';
            isOpen = true;
        }
        this.status = status;
        if (this.linkedObject && this.linkedObject.status !== status) {
            this.linkedObject.changeStatus(state, status);
        }
        if (this.definition.id && isOpen && !forceOpen) {
            // Update the other half of this door if it is in the same super tile and doesn't use a wipe transition.
            for (const object of (this.area?.objects || [])) {
                if (object?.definition?.type === 'door' &&
                    !object.definition.targetZone &&
                    object.definition.id === this.definition.id &&
                    object.definition.status === this.definition.status &&
                    object.status !== this.status
                ) {
                    object.changeStatus(state, this.status);
                }
            }
            // Only save the status when the door isn't being forced open.
            saveObjectStatus(state, this.definition, true);
        }
        if (!this.area) {
            return;
        }
        if (!wasOpen && isOpen) {
            playAreaSound(state, this.area, 'doorOpen');
        } else if (wasOpen && !isOpen) {
            playAreaSound(state, this.area, 'doorClose');
        }
        this.applyDoorBehaviorsToArea();
    }
    applyWideSouthernDoorBehaviorToArea() {
        const y = Math.floor(this.y / 16);
        const x = Math.floor(this.x / 16);
        applyBehaviorToTile(this.area, x, y, { solidMap: BITMAP_BOTTOM, solid: false, low: false, lowCeiling: true});
        applyBehaviorToTile(this.area, x + 3, y, { solidMap: BITMAP_BOTTOM, solid: false, low: false, lowCeiling: true});
        if (this.isOpen()) {
            applyBehaviorToTile(this.area, x + 1, y, { solidMap: BITMAP_BOTTOM_LEFT_QUARTER, solid: false, low: false, lowCeiling: true });
            applyBehaviorToTile(this.area, x + 2, y, { solidMap: BITMAP_BOTTOM_RIGHT_QUARTER, solid: false, low: false, lowCeiling: true });
        } else {
            applyBehaviorToTile(this.area, x + 1, y, { solidMap: BITMAP_BOTTOM, solid: false, low: false, lowCeiling: true});
            applyBehaviorToTile(this.area, x + 2, y, { solidMap: BITMAP_BOTTOM, solid: false, low: false, lowCeiling: true});
        }
    }
    applyDoorBehaviorsToArea() {
        const y = Math.floor(this.y / 16);
        const x = Math.floor(this.x / 16);
        const doorStyle = doorStyles[this.style];
        // The wooden door behavior is slightly different because the graphic is 3 tiles tall instead of 4.
        if (this.style === 'wooden') {
            if (this.definition.d === 'down') {
                this.applyWideSouthernDoorBehaviorToArea();
            } else if (this.definition.d === 'up') {
                this.applySquareDoorBehavior();
            } else { // left + right are the same
                applyBehaviorToTile(this.area, x, y, { solid: true, low: false });
                applyBehaviorToTile(this.area, x, y + 1, { solid: true, low: false });
                applyBehaviorToTile(this.area, x, y + 3, { solid: true, low: false });
                if (this.isOpen()) {
                    applyBehaviorToTile(this.area, x, y + 1, { solid: false, lowCeiling: true });
                    applyBehaviorToTile(this.area, x, y + 2, { solid: false, lowCeiling: true  });
                } else {
                    applyBehaviorToTile(this.area, x, y + 1, { solid: true, low: false });
                    applyBehaviorToTile(this.area, x, y + 2, { solid: true, low: false });
                }
            }
        } else if (this.style === 'cavern' || this.style === 'crystal' || this.style === 'stone') {
            if (this.definition.d === 'down') {
                this.applyWideSouthernDoorBehaviorToArea();
            } else if (this.definition.d === 'up') {
                this.applySquareDoorBehavior();
            } else { // left + right are the same
                applyBehaviorToTile(this.area, x, y, { solid: true, low: false });
                applyBehaviorToTile(this.area, x, y + 1, { solid: true, low: false });
                applyBehaviorToTile(this.area, x, y + 3, { solid: true, low: false });
                if (this.isOpen()) {
                    applyBehaviorToTile(this.area, x, y + 2, { solid: false, lowCeiling: true  });
                } else {
                    applyBehaviorToTile(this.area, x, y + 2, { solid: true, low: false });
                }
            }
        } else if (this.style === 'ladderDown') {
            const behaviors: TileBehaviors = this.isOpen() ? { cannotLand: true, climbable: true } : { solid: true, low: false};
            applyBehaviorToTile(this.area, x, y, behaviors);
        } else if (this.style === 'ladderUp') {
            const behaviors: TileBehaviors = this.isOpen() ? { cannotLand: true, climbable: true } : { solid: true, low: false};
            applyBehaviorToTile(this.area, x, y, behaviors);
            applyBehaviorToTile(this.area, x, y + 1, behaviors);
        } else if (this.style === 'ladderUpTall') {
            const behaviors: TileBehaviors = this.isOpen() ? { cannotLand: true, climbable: true } : { solid: true, low: false};
            applyBehaviorToTile(this.area, x, y, behaviors);
            applyBehaviorToTile(this.area, x, y + 1, behaviors);
            applyBehaviorToTile(this.area, x, y + 2, behaviors);
            applyBehaviorToTile(this.area, x, y + 3, behaviors);
            applyBehaviorToTile(this.area, x, y + 4, behaviors);
            applyBehaviorToTile(this.area, x, y + 5, behaviors);
        } else if (doorStyle.w === 64) {
            const behaviors: TileBehaviors = this.isOpen() ? { cannotLand: true, solid: false, low: true, lowCeiling: true  } : { solid: true, low: false};
            if (this.definition.d === 'up' || this.definition.d === 'down') {
                if (this.definition.d === 'up') {
                    behaviors.solidMap = BITMAP_TOP;
                } else {
                    behaviors.solidMap = BITMAP_BOTTOM;
                }
                applyBehaviorToTile(this.area, x, y, behaviors);
                applyBehaviorToTile(this.area, x + 1, y, behaviors);
                applyBehaviorToTile(this.area, x + 2, y, behaviors);
                applyBehaviorToTile(this.area, x + 3, y, behaviors);
            } else {
                if (this.definition.d === 'left') {
                    behaviors.solidMap = BITMAP_LEFT;
                } else {
                    behaviors.solidMap = BITMAP_RIGHT;
                }
                applyBehaviorToTile(this.area, x, y, behaviors);
                applyBehaviorToTile(this.area, x, y + 1, behaviors);
                applyBehaviorToTile(this.area, x, y + 2, behaviors);
                applyBehaviorToTile(this.area, x, y + 3, behaviors);
            }
        } else if (doorStyle.w === 32) {
            this.applySquareDoorBehavior();
        }
        if (this.status === 'normal' || this.status === 'blownOpen') {
            delete this.behaviors.solid;
            if (this.definition.status === 'closed'
                || this.definition.status === 'closedSwitch'
                || this.definition.status === 'closedEnemy'
            ) {
                this.behaviors.brightness = 0.5;
                this.behaviors.lightRadius = 36;
            }
        } else {
            this.behaviors.solid = true;
            delete this.behaviors.brightness;
            delete this.behaviors.lightRadius;
        }
    }
    applySquareDoorBehavior() {
        const y = Math.floor(this.y / 16);
        const x = Math.floor(this.x / 16);
        const behaviors: TileBehaviors = { cannotLand: true, solid: true, solidMap: undefined, low: false};
        applyBehaviorToTile(this.area, x, y, behaviors);
        applyBehaviorToTile(this.area, x + 1, y, behaviors);
        applyBehaviorToTile(this.area, x, y + 1, behaviors);
        applyBehaviorToTile(this.area, x + 1, y + 1, behaviors);
        if (this.isOpen()) {
            if (this.definition.d === 'left') {
                applyBehaviorToTile(this.area, x + 1, y, { solidMap: BITMAP_SIDE_DOOR_TOP, solid: false, low: false, lowCeiling: true });
                applyBehaviorToTile(this.area, x + 1, y + 1, { solidMap: BITMAP_SIDE_DOOR_BOTTOM, solid: false, low: false, lowCeiling: true });
            } else if (this.definition.d === 'right') {
                applyBehaviorToTile(this.area, x, y, { solidMap: BITMAP_SIDE_DOOR_TOP, solid: false, low: false, lowCeiling: true });
                applyBehaviorToTile(this.area, x, y + 1, { solidMap: BITMAP_SIDE_DOOR_BOTTOM, solid: false, low: false, lowCeiling: true });
            } else if (this.definition.d === 'up') {
                applyBehaviorToTile(this.area, x, y + 1, { solidMap: BITMAP_LEFT, solid: false, low: false, lowCeiling: true });
                applyBehaviorToTile(this.area, x + 1, y + 1, { solidMap: BITMAP_RIGHT, solid: false, low: false, lowCeiling: true });
            } else if (this.definition.d === 'down') {
                applyBehaviorToTile(this.area, x, y, { solidMap: BITMAP_LEFT, solid: false, low: false, lowCeiling: true });
                applyBehaviorToTile(this.area, x + 1, y, { solidMap: BITMAP_RIGHT, solid: false, low: false, lowCeiling: true });
            }
        }
    }
    add(state: GameState, area: AreaInstance) {
        this.area = area;
        area.objects.push(this);
        this.applyDoorBehaviorsToArea();
        this.refreshIsHot(state);
    }
    getEditorHitbox(): Rect {
        const hitbox = this.getHitbox();
        return {x: this.x, y: this.y, w: Math.max(16, hitbox.w), h: Math.max(16, hitbox.h)};
    }
    getHitbox(): Rect {
        const doorStyle = doorStyles[this.style];
        if (doorStyle.getHitbox) {
            return doorStyle.getHitbox(this);
        }
        if (this.definition.d === 'up' || this.definition.d === 'down') {
            if (this.definition.style === 'wooden') {
                return {x: this.x, y: this.y + 8, w: doorStyles[this.style].w, h: 8 };
            }
            return { x: this.x, y: this.y, w: doorStyles[this.style].w, h: doorStyles[this.style].h};
        }
        return { x: this.x, y: this.y, w: doorStyles[this.style].h, h: doorStyles[this.style].w};
    }
    onPush(state: GameState, direction: Direction): void {
        if (direction === this.definition.d) {
            this.tryToUnlock(state);
        }
    }
    tryToUnlock(state: GameState): boolean {
        const dungeonInventory = state.savedState.dungeonInventories[state.location.logicalZoneKey];
        if (this.status === 'locked' && dungeonInventory?.smallKeys) {
            dungeonInventory.smallKeys--;
        } else if (this.status === 'bigKeyLocked' && dungeonInventory?.bigKey) {
        } else {
            return false;
        }
        this.changeStatus(state, 'normal');
        return true;
    }
    onGrab(state: GameState, d: Direction, hero: Hero) {
        if (hero.d === 'up' && hero === state.hero &&
            this.definition.d === 'up' && this.status === 'closed' && this.definition.price
        ) {
            state.hero.action = null;
            if (this.definition.price > state.hero.money) {
                showMessage(state, 'You need more Jade to open this door.');
                return;
            }
            state.hero.money -= this.definition.price;
            this.changeStatus(state, 'normal');
        }
        if (!this.tryToUnlock(state)) {
            if (this.status === 'bigKeyLocked') {
                showMessage(state, 'You need a special key to open this door.');
                state.hero.action = null;
            } else if (this.status === 'locked') {
                showMessage(state, 'You need a small key to open this door.');
                state.hero.action = null;
            }
        }
    }
    onDestroy(state: GameState) {
        if (this.status === 'cracked') {
            this.changeStatus(state, 'blownOpen');
        }
    }
    onHit(state: GameState, hit: HitProperties): HitResult {
        if (this.status === 'frozen') {
            if (hit.element === 'fire') {
                this.changeStatus(state, 'normal');
                return { hit: true };
            }
            return { hit: true, blocked: true };
        }
        return {};
    }
    // This is probably only needed by the editor since doors are not removed during gameplay.
    remove(state: GameState) {
        const y = Math.floor(this.y / 16);
        const x = Math.floor(this.x / 16);
        const doorStyle = doorStyles[this.style];
        if (this.style === 'ladderDown') {
            resetTileBehavior(this.area, {x, y});
        } else if (this.style === 'ladderUp') {
            resetTileBehavior(this.area, {x, y});
            resetTileBehavior(this.area, {x, y: y + 1});
        } else if (doorStyle.w === 64) {
            if (this.definition.d === 'up' || this.definition.d === 'down') {
                resetTileBehavior(this.area, {x, y});
                resetTileBehavior(this.area, {x: x + 1, y});
                resetTileBehavior(this.area, {x: x + 2, y});
                resetTileBehavior(this.area, {x: x + 3, y});
            } else {
                resetTileBehavior(this.area, {x, y});
                resetTileBehavior(this.area, {x, y: y + 1});
                resetTileBehavior(this.area, {x, y: y + 2});
                resetTileBehavior(this.area, {x, y: y + 3});
            }
        } else if (doorStyle.w === 32) {
            resetTileBehavior(this.area, {x, y});
            resetTileBehavior(this.area, {x: x + 1, y});
            resetTileBehavior(this.area, {x, y: y + 1});
            resetTileBehavior(this.area, {x: x + 1, y: y + 1});
        }
        const index = this.area.objects.indexOf(this);
        if (index >= 0) {
            this.area.objects.splice(index, 1);
        }
        this.area = null;
    }
    isStairs(state: GameState): boolean {
        return !!doorStyles[this.style].isStairs;
    }
    update(state: GameState) {
        if (this.status !== 'normal' && this.status !== 'blownOpen' && getObjectStatus(state, this.definition)) {
            if (this.definition.status === 'cracked') {
                this.changeStatus(state, 'blownOpen');
            } else {
                this.changeStatus(state, 'normal');
            }
        }
        let hero = state.hero;
        // Nothing to update if the hero cannot enter the door.
        if (!this.heroCanEnter(state)) {
            return;
        }
        if (this.status === 'normal' && this.isHot) {
            if (state.fieldTime % 40 === 0) {
                let hitbox = {...this.getHitbox()};
                if (this.definition.d === 'up') {
                    hitbox.x += 5;
                    hitbox.w -= 10;
                    hitbox.z = 0;
                    hitbox.zd = hitbox.h - 8;
                    hitbox.y += hitbox.h - 2;
                    hitbox.h = 0;
                } else {
                    hitbox.y += 6;
                    hitbox = pad(hitbox, -4);
                }
                addSparkleAnimation(state, this.area, hitbox, {
                    element: 'fire',
                }, {
                    drawPriority: 'sprites',
                    vx: (-1 + Math.random() / 2) * directionMap[this.definition.d][0],
                    vy: (-1 + Math.random() / 2) * directionMap[this.definition.d][1],
                });
            }
        }
        // For some reason this can trigger when the door is closed after recent movement changes
        // so we reduce the
        const heroIsTouchingDoor = boxesIntersect(pad(hero.getMovementHitbox(), 0), this.getHitbox());
        if (heroIsTouchingDoor &&
            // If the hero has no action target, have the door control them as soon as they touch it
            (!hero.actionTarget || (hero.actionTarget !== this && !hero.isExitingDoor))
        ) {
            // When doorways come in pairs, we set `isExitingDoor` to true when control
            // passes from the entrance door to the door they are exiting from.
            if (hero.actionTarget && hero.actionTarget !== this) {
                hero.isExitingDoor = true;
            }
            hero.isUsingDoor = true;
            hero.actionFrame = 0;
            hero.actionTarget = this;
            hero.actionDx = 0;
            hero.actionDy = 0;
            if (hero.isExitingDoor) {
                // When exiting a door, always move in the opposite direction the door is facing.
                hero.actionDx = -directionMap[this.definition.d][0];
                hero.actionDy = -directionMap[this.definition.d][1];
            } else if (this.definition.d === 'up' || this.definition.d === 'down') {
                hero.actionDy = (hero.y + hero.h / 2 < this.y + 16) ? 1 : -1;
            } else {
                hero.actionDx = (hero.x + hero.w / 2 < this.x + 16) ? 1 : -1;
            }
        }
        if (hero.actionTarget === this) {
            const x = hero.x + hero.w / 2 + hero.actionDx * hero.w / 2;
            const y = hero.y + hero.h / 2 + hero.actionDy * hero.h / 2;
            const hitbox = this.getHitbox();
            let changedZones = false;
            if (this.style === 'ladderUp') {
                const reachedTop = hero.y <= this.y;
                if (reachedTop) {
                    changedZones = this.travelToZone(state);
                    // 'ladderUp' is only for changing zones so make the hero climb back down if changing zones fails.
                    if (!changedZones) {
                        hero.isExitingDoor = true;
                        // Go back down the ladder if this was a missing target object.
                        // Otherwise keep going up so the ladder can be used to climb short walls.
                        if (this.definition.targetZone && this.definition.targetObjectId) {
                            hero.actionDx = -directionMap[this.definition.d][0];
                            hero.actionDy = -directionMap[this.definition.d][1];
                        }
                    }
                }
            } else if (this.style === 'ladderDown') {
                const reachedBottom = hero.y >= this.y;
                if (reachedBottom) {
                    changedZones = this.travelToZone(state);
                    // 'ladderDown' is only for changing zones so make the hero climb back up if changing zones fails.
                    if (!changedZones) {
                        hero.isExitingDoor = true;
                        hero.actionDx = -directionMap[this.definition.d][0];
                        hero.actionDy = -directionMap[this.definition.d][1];
                    }
                }
            } else {
                changedZones = (!isPointInShortRect(x, y, hitbox) || isObjectInsideTarget(hero, hitbox)) && this.travelToZone(state);
            }
        }
    }
    travelToZone(state: GameState) {
        let hero = state.hero;
        if (hero.isExitingDoor || !this.definition.targetZone || !this.definition.targetObjectId) {
            return false;
        }
        return enterZoneByTarget(state, this.definition.targetZone, this.definition.targetObjectId, this.definition, false);
    }
    render(context: CanvasRenderingContext2D, state: GameState) {
        const doorStyle = doorStyles[this.style];
        context.fillStyle = '#888';
        if (this.definition.d === 'up' && this.status === 'closed' && this.definition.price) {
            const hitbox = this.getHitbox();
            drawText(context, `${this.definition.price}`,
                hitbox.x + hitbox. w / 2, hitbox.y + hitbox.h + 2, {
                textBaseline: 'top',
                textAlign: 'center',
                size: 16,
            });
        }
        if (doorStyle.render) {
            doorStyle.render(context, state, this);
            if (this.definition.d === 'down'
                && (this.definition.targetZone === 'overworld' || this.definition.targetZone === 'sky')
                && this.isOpen()
            ) {
                // For some reasont his renders when the door is closed while editing, which isn't a problem,
                // but I would like to understand at some point.
                drawFrame(context, entranceLightFrame, {...entranceLightFrame, x: this.x, y: this.y - 16});
            }
        } else if (doorStyle[this.definition.d]) {
            let frame: Frame;
            if (this.status !== 'cracked') {
                if (this.status === 'blownOpen') {
                    frame = doorStyle[this.definition.d].cave;
                } else {
                    frame = doorStyle[this.definition.d].doorFrame;
                }
                drawFrame(context, frame, { ...frame, x: this.x, y: this.y });
            }
            if (this.status === 'frozen') {
                context.save();
                    context.globalAlpha = 0.5;
                    context.fillStyle = 'white';
                    context.fillRect(this.x, this.y, 32, 32);
                context.restore();
                return;
            }
            if (this.renderOpen(state)) {
                return;
            }
            switch (this.status) {
                case 'cracked':
                    frame = doorStyle[this.definition.d].cracked;
                    break;
                case 'blownOpen':
                    frame = doorStyle[this.definition.d].cave;
                    break;
                case 'locked':
                    frame = doorStyle[this.definition.d].locked;
                    break;
                case 'bigKeyLocked':
                    frame = doorStyle[this.definition.d].bigKeyLocked;
                    break;
                default:
                    frame = doorStyle[this.definition.d].doorClosed;
                    break;
            }
            drawFrame(context, frame, { ...frame, x: this.x, y: this.y });
        } else if (doorStyle.w === 64) {
            if (!this.isOpen() && state.hero.actionTarget !== this) {
                const hitbox = this.getHitbox();
                context.fillRect(hitbox.x, hitbox.y, hitbox.w, hitbox.h);
            } else {
                // Display nothing when this entrance is open.
            }
        } else if (doorStyle.w === 32) {
            if (!this.isOpen() || state.hero.actionTarget === this) {
                if (this.definition.d === 'left' || this.definition.d === 'right') {
                    context.fillRect(this.x, this.y, 32, 8);
                    context.fillRect(this.x, this.y + 24, 32, 8);
                } else {
                    context.fillRect(this.x, this.y, 8, 32);
                    context.fillRect(this.x + 24, this.y, 8, 32);
                }
            } else {
                context.fillRect(this.x, this.y, 32, 32);
            }
        }
    }
}
objectHash.door = Door;
objectHash.stairs = Door;


class _Door extends Door {}
declare global {
    export interface Door extends _Door {}
}
