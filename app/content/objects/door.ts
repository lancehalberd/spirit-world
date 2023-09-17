import { addSparkleAnimation } from 'app/content/effects/animationEffect';
import { evaluateLogicDefinition } from 'app/content/logic';
import { doorStyles, DoorStyle } from 'app/content/objects/doorStyles';
import { objectHash } from 'app/content/objects/objectHash';
import { playAreaSound } from 'app/musicController';
import { showMessage } from 'app/scriptEvents';
import { createAnimation, drawFrame } from 'app/utils/animations';
import { enterZoneByTarget, findObjectLocation, isLocationHot } from 'app/utils/enterZoneByTarget';
import { directionMap } from 'app/utils/field';
import { boxesIntersect, isObjectInsideTarget, isPointInShortRect, pad } from 'app/utils/index';
import { getObjectStatus, saveObjectStatus } from 'app/utils/objects';
import { drawText } from 'app/utils/simpleWhiteFont';

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

export class OpenDoorPath implements ObjectInstance {
    get area(): AreaInstance {
        return this.door.area;
    }
    drawPriority: 'sprites' = 'sprites';
    status: ObjectStatus;
    x = this.door.x;
    y = this.door.y;
    ignorePits = true;
    isObject = <const>true;
    constructor(public door: Door) { }
    getBehaviors(state: GameState) {
        const style = doorStyles[this.door.style] || doorStyles.cavern;
        return style.pathBehaviors || {isGround: true, lowCeiling: true};
    }
    getHitbox(): Rect {
        const style = doorStyles[this.door.style] || doorStyles.cavern;
        return style.getPathHitbox(this.door);
    }
    render(context: CanvasRenderingContext2D, state: GameState) {
        // Uncomment this to debug the hitbox for door paths.
        /*context.save();
            context.globalAlpha *= 0.3;
            context.fillStyle = 'blue';
            const hitbox = this.getHitbox();
            context.fillRect(hitbox.x, hitbox.y, hitbox.w, hitbox.h);
        context.restore();*/
    }
}

export class Door implements ObjectInstance {
    // The door itself is always solid, but an OpenDoorPath object will be added when
    // the door is open that allows walking on the path part of the door.
    behaviors: TileBehaviors = {solid: true};
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
    doorPath: OpenDoorPath;
    // This gets set to true if this instance has been opened and is used to prevent the door
    // from closing automatically when logic is refreshed.
    wasOpened: boolean = false;
    isHot = false;
    refreshHotStatus = true;
    isLadder = false;
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
        this.doorPath = new OpenDoorPath(this);

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
            this.changeStatus(state, 'normal');
        }
        this.refreshHotStatus = true;
    }
    refreshIsHot(state: GameState) {
        if (!this.area) {
            return;
        }
        this.refreshHotStatus = false;
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
                x += this.area.w * 16;
                gridX--;
            } else if (x > this.area.w * 16) {
                x -= this.area.w * 16
                gridX++;
            }
            if (y < 0) {
                y += this.area.h * 16;
                gridY--;
            } else if (y > this.area.h * 16) {
                y -= this.area.h * 16
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
        const parts: ObjectInstance[] = [this.doorTop];
        if (this.isOpen()) {
            parts.push(this.doorPath);
        }
        return parts;
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
        const wasFrozen = this.status === 'frozen';
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
        if (!wasOpen && isOpen && !wasFrozen) {
            playAreaSound(state, this.area, 'doorOpen');
        } else if (wasOpen && !isOpen && !this.renderOpen(state)) {
            playAreaSound(state, this.area, 'doorClose');
        }
    }
    getEditorHitbox(): Rect {
        const hitbox = this.getHitbox();
        return {x: this.x, y: this.y, w: Math.max(16, hitbox.w), h: Math.max(16, hitbox.h)};
    }
    getHitbox(): Rect {
        const doorStyle = doorStyles[this.style];
        return doorStyle.getHitbox(this);
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
            if (this.definition.price > state.hero.savedData.money) {
                showMessage(state, 'You need more Jade to open this door.');
                return;
            }
            state.hero.savedData.money -= this.definition.price;
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
        if (this.area && this.refreshHotStatus) {
            this.refreshIsHot(state);
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
        const heroIsTouchingDoor = boxesIntersect(hero.getMovementHitbox(), this.getHitbox());
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
            if (this.style === 'ladderUp' || this.style === 'ladderUpTall') {
                const reachedTop = hero.y <= this.y;
                if (reachedTop) {
                    // 'ladderUp' is only for changing zones so make the hero climb back down if changing zones fails.
                    if (!this.travelToZone(state)) {
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
                    // 'ladderDown' is only for changing zones so make the hero climb back up if changing zones fails.
                    if (!this.travelToZone(state)) {
                        hero.isExitingDoor = true;
                        hero.actionDx = -directionMap[this.definition.d][0];
                        hero.actionDy = -directionMap[this.definition.d][1];
                    }
                }
            } else {
                const shouldChangezones = this.definition.targetZone && this.definition.targetObjectId
                    && (!isPointInShortRect(x, y, hitbox) || isObjectInsideTarget(hero, hitbox));
                if (shouldChangezones && !this.travelToZone(state)) {
                    hero.isExitingDoor = true;
                    hero.actionDx = -directionMap[this.definition.d][0];
                    hero.actionDy = -directionMap[this.definition.d][1];
                }
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
        }
    }
}
objectHash.door = Door;
objectHash.stairs = Door;


class _Door extends Door {}
declare global {
    export interface Door extends _Door {}
}
