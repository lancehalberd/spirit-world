import _ from 'lodash';

import { enterZoneByTarget, resetTileBehavior } from 'app/content/areas';
import { findObjectInstanceById } from 'app/content/objects';
import {
    BITMAP_LEFT, BITMAP_RIGHT,
} from 'app/content/bitMasks';
import { showMessage } from 'app/render/renderMessage';
import { saveGame } from 'app/state';
import { createAnimation, drawFrame } from 'app/utils/animations';
import { directionMap, getDirection } from 'app/utils/field';
import { boxesIntersect, isObjectInsideTarget, isPointInShortRect } from 'app/utils/index';

import {
    AreaInstance, Direction, DrawPriority, Frame, GameState, ObjectInstance,
    ObjectStatus, EntranceDefinition, ShortRectangle, TileBehaviors
} from 'app/types';


const BITMAP_SIDE_DOOR_TOP: Uint16Array = new Uint16Array([
    0xFFFF, 0xFFFF, 0xFFFF, 0xFFFF, 0xFFFF, 0xFFFF, 0xFFFF, 0xFFFF,
    0xFFFF, 0xFFFF, 0xFFFF, 0, 0, 0, 0, 0,
]);
const BITMAP_SIDE_DOOR_BOTTOM: Uint16Array = new Uint16Array([
    0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0xFFFF, 0xFFFF, 0xFFFF, 0xFFFF, 0xFFFF,
]);

const [
    southCrackedWall, southCaveFrame, southCaveCeiling, southCave,
    southCaveDoorFrame, southCaveDoorCeiling, /*southCaveDoorClosed*/,
    /*southLockedDoorWood*/, southLockedDoorSteel, southLockedDoorBig,
] = createAnimation('gfx/tiles/cavewalls.png', {w: 32, h: 32}, {x: 1, y: 1, cols: 10}).frames;

const [
    eastCrackedWall, eastCaveFrame, eastCaveCeiling, eastCave,
    eastCaveDoorFrame, eastCaveDoorCeiling, /*eastCaveDoorClosed*/,
    /*eastLockedDoorWood*/, eastLockedDoorSteel, eastLockedDoorBig,
] = createAnimation('gfx/tiles/cavewalls.png', {w: 32, h: 32}, {x: 1, y: 2, cols: 10}).frames;

const [
    northCrackedWall, northCaveFrame, northCaveCeiling, northCave,
    northCaveDoorFrame, northCaveDoorCeiling, /*northCaveDoorClosed*/,
    /*northLockedDoorWood*/, northLockedDoorSteel, northLockedDoorBig,
] = createAnimation('gfx/tiles/cavewalls.png', {w: 32, h: 32}, {x: 1, y: 3, cols: 10}).frames;

const [
    westCrackedWall, westCaveFrame, westCaveCeiling, westCave,
    westCaveDoorFrame, westCaveDoorCeiling, /*westCaveDoorClosed*/,
    /*westLockedDoorWood*/, westLockedDoorSteel, westLockedDoorBig,
] = createAnimation('gfx/tiles/cavewalls.png', {w: 32, h: 32}, {x: 1, y: 4, cols: 10}).frames;

const [
    southTrapDoor, eastTrapDoor, northTrapDoor, westTrapDoor,
] = createAnimation('gfx/tiles/trapdoor.png', {w: 32, h: 32}, {rows: 4}).frames;

const [
    lightSouthCrackedWall, lightSouthCaveFrame, lightSouthCaveCeiling, /*southCave*/,
    lightSouthCaveDoorFrame, lightSouthCaveDoorCeiling,
] = createAnimation('gfx/tiles/cavewalls2temp.png', {w: 32, h: 32}, {x: 1, y: 1, cols: 6}).frames;

const [
    lightEastCrackedWall, lightEastCaveFrame, lightEastCaveCeiling, /*lightEastCave*/,
    lightEastCaveDoorFrame, lightEastCaveDoorCeiling,
] = createAnimation('gfx/tiles/cavewalls2temp.png', {w: 32, h: 32}, {x: 1, y: 2, cols: 6}).frames;

