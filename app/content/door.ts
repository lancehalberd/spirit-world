import { applyBehaviorToTile, enterZoneByTarget, findEntranceById, playAreaSound, resetTileBehavior } from 'app/content/areas';
import { getObjectStatus, saveObjectStatus } from 'app/content/objects';
import {
    BITMAP_LEFT, BITMAP_RIGHT,
    BITMAP_BOTTOM, BITMAP_BOTTOM_LEFT_QUARTER, BITMAP_BOTTOM_RIGHT_QUARTER,
} from 'app/content/bitMasks';
import { debugCanvas } from 'app/dom';
import { showMessage } from 'app/render/renderMessage';
import { saveGame } from 'app/state';
import { createAnimation, drawFrame, drawFrameAt } from 'app/utils/animations';
import { directionMap, getDirection } from 'app/utils/field';
import { requireImage } from 'app/utils/images';
import { boxesIntersect, isObjectInsideTarget, isPointInShortRect } from 'app/utils/index';

import {
    AreaInstance, Direction, DrawPriority, Frame, GameState, HitProperties, HitResult, ObjectInstance,
    ObjectStatus, EntranceDefinition, Rect, TileBehaviors,
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


const [ treeDoorOpen ] = createAnimation('gfx/tiles/treesheet.png', {w: 32, h: 32}, {left: 128, top: 96, cols: 1}).frames;

const [
    ladderTop, ladderMiddle, /*ladderMiddle*/, ladderBottom, ladderDown
] = createAnimation('gfx/tiles/ladder.png', {w: 16, h: 16}, {rows: 5}).frames;

interface DoorStyleFrames {
    doorFrame: Frame,
    doorCeiling?: Frame,
    doorClosed: Frame,
    cracked: Frame,
    caveFrame: Frame,
    caveCeiling?: Frame,
    cave: Frame,
    locked: Frame,
    bigKeyLocked: Frame,
}
interface DoorStyleDefinition {
    w: number,
    h: number,
    getHitbox?: (state: GameState, door: Door) => Rect
    render?: (context: CanvasRenderingContext2D, state: GameState, door: Door) => void
    renderForeground?: (context: CanvasRenderingContext2D, state: GameState, door: Door) => void
    down?: DoorStyleFrames,
    right?: DoorStyleFrames,
    up?: DoorStyleFrames,
    left?: DoorStyleFrames,
}
const woodImage = requireImage('gfx/tiles/woodhousetilesarranged.png');
//const woodenCrackedSouthBackground: Frame = {image: woodImage, x: 48, y: 0, w: 16, h: 16};
const woodenSouthCrackedWall: Frame = {image: woodImage, x: 32, y: 96, w: 16, h: 16};
//const woodenCrackedEastBackground: Frame = {image: woodImage, x: 0, y: 0, w: 16, h: 16};
const woodenEastCrackedWall: Frame = {image: woodImage, x: 32, y: 80, w: 16, h: 16};
//const woodenCrackedWestBackground: Frame = {image: woodImage, x: 0, y: 0, w: 16, h: 16};
const woodenWestCrackedWall: Frame = {image: woodImage, x: 32, y: 80, w: 16, h: 16};
const [
    woodenSouthDoorClosed, /* empty space */, woodenSouthDoorOpen, woodenSouthDoorEmpty
] = createAnimation('gfx/tiles/woodhousetilesarranged.png', {w: 64, h: 16},
    {left: 304, y: 13, cols: 2, rows: 2}).frames;
const [
    woodenWestDoorClosed, woodenEastDoorClosed, woodenWestDoorOpen, woodenEastDoorOpen,
    woodenWestDoorEmpty, woodenEastDoorEmpty,
] = createAnimation('gfx/tiles/woodhousetilesarranged.png', {w: 16, h: 48},
    {left: 304, top: 160, cols: 6}).frames;
const [
    woodenWestDoorOpenForeground, woodenEastDoorOpenForeground,
    woodenWestDoorEmptyForeground, woodenEastDoorEmptyForeground,
] = createAnimation('gfx/tiles/woodhousetilesarranged.png', {w: 16, h: 48},
    {left: 336, top: 160, cols: 4}).frames;
const [
    woodenNorthCrack, woodenNorthBlownup,
] = createAnimation('gfx/tiles/woodhousetilesarranged.png', {w: 32, h: 32},
    {left: 368, top: 64, rows: 2}).frames;
const [
    woodenNorthDoorway,
] = createAnimation('gfx/tiles/woodhousetilesarranged.png', {w: 32, h: 32}, {left: 368, top: 128}).frames;
const [
    woodenStairsUp,
] = createAnimation('gfx/tiles/woodhousetilesarranged.png', {w: 32, h: 32}, {left: 304, top: 64}).frames;
const [
    woodenStairsDown,
] = createAnimation('gfx/tiles/woodhousetilesarranged.png', {w: 32, h: 32}, {left: 304, top: 96}).frames;
function renderWoodenDoor(this: void, context: CanvasRenderingContext2D, state: GameState, door: Door) {
    if (door.definition.d === 'up') {
        let frame = woodenNorthDoorway, overFrame: Frame = null;
        if (door.renderOpen(state)) {
            if (door.definition.status === 'cracked') {
                frame = woodenNorthBlownup;
            }
        } else if (door.status === 'locked') {
            overFrame = lockedDoorCover;
        } else if (door.status === 'bigKeyLocked' ) {
            overFrame = bigLockedDoorCover;
        } else if (door.status === 'cracked') {
            frame = woodenNorthCrack;
        } else if (door.definition.status !== 'frozen') {
            // This covers closed, closedEnemy + closedSwitch
            overFrame = blockedDoorCover;
        }
        drawFrame(context, frame, {...frame, x: door.x, y: door.y});
        if (overFrame) {
            drawFrame(context, overFrame, {...overFrame, x: door.x, y: door.y});
        }
        if (door.status === 'frozen') {
            context.save();
                context.globalAlpha = 0.5;
                context.fillStyle = 'white';
                context.fillRect(door.x, door.y, 32, 32);
            context.restore();
        }
    } else if (door.definition.d === 'left') {
        if (door.status === 'cracked') {
            return;
        }
        let frame = woodenWestDoorEmpty;
        if (door.definition.status !== 'normal'
            && door.definition.status !== 'cracked'
            && door.definition.status !== 'blownOpen'
        ) {
            frame = door.renderOpen(state) ? woodenWestDoorOpen : woodenWestDoorClosed;
        }
        drawFrame(context, frame, {...frame, x: door.x, y: door.y});
    } else if (door.definition.d === 'right') {
        if (door.status === 'cracked') {
            return;
        }
        let frame = woodenEastDoorEmpty;
        if (door.definition.status !== 'normal'
            && door.definition.status !== 'cracked'
            && door.definition.status !== 'blownOpen'
        ) {
            frame = door.renderOpen(state) ? woodenEastDoorOpen : woodenEastDoorClosed;
        }
        drawFrame(context, frame, {...frame, x: door.x, y: door.y});
    }
    // There is no background frame for southern doors.
}
function renderWoodenDoorForeground(context: CanvasRenderingContext2D, state: GameState, door: Door) {
    /*if (door.definition.d === 'down') {
        let frame = woodenSouthDoorEmpty;
        if (door.isOpen()) {
            if (door.definition.status !== 'normal'
                && door.definition.status !== 'cracked'
            ) {
                frame = woodenSouthDoorOpen;
            }
        } else if (door.status === 'locked' || door.status === 'bigKeyLocked' || door.status === 'closed') {
            frame = woodenSouthDoorClosed;
        }
        drawFrame(context, frame, {...frame, x: door.x, y: door.y});
        // Draw cracked tiles on top fo the door frame graphic.
        if (door.status === 'cracked') {
            drawFrame(context, woodenSouthCrackedWall, {x: door.x + 16, y: door.y, w: 16, h: 16});
            drawFrame(context, woodenSouthCrackedWall, {x: door.x + 32, y: door.y, w: 16, h: 16});
        }
    }*/
    if (door.definition.d === 'down') {
        let frame = woodenSouthDoorEmpty;
        // This frame is used if the doorway can have a door in it (closed or locked).
        if (door.definition.status !== 'normal'
            && door.definition.status !== 'cracked'
            && door.definition.status !== 'blownOpen'
        ) {
            frame = door.renderOpen(state) ? woodenSouthDoorOpen : woodenSouthDoorClosed;
        }
        // Draw cracked tiles instead of the door.
        if (door.status === 'cracked') {
            //drawFrame(context, woodenCrackedSouthBackground, {x: door.x, y: door.y, w: 16, h: 16});
            drawFrame(context, woodenSouthCrackedWall, {x: door.x, y: door.y, w: 16, h: 16});
            drawFrame(context, woodenSouthCrackedWall, {x: door.x + 16, y: door.y, w: 16, h: 16});
            drawFrame(context, woodenSouthCrackedWall, {x: door.x + 32, y: door.y, w: 16, h: 16});
            drawFrame(context, woodenSouthCrackedWall, {x: door.x + 48, y: door.y, w: 16, h: 16});
            //drawFrame(context, woodenCrackedSouthBackground, {x: door.x + 48, y: door.y, w: 16, h: 16});
        } else {
            drawFrame(context, frame, {...frame, x: door.x, y: door.y});
        }
    } else if (door.definition.d === 'up') {
        let frame = woodenNorthDoorway;
        if (door.definition.status === 'cracked'
            || door.definition.status === 'blownOpen'
        ) {
            frame = door.renderOpen(state) ? woodenNorthBlownup : null;
        }
        // Only draw the top 12 pixels of southern facing doors over the player.
        drawFrame(context, {...woodenNorthDoorway, h: 12}, {...frame, x: door.x, y: door.y, h: 12});
    } else if (door.definition.d === 'left') {
        let frame = woodenWestDoorEmptyForeground;
        if (door.definition.status !== 'normal'
            && door.definition.status !== 'cracked'
            && door.definition.status !== 'blownOpen'
        ) {
            frame = door.renderOpen(state) ? woodenWestDoorOpenForeground : null;
        }
        // Draw cracked tiles on top fo the door frame graphic.
        if (door.status === 'cracked') {
            //drawFrame(context, woodenCrackedWestBackground, {x: door.x, y: door.y, w: 16, h: 16});
            drawFrame(context, woodenWestCrackedWall, {x: door.x, y: door.y, w: 16, h: 16});
            drawFrame(context, woodenWestCrackedWall, {x: door.x, y: door.y + 16, w: 16, h: 16});
            drawFrame(context, woodenWestCrackedWall, {x: door.x, y: door.y + 32, w: 16, h: 16});
            drawFrame(context, woodenWestCrackedWall, {x: door.x, y: door.y + 48, w: 16, h: 16});
            //drawFrame(context, woodenCrackedWestBackground, {x: door.x, y: door.y + 48, w: 16, h: 16});
        } else if (frame) {
            drawFrame(context, frame, {...frame, x: door.x, y: door.y});
        }
    } else if (door.definition.d === 'right') {
        let frame = woodenEastDoorEmptyForeground;
        if (door.definition.status !== 'normal'
            && door.definition.status !== 'cracked'
            && door.definition.status !== 'blownOpen'
        ) {
            frame = door.renderOpen(state) ? woodenEastDoorOpenForeground : null;
        }
        // Draw cracked tiles on top of the door frame graphic.
        if (door.status === 'cracked') {
            //drawFrame(context, woodenCrackedEastBackground, {x: door.x, y: door.y, w: 16, h: 16});
            drawFrame(context, woodenEastCrackedWall, {x: door.x, y: door.y, w: 16, h: 16});
            drawFrame(context, woodenEastCrackedWall, {x: door.x, y: door.y + 16, w: 16, h: 16});
            drawFrame(context, woodenEastCrackedWall, {x: door.x, y: door.y + 32, w: 16, h: 16});
            drawFrame(context, woodenEastCrackedWall, {x: door.x, y: door.y + 48, w: 16, h: 16});
            //drawFrame(context, woodenCrackedEastBackground, {x: door.x, y: door.y + 48, w: 16, h: 16});
        } else if (frame) {
            drawFrame(context, frame, {...frame, x: door.x, y: door.y});
        }
    }
}

const cavernImage = requireImage('gfx/tiles/cavearranged.png');
const cavernCrackedBackground: Frame = {image: cavernImage, x: 0, y: 240, w: 16, h: 16};
const cavernEastCrackedWall: Frame = {image: cavernImage, x: 304, y: 64, w: 16, h: 16};
const cavernWestCrackedWall: Frame = {image: cavernImage, x: 320, y: 64, w: 16, h: 16};
//const cavernNorthCrackedWall: Frame = {image: cavernImage, x: 304, y: 80, w: 16, h: 16};
const cavernSouthCrackedWall: Frame = {image: cavernImage, x: 320, y: 80, w: 16, h: 16};
const [
    cavernSouthDoorClosed, cavernSouthDoorOpen, cavernSouthDoorEmpty
] = createAnimation('gfx/tiles/cavearranged.png', {w: 64, h: 16},
    {left: 432, y: 9, cols: 1, rows: 3}).frames;
const [
    cavernWestDoorClosed, cavernEastDoorClosed, cavernWestDoorOpen, cavernEastDoorOpen,
    /* */, /* */, cavernWestDoorEmpty, cavernEastDoorEmpty,
] = createAnimation('gfx/tiles/cavearranged.png', {w: 16, h: 64},
    {left: 432, y: 0, cols: 4, rows: 2}).frames;
const [
    cavernWestDoorOpenForeground, cavernEastDoorOpenForeground,
    cavernWestDoorEmptyForeground, cavernEastDoorEmptyForeground,
] = createAnimation('gfx/tiles/cavearranged.png', {w: 16, h: 64},
    {left: 432, top: 192, cols: 4, rows: 1}).frames;
const [
    cavernStairsUp, cavernStairsDown, cavernNorthDoorway, cavernNorthBlownup,
    /*cavernStairs*/, cavernNorthCrack,
] = createAnimation('gfx/tiles/cavearranged.png', {w: 32, h: 32},
    {left: 304, y: 0, cols: 4, rows: 2}).frames;
const [
    blockedDoorCover, lockedDoorCover, bigLockedDoorCover,
] = createAnimation('gfx/tiles/cavearranged.png', {w: 32, h: 32},
    {left: 304, top: 192, cols: 3, rows: 1}).frames;

debugCanvas;//(blockedDoorCover);

function renderCavernDoor(this: void, context: CanvasRenderingContext2D, state: GameState, door: Door) {
    if (door.definition.d === 'up') {
        let frame = cavernNorthDoorway, overFrame: Frame = null;
        if (door.renderOpen(state)) {
            if (door.definition.status === 'cracked') {
                frame = cavernNorthBlownup;
            }
        } else if (door.status === 'locked') {
            overFrame = lockedDoorCover;
        } else if (door.status === 'bigKeyLocked' ) {
            overFrame = bigLockedDoorCover;
        } else if (door.status === 'cracked') {
            frame = cavernNorthCrack;
        } else if (door.definition.status !== 'frozen') {
            // This covers closed, closedEnemy + closedSwitch
            overFrame = blockedDoorCover;
        }
        drawFrame(context, frame, {...frame, x: door.x, y: door.y});
        if (overFrame) {
            drawFrame(context, overFrame, {...overFrame, x: door.x, y: door.y});
        }
        if (door.status === 'frozen') {
            context.save();
                context.globalAlpha = 0.5;
                context.fillStyle = 'white';
                context.fillRect(door.x, door.y, 32, 32);
            context.restore();
        }
    } else if (door.definition.d === 'left') {
        if (door.status === 'cracked') {
            return;
        }
        let frame = cavernWestDoorEmpty;
        if (door.definition.status !== 'normal'
            && door.definition.status !== 'cracked'
            && door.definition.status !== 'blownOpen'
        ) {
            frame = door.renderOpen(state) ? cavernWestDoorOpen : cavernWestDoorClosed;
        }
        drawFrame(context, frame, {...frame, x: door.x, y: door.y});
    } else if (door.definition.d === 'right') {
        if (door.status === 'cracked') {
            return;
        }
        let frame = cavernEastDoorEmpty;
        if (door.definition.status !== 'normal'
            && door.definition.status !== 'cracked'
            && door.definition.status !== 'blownOpen'
        ) {
            frame = door.renderOpen(state) ? cavernEastDoorOpen : cavernEastDoorClosed;
        }
        drawFrame(context, frame, {...frame, x: door.x, y: door.y});
    }
    // There is no background frame for southern doors.
}
function renderCavernDoorForeground(context: CanvasRenderingContext2D, state: GameState, door: Door) {
    if (door.definition.d === 'down') {
        let frame = cavernSouthDoorEmpty;
        // This frame is used if the doorway can have a door in it (closed or locked).
        if (door.definition.status !== 'normal'
            && door.definition.status !== 'cracked'
            && door.definition.status !== 'blownOpen'
        ) {
            frame = door.renderOpen(state) ? cavernSouthDoorOpen : cavernSouthDoorClosed;
        }
        // Draw cracked tiles instead of the door.
        if (door.status === 'cracked') {
            drawFrame(context, cavernCrackedBackground, {x: door.x, y: door.y, w: 16, h: 16});
            drawFrame(context, cavernCrackedBackground, {x: door.x + 16, y: door.y, w: 16, h: 16});
            drawFrame(context, cavernCrackedBackground, {x: door.x + 32, y: door.y, w: 16, h: 16});
            drawFrame(context, cavernCrackedBackground, {x: door.x + 48, y: door.y, w: 16, h: 16});
            drawFrame(context, cavernSouthCrackedWall, {x: door.x + 16, y: door.y, w: 16, h: 16});
            drawFrame(context, cavernSouthCrackedWall, {x: door.x + 32, y: door.y, w: 16, h: 16});
        } else {
            drawFrame(context, frame, {...frame, x: door.x, y: door.y});
        }
    } else if (door.definition.d === 'up') {
        let frame = cavernNorthDoorway;
        if (door.definition.status === 'cracked'
            || door.definition.status === 'blownOpen'
            || door.definition.status === 'frozen'
        ) {
            frame = door.renderOpen(state) ? cavernNorthBlownup : null;
        }
        // Only draw the top 12 pixels of southern facing doors over the player.
        drawFrame(context, {...cavernNorthDoorway, h: 12}, {...frame, x: door.x, y: door.y, h: 12});
    } else if (door.definition.d === 'left') {
        let frame = cavernWestDoorEmptyForeground;
        if (door.definition.status !== 'normal'
            && door.definition.status !== 'cracked'
            && door.definition.status !== 'blownOpen'
        ) {
            frame = door.renderOpen(state) ? cavernWestDoorOpenForeground : null;
        }
        // Draw cracked tiles on top fo the door frame graphic.
        if (door.status === 'cracked') {
            drawFrame(context, cavernCrackedBackground, {x: door.x, y: door.y, w: 16, h: 16});
            drawFrame(context, cavernCrackedBackground, {x: door.x, y: door.y + 16, w: 16, h: 16});
            drawFrame(context, cavernCrackedBackground, {x: door.x, y: door.y + 32, w: 16, h: 16});
            drawFrame(context, cavernWestCrackedWall, {x: door.x, y: door.y + 16, w: 16, h: 16});
            drawFrame(context, cavernWestCrackedWall, {x: door.x, y: door.y + 32, w: 16, h: 16});
        } else if (frame) {
            drawFrame(context, frame, {...frame, x: door.x, y: door.y});
        }
    } else if (door.definition.d === 'right') {
        let frame = cavernEastDoorEmptyForeground;
        if (door.definition.status !== 'normal'
            && door.definition.status !== 'cracked'
            && door.definition.status !== 'blownOpen'
        ) {
            frame = door.renderOpen(state) ? cavernEastDoorOpenForeground : null;
        }
        // Draw cracked tiles on top fo the door frame graphic.
        if (door.status === 'cracked') {
            drawFrame(context, cavernCrackedBackground, {x: door.x, y: door.y, w: 16, h: 16});
            drawFrame(context, cavernCrackedBackground, {x: door.x, y: door.y + 16, w: 16, h: 16});
            drawFrame(context, cavernCrackedBackground, {x: door.x, y: door.y + 32, w: 16, h: 16});
            drawFrame(context, cavernEastCrackedWall, {x: door.x, y: door.y + 16, w: 16, h: 16});
            drawFrame(context, cavernEastCrackedWall, {x: door.x, y: door.y + 32, w: 16, h: 16});
        } else if (frame) {
            drawFrame(context, frame, {...frame, x: door.x, y: door.y});
        }
    }
}

export const doorStyles: {[key: string]: DoorStyleDefinition} = {
    cavernDownstairs: {
        w: 32,
        h: 32,
        render(context: CanvasRenderingContext2D, state: GameState, door: Door) {
            if (door.status !== 'normal') {
                doorStyles.cavern.render(context, state, door);
                return;
            }
            const frame = cavernStairsDown;
            drawFrameAt(context, frame, {x: door.x, y: door.y});
        },
        renderForeground(context: CanvasRenderingContext2D, state: GameState, door: Door) {
            const frame = cavernStairsDown;
            drawFrame(context, {...frame, h: 12}, {...frame, x: door.x, y: door.y, h: 12});
        }
    },
    cavernUpstairs: {
        w: 32,
        h: 32,
        render(context: CanvasRenderingContext2D, state: GameState, door: Door) {
            if (door.status !== 'normal') {
                doorStyles.cavern.render(context, state, door);
                return;
            }
            const frame = cavernStairsUp;
            drawFrameAt(context, frame, {x: door.x, y: door.y});
        },
        renderForeground(context: CanvasRenderingContext2D, state: GameState, door: Door) {
            const frame = cavernStairsUp;
            drawFrame(context, {...frame, h: 12}, {...frame, x: door.x, y: door.y, h: 12});
        }
    },
    cavern: {
        w: 64,
        h: 16,
        getHitbox(state: GameState, door: Door) {
            if (door.definition.d === 'up') {
                return {x: door.x, y: door.y, w: 32, h: 32};
            }
            if (door.definition.d === 'down') {
                return {x: door.x, y: door.y + 8, w: 64, h: 8};
            }
            return {x: door.x, y: door.y, w: 16, h: 64};
        },
        render: renderCavernDoor,
        renderForeground: renderCavernDoorForeground
    },
    woodenDownstairs: {
        w: 32,
        h: 32,
        render(context: CanvasRenderingContext2D, state: GameState, door: Door) {
            if (door.status !== 'normal') {
                doorStyles.wooden.render(context, state, door);
                return;
            }
            const frame = woodenStairsDown;
            drawFrameAt(context, frame, {x: door.x, y: door.y});
        },
        renderForeground(context: CanvasRenderingContext2D, state: GameState, door: Door) {
            const frame = woodenStairsDown;
            drawFrame(context, {...frame, h: 12}, {...frame, x: door.x, y: door.y, h: 12});
        }
    },
    woodenUpstairs: {
        w: 32,
        h: 32,
        render(context: CanvasRenderingContext2D, state: GameState, door: Door) {
            if (door.status !== 'normal') {
                doorStyles.wooden.render(context, state, door);
                return;
            }
            const frame = woodenStairsUp;
            drawFrameAt(context, frame, {x: door.x, y: door.y});
        },
        renderForeground(context: CanvasRenderingContext2D, state: GameState, door: Door) {
            const frame = woodenStairsUp;
            drawFrame(context, {...frame, h: 12}, {...frame, x: door.x, y: door.y, h: 12});
        }
    },
    wooden: {
        w: 64,
        h: 16,
        getHitbox(state: GameState, door: Door) {
            if (door.definition.d === 'up') {
                return {x: door.x, y: door.y, w: 32, h: 32};
            }
            if (door.definition.d === 'down') {
                return {x: door.x, y: door.y + 8, w: 64, h: 8};
            }
            return {x: door.x, y: door.y, w: 16, h: 64};
        },
        render: renderWoodenDoor,
        renderForeground: renderWoodenDoorForeground
    },
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
    tree: {
        w: 32,
        h: 32,
        up: {
            doorFrame: treeDoorOpen,
            doorClosed: treeDoorOpen,
            cracked: treeDoorOpen,
            caveFrame: treeDoorOpen,
            caveCeiling: treeDoorOpen,
            cave: treeDoorOpen,
            locked: treeDoorOpen,
            bigKeyLocked: treeDoorOpen,
        },
    },
    ladderUp: {
        w: 16,
        h: 32,
        render(this: void, context, state, door) {
            if (door.status !== 'normal') {
                return;
            }
            drawFrame(context, ladderMiddle, {x: door.x, y: door.y, w: 16, h: 16});
            drawFrame(context, ladderBottom, {x: door.x, y: door.y + 16, w: 16, h: 16});
        }
    },
    ladderDown: {
        w: 16,
        h: 16,
        render(this: void, context, state, door) {
            if (door.status !== 'normal') {
                return;
            }
            drawFrame(context, ladderTop, {x: door.x, y: door.y - 16, w: 16, h: 16});
            drawFrame(context, ladderDown, {x: door.x, y: door.y, w: 16, h: 16});
        }
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

export class Door implements ObjectInstance {
    behaviors: TileBehaviors = { }
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
    constructor(state: GameState, definition: EntranceDefinition) {
        this.definition = definition;
        this.x = definition.x;
        this.y = definition.y;
        this.status = definition.status || 'normal';
        // 'closedEnemy' doors will start open and only close when we confirm there are enemies in the current
        // are section.
        if (this.status === 'closedEnemy') {
            this.status = 'normal';
        }
        // If the player already opened this door, set it to the appropriate open status.
        if (getObjectStatus(state, this.definition)) {
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
    renderOpen(state: GameState): boolean {
        return this.status === 'normal' || this.status === 'blownOpen' || this.status === 'frozen' || state.hero.actionTarget === this;
    }
    changeStatus(state: GameState, status: ObjectStatus): void {
        const wasClosed = this.status === 'closed' || this.status === 'closedSwitch' || this.status === 'closedEnemy';
        const isClosed = status === 'closed' || status === 'closedSwitch' || status === 'closedEnemy';
        if (wasClosed && status === 'normal') {
            playAreaSound(state, this.area, 'doorOpen');
        } else if (isClosed && this.status === 'normal') {
            playAreaSound(state, this.area, 'doorClose');
        }
        this.status = status;
        if (this.linkedObject && this.linkedObject.status !== status) {
            this.linkedObject.changeStatus(state, status);
        }
        if (this.definition.id && this.status === 'normal') {
            // Update the other half of this door if it is in the same super tile.
            for (const object of this.area.objects) {
                if (object?.definition?.type === 'door' &&
                    object?.definition.id === this.definition.id &&
                    object.status !== 'normal'
                ) {
                    object.changeStatus(state, 'normal');
                }
            }
            saveObjectStatus(state, this.definition, true);
        }
        const y = Math.floor(this.y / 16);
        const x = Math.floor(this.x / 16);
        const doorStyle = doorStyles[this.style];
       if (this.style === 'wooden') {
            if (this.definition.d === 'down') {
                applyBehaviorToTile(this.area, x, y, { solidMap: BITMAP_BOTTOM, low: false});
                applyBehaviorToTile(this.area, x + 3, y, { solidMap: BITMAP_BOTTOM, low: false});
                if (this.isOpen()) {
                    applyBehaviorToTile(this.area, x + 1, y, { solidMap: BITMAP_BOTTOM_LEFT_QUARTER, low: false });
                    applyBehaviorToTile(this.area, x + 2, y, { solidMap: BITMAP_BOTTOM_RIGHT_QUARTER, low: false });
                } else {
                    applyBehaviorToTile(this.area, x + 1, y, { solidMap: BITMAP_BOTTOM, low: false});
                    applyBehaviorToTile(this.area, x + 2, y, { solidMap: BITMAP_BOTTOM, low: false});
                }
            } else if (this.definition.d === 'up') {
                this.applySquareDoorBehavior();
            } else { // left + right are the same
                applyBehaviorToTile(this.area, x, y, { solid: true, low: false });
                applyBehaviorToTile(this.area, x, y + 1, { solid: true, low: false });
                applyBehaviorToTile(this.area, x, y + 3, { solid: true, low: false });
                if (this.isOpen()) {
                    applyBehaviorToTile(this.area, x, y + 1, { solid: false });
                    applyBehaviorToTile(this.area, x, y + 2, { solid: false });
                } else {
                    applyBehaviorToTile(this.area, x, y + 1, { solid: true, low: false });
                    applyBehaviorToTile(this.area, x, y + 2, { solid: true, low: false });
                }
            }
        } else  if (this.style === 'cavern') {
            if (this.definition.d === 'down') {
                applyBehaviorToTile(this.area, x, y, { solidMap: BITMAP_BOTTOM, low: false});
                applyBehaviorToTile(this.area, x + 3, y, { solidMap: BITMAP_BOTTOM, low: false});
                if (this.isOpen()) {
                    applyBehaviorToTile(this.area, x + 1, y, { solidMap: BITMAP_BOTTOM_LEFT_QUARTER, low: false });
                    applyBehaviorToTile(this.area, x + 2, y, { solidMap: BITMAP_BOTTOM_RIGHT_QUARTER, low: false });
                } else {
                    applyBehaviorToTile(this.area, x + 1, y, { solidMap: BITMAP_BOTTOM, low: false});
                    applyBehaviorToTile(this.area, x + 2, y, { solidMap: BITMAP_BOTTOM, low: false});
                }
            } else if (this.definition.d === 'up') {
                this.applySquareDoorBehavior();
            } else { // left + right are the same
                applyBehaviorToTile(this.area, x, y, { solid: true, low: false });
                applyBehaviorToTile(this.area, x, y + 1, { solid: true, low: false });
                applyBehaviorToTile(this.area, x, y + 3, { solid: true, low: false });
                if (this.isOpen()) {
                    applyBehaviorToTile(this.area, x, y + 2, { solid: false });
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
        } else if (doorStyle.w === 64) {
            const behaviors: TileBehaviors = this.isOpen() ? { cannotLand: true, solid: false } : { solid: true, low: false};
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
            this.applySquareDoorBehavior();
        }
        if (this.status === 'normal') {
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
    add(state: GameState, area: AreaInstance) {
        this.area = area;
        area.objects.push(this);
        this.changeStatus(state, this.status);
    }
    getHitbox(state: GameState): Rect {
        const doorStyle = doorStyles[this.style];
        if (doorStyle.getHitbox) {
            return doorStyle.getHitbox(state, this);
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
        const dungeonInventory = state.savedState.dungeonInventories[state.location.zoneKey];
        if (this.status === 'locked' && dungeonInventory?.smallKeys) {
            dungeonInventory.smallKeys--;
        } else if (this.status === 'bigKeyLocked' && dungeonInventory?.bigKey) {
        } else {
            return false;
        }
        this.changeStatus(state, 'normal');
        if (this.definition.id) {
            state.savedState.objectFlags[this.definition.id] = true;
        } else {
            console.error('Locked door was missing an id', this);
            debugger;
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
    isStairs(state: GameState) {
        return this.style === 'cavernUpstairs' || this.style === 'cavernDownstairs';
    }
    update(state: GameState) {
        if (this.status !== 'normal' && getObjectStatus(state, this.definition)) {
            this.changeStatus(state, 'normal');
        }
        let hero = state.hero.activeClone || state.hero;
        // Nothing to update if the hero isn't in the same world as this door.
        // Also, heroes cannot enter doors while they are jumping down.
        if (hero.area !== this.area || hero.action === 'jumpingDown') {
            return;
        }
        const heroIsTouchingDoor = boxesIntersect(hero, this.getHitbox(state));
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
            if (this.definition.d === 'up' || this.definition.d === 'down') {
                hero.actionDy = (hero.y + hero.h / 2 < this.y + 16) ? 1 : -1;
            } else {
                hero.actionDx = (hero.x + hero.w / 2 < this.x + 16) ? 1 : -1;
            }
        }
        if (hero.actionTarget === this) {
            const x = hero.x + hero.w / 2 + hero.actionDx * hero.w / 2;
            const y = hero.y + hero.h / 2 + hero.actionDy * hero.h / 2;
            const hitbox = this.getHitbox(state);
            let changedZones = false;
            if (this.style === 'ladderUp') {
                const reachedTop = hero.y <= this.y;
                if (reachedTop) {
                    changedZones = this.travelToZone(state);
                    // 'ladderUp' is only for changing zones so make the hero climb back down if changing zones fails.
                    if (!changedZones) {
                        hero.isExitingDoor = true;
                        hero.actionDx = -directionMap[this.definition.d][0];
                        hero.actionDy = -directionMap[this.definition.d][1];
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
        let hero = state.hero.activeClone || state.hero;
        if (hero.isExitingDoor || !this.definition.targetZone || !this.definition.targetObjectId) {
            return false;
        }
        return enterZoneByTarget(state, this.definition.targetZone, this.definition.targetObjectId, this.definition, false, () => {
            // We need to reassign hero after calling `enterZoneByTarget` because the active hero may change
            // from one clone to another when changing zones.
            hero = state.hero.activeClone || state.hero;
            hero.isUsingDoor = true;
            hero.isExitingDoor = true;
            const target = findEntranceById(state.areaInstance, this.definition.targetObjectId, [this.definition]) as Door;
            if (!target){
                console.error(state.areaInstance.objects);
                console.error(this.definition.targetObjectId);
                debugger;
            }
            // When passing horizontally through narrow doors, we need to start 3px lower than usual.
            if (target.definition.type === 'door') {
                const style = doorStyles[target.style];
                // When exiting new style doors, the MCs head appears above the frame, so start them lower.
                if (style.w === 64 && target.definition.d === 'up') {
                    hero.y += 6;
                }
                // This is for old 32x32 side doors.
                if (style.h === 32 && target.definition.d !== 'down') {
                    hero.y += 3;
                }
                // This is for new side doors.
                if (style.w === 64 && (target.definition.d === 'left' || target.definition.d === 'right')) {
                    hero.y += 8;
                }
            }
            hero.actionTarget = target;
            if (target.style === 'ladderUp' || target.style === 'ladderDown') {
                hero.action = 'climbing';
            }
            // Make sure the hero is coming *out* of the target door.
            hero.actionDx = -directionMap[target.definition.d][0];
            hero.actionDy = -directionMap[target.definition.d][1];
            hero.vx = 0;
            hero.vy = 0;
            // This will be the opposite direction of the door they are coming out of.
            hero.d = getDirection(hero.actionDx, hero.actionDy);
        });
    }
    render(context: CanvasRenderingContext2D, state: GameState) {
        const doorStyle = doorStyles[this.style];
        context.fillStyle = '#888';
        if (doorStyle.render) {
            doorStyle.render(context, state, this);
        } else if (doorStyle[this.definition.d]) {
            let frame: Frame;
            if (this.status !== 'cracked') {
                if (this.status === 'blownOpen') {
                    frame = doorStyle[this.definition.d].caveFrame;
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
        if (state.hero.action === 'jumpingDown') {
            this.renderForeground(context, state, true);
        }
    }
    renderForeground(context: CanvasRenderingContext2D, state: GameState, force = false) {
        if (this.area !== state.areaInstance) {
            return;
        }
        // Hack to prevent the top of this specific door from rendering on top of the waterfall.
        if (this.definition.id === 'waterfallCaveEntrance') {
            return;
        }
        const doorStyle = doorStyles[this.style];
        // Foreground is rendered as part of the background when a player is jumping
        // in case they jump over the top of the door.
        if (!force && state.hero.action === 'jumpingDown') {
            return;
        }
        if (doorStyle.renderForeground) {
            doorStyle.renderForeground(context, state, this);
            return;
        }
        const hitbox = this.getHitbox(state);
        // No need to render this unless the player is actually behind this.
        // This is a hack to keep this from rendering in front of the waterfall
        // for the entrance to the Waterfall Cave.
        // There is also probably an issue with this rendering in front of flying enemies.
        if (this.definition.d !== 'up' || hitbox.y + 24 + this.area.cameraOffset.y >= state.hero.y) {
            const doorStyle = doorStyles[this.style];
            if (doorStyle[this.definition.d] && this.status !== 'cracked') {
                let frame: Frame;
                if (this.status === 'blownOpen') {
                    frame = doorStyle[this.definition.d].caveCeiling;
                } else {
                    frame = doorStyle[this.definition.d].doorCeiling;
                }
                if (frame) {
                    drawFrame(context, frame, { ...frame, x: this.x, y: this.y });
                }
            }
            if (this.status === 'frozen') {
                context.save();
                    context.globalAlpha = 0.5;
                    context.fillStyle = 'white';
                    if (this.definition.d === 'up') {
                        context.fillRect(this.x, this.y, 32, 12);
                    } else if (this.definition.d === 'down') {
                        context.fillRect(this.x, this.y + 20, 32, 12);
                    } else if (this.definition.d === 'left') {
                        context.fillRect(this.x, this.y, 12, 32);
                    } else if (this.definition.d === 'right') {
                        context.fillRect(this.x + 20, this.y, 12, 32);
                    }
                context.restore();
            }
        }
    }
}