const [
    lightNorthCrackedWall, lightNorthCaveFrame, lightNorthCaveCeiling, /*lightNorthCave*/,
    lightNorthCaveDoorFrame, lightNorthCaveDoorCeiling,
] = createAnimation('gfx/tiles/cavewalls2temp.png', {w: 32, h: 32}, {x: 1, y: 3, cols: 6}).frames;

const [
    lightWestCrackedWall, lightWestCaveFrame, lightWestCaveCeiling, /*lightWestCave*/,
    lightWestCaveDoorFrame, lightWestCaveDoorCeiling,
] = createAnimation('gfx/tiles/cavewalls2temp.png', {w: 32, h: 32}, {x: 1, y: 4, cols: 6}).frames;

interface DoorStyleFrames {
    doorFrame: Frame,
    doorCeiling: Frame,
    doorClosed: Frame,
    cracked: Frame,
    caveFrame: Frame,
    caveCeiling: Frame,
    cave: Frame,
    locked: Frame,
    bigKeyLocked: Frame,
}
interface DoorStyleDefinition {
    w: number,
    h: number,
    down?: DoorStyleFrames,
    right?: DoorStyleFrames,
    up?: DoorStyleFrames,
    left?: DoorStyleFrames,
}

export const doorStyles: {[key: string]: DoorStyleDefinition} = {
    cave: {
        w: 32,
        h: 32,
        down: {
            doorFrame: southCaveDoorFrame, doorCeiling: southCaveDoorCeiling, doorClosed: southTrapDoor,
            cracked: southCrackedWall,
            caveFrame: southCaveFrame,
            caveCeiling: southCaveCeiling,
            cave: southCave,
            locked: southLockedDoorSteel,
            bigKeyLocked: southLockedDoorBig,
        },
        right: {
            doorFrame: eastCaveDoorFrame, doorCeiling: eastCaveDoorCeiling, doorClosed: eastTrapDoor,
            cracked: eastCrackedWall,
            caveFrame: eastCaveFrame,
            caveCeiling: eastCaveCeiling,
            cave: eastCave,
            locked: eastLockedDoorSteel,
            bigKeyLocked: eastLockedDoorBig,
        },
        up: {
            doorFrame: northCaveDoorFrame, doorCeiling: northCaveDoorCeiling, doorClosed: northTrapDoor,
            cracked: northCrackedWall,
            caveFrame: northCaveFrame,
            caveCeiling: northCaveCeiling,
            cave: northCave,
            locked: northLockedDoorSteel,
            bigKeyLocked: northLockedDoorBig,
        },
        left: {
            doorFrame: westCaveDoorFrame, doorCeiling: westCaveDoorCeiling, doorClosed: westTrapDoor,
            cracked: westCrackedWall,
            caveFrame: westCaveFrame,
            caveCeiling: westCaveCeiling,
            cave: westCave,
            locked: westLockedDoorSteel,
            bigKeyLocked: westLockedDoorBig,
        },
    },
    lightCave: {
        w: 32,
        h: 32,
        down: {
            doorFrame: lightSouthCaveDoorFrame, doorCeiling: lightSouthCaveDoorCeiling, doorClosed: southTrapDoor,
            cracked: lightSouthCrackedWall,
            caveFrame: lightSouthCaveFrame,
            caveCeiling: lightSouthCaveCeiling,
            cave: southCave,
            locked: southLockedDoorSteel,
            bigKeyLocked: southLockedDoorBig,
        },
        right: {
            doorFrame: lightEastCaveDoorFrame, doorCeiling: lightEastCaveDoorCeiling, doorClosed: eastTrapDoor,
            cracked: lightEastCrackedWall,
            caveFrame: lightEastCaveFrame,
            caveCeiling: lightEastCaveCeiling,
            cave: eastCave,
            locked: eastLockedDoorSteel,
            bigKeyLocked: eastLockedDoorBig,
        },
        up: {
            doorFrame: lightNorthCaveDoorFrame, doorCeiling: lightNorthCaveDoorCeiling, doorClosed: northTrapDoor,
            cracked: lightNorthCrackedWall,
            caveFrame: lightNorthCaveFrame,
            caveCeiling: lightNorthCaveCeiling,
            cave: northCave,
            locked: northLockedDoorSteel,
            bigKeyLocked: northLockedDoorBig,
        },
        left: {
            doorFrame: lightWestCaveDoorFrame, doorCeiling: lightWestCaveDoorCeiling, doorClosed: westTrapDoor,
            cracked: lightWestCrackedWall,
            caveFrame: lightWestCaveFrame,
            caveCeiling: lightWestCaveCeiling,
            cave: westCave,
            locked: westLockedDoorSteel,
            bigKeyLocked: westLockedDoorBig,
        },
    },
    square: {
        w: 32,
        h: 32,
    },
    wideEntrance: {
        w: 64,
        h: 16,
    },
};
type DoorStyle = keyof typeof doorStyles;


function applyBehaviorToTile(area: AreaInstance, x: number, y: number, behavior: TileBehaviors): void {
    if (!area.behaviorGrid[y]) {
        area.behaviorGrid[y] = [];
    }
    if (!area.behaviorGrid[y][x]) {
        area.behaviorGrid[y][x] = {};
    }
    area.behaviorGrid[y][x] = {...area.behaviorGrid[y][x], ...behavior};
}

export class Door implements ObjectInstance {
    linkedObject: Door;
    alwaysReset = true;
    updateDuringTransition = true;
    area: AreaInstance;
    drawPriority: DrawPriority = 'background';
    definition: EntranceDefinition = null;
    x: number;
    y: number;
    status: ObjectStatus = 'normal';
    style: DoorStyle = 'cave';
    constructor(state: GameState, definition: EntranceDefinition) {
        this.definition = definition;
        this.x = definition.x;
        this.y = definition.y;
        this.status = definition.status || 'normal';
        // If the player already opened this door, set it to the appropriate open status.
        if (state.savedState.objectFlags[this.definition.id]) {
            if (this.status === 'cracked') {
                this.status = 'blownOpen';
            } else {
                this.status = 'normal';
            }
        }
        this.style = definition.style as DoorStyle;
        if (!doorStyles[this.style]) {
            this.style = 'cave';
        }
    }
    isOpen(): boolean {
        return this.status === 'normal' || this.status === 'blownOpen';
    }
    changeStatus(state: GameState, status: ObjectStatus): void {
        this.status = status;
        if (this.linkedObject && this.linkedObject.status !== status) {
            this.linkedObject.changeStatus(state, status);
        }
        if (this.status === 'normal' && this.definition.saveStatus) {
            state.savedState.objectFlags[this.definition.id] = true;
            saveGame();
        }
        const y = Math.floor(this.y / 16);
        const x = Math.floor(this.x / 16);
        const doorStyle = doorStyles[this.style];
        if (doorStyle.w === 64) {
            const behaviors = this.isOpen() ? { solid: false } : { solid: true, low: false};
            if (this.definition.d === 'up' || this.definition.d === 'down') {
                applyBehaviorToTile(this.area, x, y, behaviors);
                applyBehaviorToTile(this.area, x + 1, y, behaviors);
                applyBehaviorToTile(this.area, x + 2, y, behaviors);
                applyBehaviorToTile(this.area, x + 3, y, behaviors);
            } else {
                applyBehaviorToTile(this.area, x, y, behaviors);
                applyBehaviorToTile(this.area, x, y + 1, behaviors);
                applyBehaviorToTile(this.area, x, y + 2, behaviors);
                applyBehaviorToTile(this.area, x, y + 3, behaviors);
            }
        } else if (doorStyle.w === 32) {
            const behaviors = { solid: true, solidMap: undefined, low: false};
            applyBehaviorToTile(this.area, x, y, behaviors);
            applyBehaviorToTile(this.area, x + 1, y, behaviors);
            applyBehaviorToTile(this.area, x, y + 1, behaviors);
            applyBehaviorToTile(this.area, x + 1, y + 1, behaviors);
            if (this.isOpen()) {
                if (this.definition.d === 'left') {
                    applyBehaviorToTile(this.area, x + 1, y, { solidMap: BITMAP_SIDE_DOOR_TOP, low: false });
                    applyBehaviorToTile(this.area, x + 1, y + 1, { solidMap: BITMAP_SIDE_DOOR_BOTTOM, low: false });
                } else if (this.definition.d === 'right') {
                    applyBehaviorToTile(this.area, x, y, { solidMap: BITMAP_SIDE_DOOR_TOP, low: false });
                    applyBehaviorToTile(this.area, x, y + 1, { solidMap: BITMAP_SIDE_DOOR_BOTTOM, low: false});
                } else if (this.definition.d === 'up') {
                    applyBehaviorToTile(this.area, x, y + 1, { solidMap: BITMAP_LEFT, low: false });
                    applyBehaviorToTile(this.area, x + 1, y + 1, { solidMap: BITMAP_RIGHT, low: false });
                } else if (this.definition.d === 'down') {
                    applyBehaviorToTile(this.area, x, y, { solidMap: BITMAP_LEFT, low: false });
                    applyBehaviorToTile(this.area, x + 1, y, { solidMap: BITMAP_RIGHT, low: false });
                }
            }
        }
    }
    add(state: GameState, area: AreaInstance) {
        this.area = area;
        area.objects.push(this);
        this.changeStatus(state, this.status);
    }
    getHitbox(state: GameState): ShortRectangle {
        if (this.definition.d === 'up' || this.definition.d === 'down') {
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
        const dungeonInventory = state.savedState.dungeonInventories[state.location.zoneKey];
        if (this.status === 'locked' && dungeonInventory?.smallKeys) {
            dungeonInventory.smallKeys--;
        } else if (this.status === 'bigKeyLocked' && dungeonInventory?.bigKey) {
        } else {
            return false;
        }
        this.changeStatus(state, 'normal');
        state.savedState.objectFlags[this.definition.id] = true;
        // Unlock the other half of this door if it is in this super tile.
        for (const object of this.area.objects) {
            if (object?.definition?.type === 'door' && object?.definition.id === this.definition.id) {
                object.changeStatus(state, 'normal');
            }
        }
        saveGame();
        return true;
    }
    onGrab(state: GameState) {
        if (!this.tryToUnlock(state)) {
            if (this.status === 'bigKeyLocked') {
                showMessage(state, 'You need a special key to open this door.');
                state.hero.action = null;
            }
        }
    }
    // This is probably only needed by the editor since doors are not removed during gameplay.
    remove(state: GameState) {
        const y = Math.floor(this.y / 16);
        const x = Math.floor(this.x / 16);
        const doorStyle = doorStyles[this.style];
        if (doorStyle.w === 64) {
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
    }
    update(state: GameState) {
        let hero = state.hero.activeClone || state.hero;
        // Nothing to update if the hero isn't in the same world as this door.
        if (hero.area !== this.area) {
            return;
        }
        const heroIsTouchingDoor = boxesIntersect(hero, this.getHitbox(state));
        if ((!hero.actionTarget || hero.actionTarget === this) && heroIsTouchingDoor) {
            let shouldEnterDoor = (hero.action !== 'entering' && hero.action !== 'exiting');
            if (!shouldEnterDoor && hero.actionTarget !== this) {
                const direction = getDirection(-hero.actionDx, -hero.actionDy);
                // If the hero is moving in the direction opposite this door, then we should take over the movement,
                // as this happens when the hero is passed from an entrance to an exit.
                if (direction === this.definition.d) {
                    shouldEnterDoor = true;
                }
            }
            if (shouldEnterDoor && hero.actionTarget !== this) {
                hero.action = 'entering';
                hero.actionFrame = 0;
                hero.actionTarget = this;
                hero.actionDx = 0;
                hero.actionDy = 0;
                if (this.definition.d === 'up' || this.definition.d === 'down') {
                    hero.actionDy = (hero.y + hero.h / 2 < this.y + 16) ? 1 : -1;
                } else {
                    hero.actionDx = (hero.x + hero.w / 2 < this.x + 16) ? 1 : -1;
                }
            }
            if (hero.actionTarget !== this) {
                return;
            }
            // Reduce speed to the regular screen transition speed if the player transitions screens while
            // moving through the door.
            const speed = state.nextAreaInstance ? 0.75 : 2;
            hero.x += speed * hero.actionDx;
            hero.y += speed * hero.actionDy;
        }
        if (hero.actionTarget === this) {
            const x = hero.x + hero.w / 2 + hero.actionDx * hero.w / 2;
            const y = hero.y + hero.h / 2 + hero.actionDy * hero.h / 2;
            const hitbox = this.getHitbox(state);
            const changedZones = (!isPointInShortRect(x, y, hitbox) || isObjectInsideTarget(hero, hitbox)) && this.travelToZone(state);
            if (!changedZones && !heroIsTouchingDoor) {
                hero.action = null;
                hero.actionTarget = null;
                hero.actionDx = 0;
                hero.actionDy = 0;
                hero.safeD = hero.d;
                hero.safeX = hero.x;
                hero.safeY = hero.y;
            }
        }
    }
    travelToZone(state: GameState) {
        let hero = state.hero.activeClone || state.hero;
        if (hero.action !== 'entering' || !this.definition.targetZone || !this.definition.targetObjectId) {
            return false;
        }
        return enterZoneByTarget(state, this.definition.targetZone, this.definition.targetObjectId, this.definition, false, () => {
            // We need to reassign hero after calling `enterZoneByTarget` because the active hero may change
            // from one clone to another when changing zones.
            hero = state.hero.activeClone || state.hero;
            hero.action = 'exiting';
            const target = findObjectInstanceById(state.areaInstance, this.definition.targetObjectId) as Door;
            if (!target){
                console.error(state.areaInstance.objects);
                console.error(this.definition.targetObjectId);
                debugger;
            }
            // When passing horizontally through narrow doors, we need to start 3px lower than usual.
            if (target.definition.type === 'door') {
                const style = doorStyles[target.style];
                if (style.h === 32 && target.definition.d !== 'down') {
                    hero.y += 3;
                }
            }
            hero.actionTarget = target;
            // Make sure the hero is coming *out* of the target door.
            hero.actionDx = -directionMap[target.definition.d][0];
            hero.actionDy = -directionMap[target.definition.d][1];
            // This will be the opposite direction of the door they are coming out of.
            hero.d = getDirection(hero.actionDx, hero.actionDy);
        });
    }
    render(context: CanvasRenderingContext2D, state: GameState) {
        const doorStyle = doorStyles[this.style];
        context.fillStyle = '#888';
        if (doorStyle[this.definition.d]) {
            let frame: Frame;
            if (this.status !== 'cracked') {
                if (this.status === 'blownOpen') {
                    frame = doorStyle[this.definition.d].caveFrame;
                } else {
                    frame = doorStyle[this.definition.d].doorFrame;
                }
                drawFrame(context, frame, { ...frame, x: this.x, y: this.y });
            }
            if (this.status === 'normal' || state.hero.actionTarget === this) {
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
                const hitbox = this.getHitbox(state);
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
    renderForeground(context: CanvasRenderingContext2D, state: GameState) {
        const hitbox = this.getHitbox(state);
        // No need to render this unless the player is actually behind this.
        // This is a hack to keep this from rendering in front of the waterfall
        // for the entrance to the Waterfall Cave.
        // There is also probably an issue with this rendering in front of flying enemies.
        if (this.definition.d === 'up' && hitbox.y + 24 < state.hero.y) {
            return;
        }
        const doorStyle = doorStyles[this.style];
        if (doorStyle[this.definition.d] && this.status !== 'cracked') {
            let frame: Frame;
            if (this.status === 'blownOpen') {
                frame = doorStyle[this.definition.d].caveCeiling;
            } else {
                frame = doorStyle[this.definition.d].doorCeiling;
            }
            drawFrame(context, frame, { ...frame, x: this.x, y: this.y });
        }
    }
}
