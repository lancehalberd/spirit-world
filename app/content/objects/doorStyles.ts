import {
    iceFrontAnimation,
    iceLeftAnimation,
    iceRightAnimation,
    iceTopAnimation,
} from 'app/content/animations/iceOverlay';
import type { Door } from 'app/content/objects/door';
import { createAnimation, drawFrame, drawFrameAt, getFrame } from 'app/utils/animations';
import { debugCanvas } from 'app/utils/canvas';
import { requireFrame } from 'app/utils/packedImages';


// These are used across many styles of door.
const [
    blockedDoorCover, lockedDoorCover, bigLockedDoorCover,
] = createAnimation('gfx/tiles/cavearranged2.png', {w: 32, h: 32},
    {left: 304, top: 224, cols: 3, rows: 1}).frames;
debugCanvas;//(blockedDoorCover);

// Door styles that implement this interface consistently can use the renderV1* functions for rendering.
interface V1DoorFrames {
    crackedBackground: Frame
    northDoorway: Frame
    northClosed?: Frame
    northBlownup: Frame
    northCrack: Frame
    westDoorEmpty: Frame
    westDoorEmptyForeground: Frame
    westDoorOpen: Frame
    westDoorOpenForeground: Frame
    westDoorClosed: Frame
    westCrackedWall: Frame
    eastDoorEmpty: Frame
    eastDoorEmptyForeground: Frame
    eastDoorOpen: Frame
    eastDoorOpenForeground: Frame
    eastDoorClosed: Frame
    eastCrackedWall: Frame
    southDoorEmpty: Frame
    southDoorOpen: Frame
    southDoorClosed: Frame
    southCrackedWall: Frame
}

function renderV1DoorBackground(this: void, context: CanvasRenderingContext2D, state: GameState, door: Door, v1DoorFrames: V1DoorFrames) {
    if (door.definition.d === 'up') {
        let frame = v1DoorFrames.northDoorway, overFrame: Frame = null;
        if (door.renderOpen(state)) {
            if (door.definition.status === 'cracked' || door.definition.status === 'blownOpen') {
                context.fillStyle = 'black';
                context.fillRect(door.x, door.y, 32, 32);
                frame = v1DoorFrames.northBlownup;
            }
        } else if (door.status === 'locked') {
            overFrame = lockedDoorCover;
        } else if (door.status === 'bigKeyLocked' ) {
            overFrame = bigLockedDoorCover;
        } else if (door.status === 'cracked') {
            frame = v1DoorFrames.northCrack;
        } else {
            // This covers closed, closedEnemy + closedSwitch
            overFrame = v1DoorFrames?.northClosed || blockedDoorCover;
        }
        drawFrame(context, frame, {...frame, x: door.x, y: door.y});
        if (overFrame) {
            drawFrame(context, overFrame, {...overFrame, x: door.x, y: door.y});
        }
    } else if (door.definition.d === 'left') {
        if (door.status === 'cracked') {
            return;
        }
        let frame = v1DoorFrames.westDoorEmpty;
        if (door.definition.status !== 'normal'
            && door.definition.status !== 'cracked'
            && door.definition.status !== 'blownOpen'
        ) {
            frame = door.renderOpen(state) ? v1DoorFrames.westDoorOpen : v1DoorFrames.westDoorClosed;
        }
        drawFrame(context, frame, {...frame, x: door.x, y: door.y});
    } else if (door.definition.d === 'right') {
        if (door.status === 'cracked') {
            return;
        }
        let frame = v1DoorFrames.eastDoorEmpty;
        if (door.definition.status !== 'normal'
            && door.definition.status !== 'cracked'
            && door.definition.status !== 'blownOpen'
        ) {
            frame = door.renderOpen(state) ? v1DoorFrames.eastDoorOpen : v1DoorFrames.eastDoorClosed;
        }
        drawFrame(context, frame, {...frame, x: door.x, y: door.y});
    }
    // There is no background frame for southern doors.
    checkToRenderFrozenDoor(context, state, door);
}

function renderV1DoorForeground(context: CanvasRenderingContext2D, state: GameState, door: Door, v1DoorFrames: V1DoorFrames, h = 12) {
    checkToRenderFrozenDoorForeground(context, state, door);
    if (door.definition.d === 'down') {
        let frame = v1DoorFrames.southDoorEmpty;
        // This frame is used if the doorway can have a door in it (closed or locked).
        if (door.definition.status !== 'normal'
            && door.definition.status !== 'cracked'
            && door.definition.status !== 'blownOpen'
        ) {
            frame = door.renderOpen(state) ? v1DoorFrames.southDoorOpen : v1DoorFrames.southDoorClosed;
        }
        // Draw cracked tiles instead of the door.
        if (door.status === 'cracked') {
            drawFrame(context, v1DoorFrames.crackedBackground, {x: door.x, y: door.y, w: 16, h: 16});
            drawFrame(context, v1DoorFrames.crackedBackground, {x: door.x + 16, y: door.y, w: 16, h: 16});
            drawFrame(context, v1DoorFrames.crackedBackground, {x: door.x + 32, y: door.y, w: 16, h: 16});
            drawFrame(context, v1DoorFrames.crackedBackground, {x: door.x + 48, y: door.y, w: 16, h: 16});
            drawFrame(context, v1DoorFrames.southCrackedWall, {x: door.x + 16, y: door.y, w: 16, h: 16});
            drawFrame(context, v1DoorFrames.southCrackedWall, {x: door.x + 32, y: door.y, w: 16, h: 16});
        } else {
            if (frame.h > 16) {
                // This handles the case for the future doors.
                drawFrame(context, frame, {...frame, x: door.x, y: door.y + 16 - frame.h});
            } else {
                drawFrame(context, frame, {...frame, x: door.x, y: door.y});
            }
        }
    } else if (door.definition.d === 'up') {
        if (door.isFrozen) {
            return;
        }
        let frame = v1DoorFrames.northDoorway;
        if (door.definition.status === 'cracked'
            || door.definition.status === 'blownOpen'
        ) {
            frame = door.renderOpen(state) ? v1DoorFrames.northBlownup : null;
        }
        // Only draw the top N pixels of southern facing doors over the player so they appear to go behind
        // the top of the doorway.
        if (frame) {
            drawFrame(context, {...frame, h}, {...frame, x: door.x, y: door.y, h});
        }
    } else if (door.definition.d === 'left') {
        let frame = v1DoorFrames.westDoorEmptyForeground;
        if (door.definition.status !== 'normal'
            && door.definition.status !== 'cracked'
            && door.definition.status !== 'blownOpen'
        ) {
            frame = door.renderOpen(state) ? v1DoorFrames.westDoorOpenForeground : null;
        }
        // Draw cracked tiles on top of the door frame graphic.
        if (door.status === 'cracked') {
            drawFrame(context, v1DoorFrames.crackedBackground, {x: door.x, y: door.y, w: 16, h: 16});
            drawFrame(context, v1DoorFrames.crackedBackground, {x: door.x, y: door.y + 16, w: 16, h: 16});
            drawFrame(context, v1DoorFrames.crackedBackground, {x: door.x, y: door.y + 32, w: 16, h: 16});
            drawFrame(context, v1DoorFrames.westCrackedWall, {x: door.x, y: door.y + 16, w: 16, h: 16});
            drawFrame(context, v1DoorFrames.westCrackedWall, {x: door.x, y: door.y + 32, w: 16, h: 16});
        } else if (frame) {
            drawFrame(context, frame, {...frame, x: door.x, y: door.y});
        }
    } else if (door.definition.d === 'right') {
        let frame = v1DoorFrames.eastDoorEmptyForeground;
        if (door.definition.status !== 'normal'
            && door.definition.status !== 'cracked'
            && door.definition.status !== 'blownOpen'
        ) {
            frame = door.renderOpen(state) ? v1DoorFrames.eastDoorOpenForeground : null;
        }
        // Draw cracked tiles on top fo the door frame graphic.
        if (door.status === 'cracked') {
            drawFrame(context, v1DoorFrames.crackedBackground, {x: door.x, y: door.y, w: 16, h: 16});
            drawFrame(context, v1DoorFrames.crackedBackground, {x: door.x, y: door.y + 16, w: 16, h: 16});
            drawFrame(context, v1DoorFrames.crackedBackground, {x: door.x, y: door.y + 32, w: 16, h: 16});
            drawFrame(context, v1DoorFrames.eastCrackedWall, {x: door.x, y: door.y + 16, w: 16, h: 16});
            drawFrame(context, v1DoorFrames.eastCrackedWall, {x: door.x, y: door.y + 32, w: 16, h: 16});
        } else if (frame) {
            drawFrame(context, frame, {...frame, x: door.x, y: door.y});
        }
    }
}

function checkToRenderFrozenDoor(this: void, context: CanvasRenderingContext2D, state: GameState, door: Door) {
    if (!door.isFrozen) {
        return;
    }
    if (door.definition.d === 'up') {
        const frame = getFrame(iceFrontAnimation, state.fieldTime);
        drawFrame(context, frame, {x: door.x - 2, y: door.y + 4, w: frame.w, h: frame.h});
    }
    if (door.definition.d === 'left') {
        const frame = getFrame(iceRightAnimation, state.fieldTime);
        drawFrame(context, frame, {x: door.x + 6, y: door.y + 20, w: frame.w, h: frame.h});
    }
    if (door.definition.d === 'right') {
        const frame = getFrame(iceLeftAnimation, state.fieldTime);
        drawFrame(context, frame, {x: door.x - 6, y: door.y + 20, w: frame.w, h: frame.h});
    }
}

function checkToRenderFrozenDoorForeground(this: void, context: CanvasRenderingContext2D, state: GameState, door: Door) {
    if (!door.isFrozen) {
        return;
    }
    if (door.definition.d === 'down') {
        const frame = getFrame(iceTopAnimation, state.fieldTime);
        drawFrame(context, frame, {x: door.x + 16, y: door.y - 12, w: frame.w, h: frame.h});
    }
}

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
const [ knobbyTreeDoorOpen ] = createAnimation('gfx/tiles/knobbytrees.png', {w: 32, h: 32}, {left: 128, top: 96, cols: 1}).frames;

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
    getHitbox: (door: Door) => Rect
    getPathHitbox: (door: Door) => Rect
    pathBehaviors?: TileBehaviors
    isStairs?: boolean
    render?: (context: CanvasRenderingContext2D, state: GameState, door: Door) => void
    renderForeground?: (context: CanvasRenderingContext2D, state: GameState, door: Door) => void
    down?: DoorStyleFrames,
    right?: DoorStyleFrames,
    up?: DoorStyleFrames,
    left?: DoorStyleFrames,
}

const oldSquareBaseDoorStyle = {
    getHitbox(door: Door) {
        return {x: door.x, y: door.y, w: 32, h: 32};
    },
    getPathHitbox(door: Door) {
        return (door.definition.d === 'up' || door.definition.d === 'down')
            ? {x: door.x + 8, y: door.y, w: 16, h: 32}
            // This is slightly lower than you would naively place it in order to prevent
            // the MCs head from peaking over the top of the frame as they move left/right.
            : {x: door.x, y: door.y + 10, w: 32, h: 16};
    },
};

const commonBaseDoorStyle = {
    getHitbox(door: Door) {
        if (door.definition.d === 'up') {
            return {x: door.x, y: door.y, w: 32, h: 32};
        }
        if (door.definition.d === 'down') {
            return {x: door.x, y: door.y + 8, w: 64, h: 8};
        }
        return {x: door.x, y: door.y, w: 16, h: 64};
    },
    getPathHitbox(door: Door) {
        if (door.definition.d === 'up') {
            return {x: door.x + 8, y: door.y, w: 16, h: 32};
        }
        if (door.definition.d === 'down') {
            return {x: door.x + 24, y: door.y + 8, w: 16, h: 8};
        }
        return {x: door.x, y: door.y + 32, w: 16, h: 16};
    },
};

// WOODEN DOOR STYLE
const woodImage = 'gfx/tiles/woodhousetilesarranged.png';
//const woodenCrackedSouthBackground: Frame = requireFrame(woodImage, {x: 48, y: 0, w: 16, h: 16});
const woodenSouthCrackedWall: Frame = requireFrame(woodImage, {x: 32, y: 96, w: 16, h: 16});
//const woodenCrackedEastBackground: Frame = requireFrame(woodImage, {x: 0, y: 0, w: 16, h: 16});
const woodenEastCrackedWall: Frame =  requireFrame(woodImage, {x: 32, y: 80, w: 16, h: 16});
//const woodenCrackedWestBackground: Frame = requireFrame(woodImage, {x: 0, y: 0, w: 16, h: 16});
const woodenWestCrackedWall: Frame =  requireFrame(woodImage, {x: 32, y: 80, w: 16, h: 16});
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
            if (door.definition.status === 'cracked' || door.definition.status === 'blownOpen') {
                context.fillStyle = 'black';
                context.fillRect(door.x, door.y, 32, 32);
                frame = woodenNorthBlownup;
            }
        } else if (door.status === 'locked') {
            overFrame = lockedDoorCover;
        } else if (door.status === 'bigKeyLocked' ) {
            overFrame = bigLockedDoorCover;
        } else if (door.status === 'cracked') {
            frame = woodenNorthCrack;
        } else {
            // This covers closed, closedEnemy + closedSwitch
            overFrame = blockedDoorCover;
        }
        drawFrame(context, frame, {...frame, x: door.x, y: door.y});
        if (overFrame) {
            drawFrame(context, overFrame, {...overFrame, x: door.x, y: door.y});
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
    checkToRenderFrozenDoor(context, state, door);
}
function renderWoodenDoorForeground(context: CanvasRenderingContext2D, state: GameState, door: Door) {
    checkToRenderFrozenDoorForeground(context, state, door);
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
        if (door.isFrozen) {
            return;
        }
        let frame = woodenNorthDoorway;
        if (door.definition.status === 'cracked'
            || door.definition.status === 'blownOpen'
        ) {
            frame = door.renderOpen(state) ? woodenNorthBlownup : null;
        }
        // Only draw the top 12 pixels of southern facing doors over the player.
        if (frame) {
            drawFrame(context, {...frame, h: 12}, {...frame, x: door.x, y: door.y, h: 12});
        }
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

// CAVERN DOOR STYLE
const cavernImage = 'gfx/tiles/cavearranged2.png';
const cavernCrackedBackground: Frame = requireFrame(cavernImage, {x: 0, y: 240, w: 16, h: 16});
const cavernEastCrackedWall: Frame = requireFrame(cavernImage, {x: 304, y: 64, w: 16, h: 16});
const cavernWestCrackedWall: Frame = requireFrame(cavernImage, {x: 320, y: 64, w: 16, h: 16});
//const cavernNorthCrackedWall: Frame = {image: cavernImage, x: 304, y: 80, w: 16, h: 16};
const cavernSouthCrackedWall: Frame = requireFrame(cavernImage, {x: 320, y: 80, w: 16, h: 16});
const [
    cavernSouthDoorClosed, cavernSouthDoorOpen, cavernSouthDoorEmpty
] = createAnimation('gfx/tiles/cavearranged2.png', {w: 64, h: 16},
    {left: 432, y: 9, cols: 1, rows: 3}).frames;
const [
    cavernWestDoorClosed, cavernEastDoorClosed, cavernWestDoorOpen, cavernEastDoorOpen,
    /* */, /* */, cavernWestDoorEmpty, cavernEastDoorEmpty,
] = createAnimation('gfx/tiles/cavearranged2.png', {w: 16, h: 64},
    {left: 432, y: 0, cols: 4, rows: 2}).frames;
const [
    cavernWestDoorOpenForeground, cavernEastDoorOpenForeground,
    cavernWestDoorEmptyForeground, cavernEastDoorEmptyForeground,
] = createAnimation('gfx/tiles/cavearranged2.png', {w: 16, h: 64},
    {left: 432, top: 192, cols: 4, rows: 1}).frames;
const [
    cavernStairsUp, cavernStairsDown, cavernNorthDoorway, cavernNorthBlownup,
    /*cavernStairs*/, cavernNorthCrack,
] = createAnimation('gfx/tiles/cavearranged2.png', {w: 32, h: 32},
    {left: 304, y: 0, cols: 4, rows: 2}).frames;

const cavernDoorFrames: V1DoorFrames = {
    crackedBackground: cavernCrackedBackground,
    northDoorway: cavernNorthDoorway,
    northBlownup: cavernNorthBlownup,
    northCrack: cavernNorthCrack,
    westDoorEmpty: cavernWestDoorEmpty,
    westDoorEmptyForeground: cavernWestDoorEmptyForeground,
    westDoorOpen: cavernWestDoorOpen,
    westDoorOpenForeground: cavernWestDoorOpenForeground,
    westDoorClosed: cavernWestDoorClosed,
    westCrackedWall: cavernWestCrackedWall,
    eastDoorEmpty: cavernEastDoorEmpty,
    eastDoorEmptyForeground: cavernEastDoorEmptyForeground,
    eastDoorOpen: cavernEastDoorOpen,
    eastDoorOpenForeground: cavernEastDoorOpenForeground,
    eastDoorClosed: cavernEastDoorClosed,
    eastCrackedWall: cavernEastCrackedWall,
    southDoorEmpty: cavernSouthDoorEmpty,
    southDoorOpen: cavernSouthDoorOpen,
    southDoorClosed: cavernSouthDoorClosed,
    southCrackedWall: cavernSouthCrackedWall,
};
const cavernDoorStyle: DoorStyleDefinition = {
    ...commonBaseDoorStyle,
    render: (context, state, door) => renderV1DoorBackground(context, state, door, cavernDoorFrames),
    renderForeground: (context, state, door) => renderV1DoorForeground(context, state, door, cavernDoorFrames),
};

// CRYSTAL DOOR STYLE
const crystalImage = 'gfx/tiles/crystalcavesheet.png';
const crystalCrackedBackground: Frame = requireFrame(crystalImage, {x: 0, y: 240, w: 16, h: 16});
const crystalEastCrackedWall: Frame = requireFrame(crystalImage, {x: 304, y: 64, w: 16, h: 16});
const crystalWestCrackedWall: Frame = requireFrame(crystalImage, {x: 320, y: 64, w: 16, h: 16});
//const crystalNorthCrackedWall: Frame = requireFrame(crystalImage, {x: 304, y: 80, w: 16, h: 16});
const crystalSouthCrackedWall: Frame = requireFrame(crystalImage, {x: 320, y: 80, w: 16, h: 16});
const [
    crystalSouthDoorClosed, crystalSouthDoorOpen, crystalSouthDoorEmpty
] = createAnimation('gfx/tiles/crystalcavesheet.png', {w: 64, h: 16},
    {left: 432, y: 9, cols: 1, rows: 3}).frames;
const [
    crystalWestDoorClosed, crystalEastDoorClosed, crystalWestDoorOpen, crystalEastDoorOpen,
    /* */, /* */, crystalWestDoorEmpty, crystalEastDoorEmpty,
] = createAnimation('gfx/tiles/crystalcavesheet.png', {w: 16, h: 64},
    {left: 432, y: 0, cols: 4, rows: 2}).frames;
const [
    crystalWestDoorOpenForeground, crystalEastDoorOpenForeground,
    crystalWestDoorEmptyForeground, crystalEastDoorEmptyForeground,
] = createAnimation('gfx/tiles/crystalcavesheet.png', {w: 16, h: 64},
    {left: 432, top: 192, cols: 4, rows: 1}).frames;
const [
    crystalStairsUp, crystalStairsDown, crystalNorthDoorway, crystalNorthBlownup,
    /*crystalStairs*/, crystalNorthCrack,
] = createAnimation('gfx/tiles/crystalcavesheet.png', {w: 32, h: 32},
    {left: 304, y: 0, cols: 4, rows: 2}).frames;

const crystalDoorFrames: V1DoorFrames = {
    crackedBackground: crystalCrackedBackground,
    northDoorway: crystalNorthDoorway,
    northBlownup: crystalNorthBlownup,
    northCrack: crystalNorthCrack,
    westDoorEmpty: crystalWestDoorEmpty,
    westDoorEmptyForeground: crystalWestDoorEmptyForeground,
    westDoorOpen: crystalWestDoorOpen,
    westDoorOpenForeground: crystalWestDoorOpenForeground,
    westDoorClosed: crystalWestDoorClosed,
    westCrackedWall: crystalWestCrackedWall,
    eastDoorEmpty: crystalEastDoorEmpty,
    eastDoorEmptyForeground: crystalEastDoorEmptyForeground,
    eastDoorOpen: crystalEastDoorOpen,
    eastDoorOpenForeground: crystalEastDoorOpenForeground,
    eastDoorClosed: crystalEastDoorClosed,
    eastCrackedWall: crystalEastCrackedWall,
    southDoorEmpty: crystalSouthDoorEmpty,
    southDoorOpen: crystalSouthDoorOpen,
    southDoorClosed: crystalSouthDoorClosed,
    southCrackedWall: crystalSouthCrackedWall,
};
const crystalDoorStyle: DoorStyleDefinition = {
    ...commonBaseDoorStyle,
    render: (context, state, door) => renderV1DoorBackground(context, state, door, crystalDoorFrames),
    renderForeground: (context, state, door) => renderV1DoorForeground(context, state, door, crystalDoorFrames),
};

// STONE DOOR STYLE
const stoneImage = 'gfx/tiles/stonetileset.png';
const stoneCrackedBackground = requireFrame(stoneImage, {x: 0, y: 240, w: 16, h: 16});
const stoneEastCrackedWall = requireFrame(stoneImage, {x: 304, y: 64, w: 16, h: 16});
const stoneWestCrackedWall = requireFrame(stoneImage, {x: 320, y: 64, w: 16, h: 16});
//const stoneNorthCrackedWall: Frame = requireFrame(stoneImage, {x: 304, y: 80, w: 16, h: 16});
const stoneSouthCrackedWall = requireFrame(stoneImage, {x: 320, y: 80, w: 16, h: 16});
const [
    stoneSouthDoorClosed, stoneSouthDoorOpen, stoneSouthDoorEmpty
] = createAnimation(stoneImage, {w: 64, h: 16},
    {left: 432, y: 9, cols: 1, rows: 3}).frames;
const [
    stoneWestDoorClosed, stoneEastDoorClosed, stoneWestDoorOpen, stoneEastDoorOpen,
    /* */, /* */, stoneWestDoorEmpty, stoneEastDoorEmpty,
] = createAnimation(stoneImage, {w: 16, h: 64},
    {left: 432, top: 0, cols: 4, rows: 2}).frames;
const [
    stoneWestDoorOpenForeground, stoneEastDoorOpenForeground,
    stoneWestDoorEmptyForeground, stoneEastDoorEmptyForeground,
] = createAnimation(stoneImage, {w: 16, h: 64},
    {left: 432, top: 192, cols: 4, rows: 1}).frames;
const [
    stoneStairsUp, stoneStairsDown, stoneNorthDoorway, stoneNorthBlownup,
    /*stoneStairs*/, stoneNorthCrack,
] = createAnimation(stoneImage, {w: 32, h: 32},
    {left: 304, top: 0, cols: 4, rows: 2}).frames;
const stoneDoorFrames: V1DoorFrames = {
    crackedBackground: stoneCrackedBackground,
    northDoorway: stoneNorthDoorway,
    northBlownup: stoneNorthBlownup,
    northCrack: stoneNorthCrack,
    westDoorEmpty: stoneWestDoorEmpty,
    westDoorEmptyForeground: stoneWestDoorEmptyForeground,
    westDoorOpen: stoneWestDoorOpen,
    westDoorOpenForeground: stoneWestDoorOpenForeground,
    westDoorClosed: stoneWestDoorClosed,
    westCrackedWall: stoneWestCrackedWall,
    eastDoorEmpty: stoneEastDoorEmpty,
    eastDoorEmptyForeground: stoneEastDoorEmptyForeground,
    eastDoorOpen: stoneEastDoorOpen,
    eastDoorOpenForeground: stoneEastDoorOpenForeground,
    eastDoorClosed: stoneEastDoorClosed,
    eastCrackedWall: stoneEastCrackedWall,
    southDoorEmpty: stoneSouthDoorEmpty,
    southDoorOpen: stoneSouthDoorOpen,
    southDoorClosed: stoneSouthDoorClosed,
    southCrackedWall: stoneSouthCrackedWall,
};
const stoneDoorStyle: DoorStyleDefinition = {
    ...commonBaseDoorStyle,
    render: (context, state, door) => renderV1DoorBackground(context, state, door, stoneDoorFrames),
    renderForeground: (context, state, door) => renderV1DoorForeground(context, state, door, stoneDoorFrames),
};

// OBSIDIAN DOOR STYLE
const obsidianImage = 'gfx/tiles/obsidianCliffs.png';
// Missing most of the frames for the obsidian doors, but we can still mostly draw southern facing obsidian doors.
const [
    obsidianStairsUp, obsidianStairsDown, obsidianNorthDoorway
] = createAnimation(obsidianImage, {w: 32, h: 32},
    {left: 112, top: 0, cols: 3, rows: 1}).frames;

const obsidianDoorFrames: V1DoorFrames = {
    crackedBackground: cavernCrackedBackground,
    northDoorway: obsidianNorthDoorway,
    northBlownup: cavernNorthBlownup,
    northCrack: cavernNorthCrack,
    westDoorEmpty: cavernWestDoorEmpty,
    westDoorEmptyForeground: cavernWestDoorEmptyForeground,
    westDoorOpen: cavernWestDoorOpen,
    westDoorOpenForeground: cavernWestDoorOpenForeground,
    westDoorClosed: cavernWestDoorClosed,
    westCrackedWall: cavernWestCrackedWall,
    eastDoorEmpty: cavernEastDoorEmpty,
    eastDoorEmptyForeground: cavernEastDoorEmptyForeground,
    eastDoorOpen: cavernEastDoorOpen,
    eastDoorOpenForeground: cavernEastDoorOpenForeground,
    eastDoorClosed: cavernEastDoorClosed,
    eastCrackedWall: cavernEastCrackedWall,
    southDoorEmpty: cavernSouthDoorEmpty,
    southDoorOpen: cavernSouthDoorOpen,
    southDoorClosed: cavernSouthDoorClosed,
    southCrackedWall: cavernSouthCrackedWall,
};
const obsidianDoorStyle: DoorStyleDefinition = {
    ...commonBaseDoorStyle,
    render: (context, state, door) => renderV1DoorBackground(context, state, door, obsidianDoorFrames),
    renderForeground: (context, state, door) => renderV1DoorForeground(context, state, door, obsidianDoorFrames),
};

// FUTURE DOOR STYLE
const futureImage = 'gfx/tiles/futuristic.png';
// Missing most of the frames for the obsidian doors, but we can still mostly draw southern facing obsidian doors.
const futureDoorClosed = requireFrame(futureImage, {x: 0, y: 1264, w: 32, h: 32});
const futureDoorOpen = requireFrame(futureImage, {x: 48, y: 1264, w: 32, h: 32});
const futureStairsUp = requireFrame(futureImage, {x: 0, y: 1312, w: 32, h: 32});
const futureStairsDown = requireFrame(futureImage, {x: 48, y: 1312, w: 32, h: 32});

const futureSouthClosed = requireFrame(futureImage, {x: 80, y: 1264, w: 64, h: 32});
const futureSouthOpen = requireFrame(futureImage, {x: 128, y: 1264, w: 64, h: 32});

// TODO: support east/west future door graphics. The closed frame is render on top of the door frame, and both are
// entirely in the foreground.
//const futureEastDoor = requireFrame(futureImage, {x: 125, y: 1312, w: 16, h: 64});
//const futureEastClosed = requireFrame(futureImage, {x: 109, y: 1312, w: 16, h: 64});

//const futureWestDoor = requireFrame(futureImage, {x: 147, y: 1312, w: 16, h: 64});
//const futureWestClosed = requireFrame(futureImage, {x: 163, y: 1312, w: 16, h: 64});

const futureDoorFrames: V1DoorFrames = {
    crackedBackground: cavernCrackedBackground,
    northDoorway: futureDoorOpen,
    northClosed: futureDoorClosed,
    northBlownup: cavernNorthBlownup,
    northCrack: cavernNorthCrack,
    westDoorEmpty: cavernWestDoorEmpty,
    westDoorEmptyForeground: cavernWestDoorEmptyForeground,
    westDoorOpen: cavernWestDoorOpen,
    westDoorOpenForeground: cavernWestDoorOpenForeground,
    westDoorClosed: cavernWestDoorClosed,
    westCrackedWall: cavernWestCrackedWall,
    eastDoorEmpty: cavernEastDoorEmpty,
    eastDoorEmptyForeground: cavernEastDoorEmptyForeground,
    eastDoorOpen: cavernEastDoorOpen,
    eastDoorOpenForeground: cavernEastDoorOpenForeground,
    eastDoorClosed: cavernEastDoorClosed,
    eastCrackedWall: cavernEastCrackedWall,
    southDoorEmpty: futureSouthOpen,
    southDoorOpen: futureSouthOpen,
    southDoorClosed: futureSouthClosed,
    southCrackedWall: cavernSouthCrackedWall,
};
const futureDoorStyle: DoorStyleDefinition = {
    ...commonBaseDoorStyle,
    render: (context, state, door) => renderV1DoorBackground(context, state, door, futureDoorFrames),
    renderForeground: (context, state, door) => renderV1DoorForeground(context, state, door, futureDoorFrames, 6),
};

function stairsDoorStyle(baseStyle: DoorStyleDefinition, frame: Frame, h = 12): DoorStyleDefinition {
    return {
        ...oldSquareBaseDoorStyle,
        isStairs: true,
        render(context: CanvasRenderingContext2D, state: GameState, door: Door) {
            if (door.status !== 'normal') {
                baseStyle.render(context, state, door);
                return;
            }
            drawFrameAt(context, frame, {x: door.x, y: door.y});
            checkToRenderFrozenDoor(context, state, door);
        },
        renderForeground(context: CanvasRenderingContext2D, state: GameState, door: Door) {
            if (door.isFrozen) {
                return;
            }
            drawFrame(context, {...frame, h}, {...frame, x: door.x, y: door.y, h});
        },
    };
}

const woodenDoorStyle: DoorStyleDefinition = {
    render: renderWoodenDoor,
    renderForeground: renderWoodenDoorForeground,
    // Woodon door graphics look a bit different than others for the left/right orientations.
    getHitbox(door: Door) {
        if (door.definition.d === 'up') {
            return {x: door.x, y: door.y, w: 32, h: 32};
        }
        if (door.definition.d === 'down') {
            return {x: door.x, y: door.y + 8, w: 64, h: 8};
        }
        return {x: door.x, y: door.y, w: 16, h: 48};
    },
    getPathHitbox(door: Door) {
        if (door.definition.d === 'up') {
            return {x: door.x + 8, y: door.y, w: 16, h: 32};
        }
        if (door.definition.d === 'down') {
            return {x: door.x + 24, y: door.y + 8, w: 16, h: 8};
        }
        return {x: door.x, y: door.y + 16, w: 16, h: 32};
    },
};

export const doorStyles: {[key: string]: DoorStyleDefinition} = {
    cavern: cavernDoorStyle,
    cavernDownstairs: stairsDoorStyle(cavernDoorStyle, cavernStairsDown),
    cavernUpstairs: stairsDoorStyle(cavernDoorStyle, cavernStairsUp),
    crystal: crystalDoorStyle,
    crystalDownstairs: stairsDoorStyle(crystalDoorStyle, crystalStairsDown),
    crystalUpstairs: stairsDoorStyle(crystalDoorStyle, crystalStairsUp),
    stone: stoneDoorStyle,
    stoneDownstairs: stairsDoorStyle(stoneDoorStyle, stoneStairsDown),
    stoneUpstairs: stairsDoorStyle(stoneDoorStyle, stoneStairsUp),
    obsidian: obsidianDoorStyle,
    obsidianDownstairs: stairsDoorStyle(obsidianDoorStyle, obsidianStairsDown),
    obsidianUpstairs: stairsDoorStyle(obsidianDoorStyle, obsidianStairsUp),
    wooden: woodenDoorStyle,
    woodenDownstairs: stairsDoorStyle(woodenDoorStyle, woodenStairsDown),
    woodenUpstairs: stairsDoorStyle(woodenDoorStyle, woodenStairsUp),
    future: futureDoorStyle,
    futureDownstairs: stairsDoorStyle(futureDoorStyle, futureStairsDown, 6),
    futureUpstairs: stairsDoorStyle(futureDoorStyle, futureStairsUp, 6),
    cave: {
        ...oldSquareBaseDoorStyle,
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
        ...oldSquareBaseDoorStyle,
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
        ...oldSquareBaseDoorStyle,
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
    knobbyTree: {
        ...oldSquareBaseDoorStyle,
        up: {
            doorFrame: knobbyTreeDoorOpen,
            doorClosed: knobbyTreeDoorOpen,
            cracked: knobbyTreeDoorOpen,
            caveFrame: knobbyTreeDoorOpen,
            caveCeiling: knobbyTreeDoorOpen,
            cave: knobbyTreeDoorOpen,
            locked: knobbyTreeDoorOpen,
            bigKeyLocked: knobbyTreeDoorOpen,
        },
    },
    ladderUp: {
        render(this: void, context, state, door) {
            if (door.status !== 'normal') {
                return;
            }
            drawFrame(context, ladderMiddle, {x: door.x, y: door.y, w: 16, h: 16});
            drawFrame(context, ladderBottom, {x: door.x, y: door.y + 16, w: 16, h: 16});
        },
        getHitbox(door: Door) {
            // Making this ladder narrow prevents climbing down it from the sides, but
            // has little impact climbing up since the tiles force the hero to the
            // center of the ladder.
            return {x: door.x + 6, y: door.y + 8, w: 4, h: 24};
        },
        getPathHitbox(door: Door) {
            return {x: door.x, y: door.y, w: 16, h: 32};
        },
        pathBehaviors: {climbable: true},
    },
    ladderUpTall: {
        render(this: void, context, state, door) {
            if (door.status !== 'normal') {
                return;
            }
            drawFrame(context, ladderMiddle, {x: door.x, y: door.y, w: 16, h: 16});
            drawFrame(context, ladderMiddle, {x: door.x, y: door.y + 16, w: 16, h: 16});
            drawFrame(context, ladderMiddle, {x: door.x, y: door.y + 32, w: 16, h: 16});
            drawFrame(context, ladderMiddle, {x: door.x, y: door.y + 48, w: 16, h: 16});
            drawFrame(context, ladderMiddle, {x: door.x, y: door.y + 64, w: 16, h: 16});
            drawFrame(context, ladderBottom, {x: door.x, y: door.y + 80, w: 16, h: 16});
        },
        getHitbox(door: Door) {
            // Making this ladder narrow prevents climbing down it from the sides, but
            // has little impact climbing up since the tiles force the hero to the
            // center of the ladder.
            return {x: door.x + 6, y: door.y + 8, w: 4, h: 88};
        },
        getPathHitbox(door: Door) {
            return {x: door.x, y: door.y, w: 16, h: 96};
        },
        pathBehaviors: {climbable: true, solid: true},
    },
    ladderDown: {
        render(this: void, context, state, door) {
            if (door.status !== 'normal') {
                return;
            }
            drawFrame(context, ladderTop, {x: door.x, y: door.y - 16, w: 16, h: 16});
            drawFrame(context, ladderDown, {x: door.x, y: door.y, w: 16, h: 16});
        },
        getHitbox(door: Door) {
            return {x: door.x, y: door.y, w: 16, h: 16};
        },
        getPathHitbox(door: Door) {
            return {x: door.x, y: door.y, w: 16, h: 16};
        },
        pathBehaviors: {climbable: true, solid: true},
    },
    square: oldSquareBaseDoorStyle,
    wideEntrance: {
        // We use isNotSolid here since we see the ground type for this entrance.
        // for example the player should swim through water or wade through shallow water behind this entrance.
        pathBehaviors: {isNotSolid: true, lowCeiling: true, isEntrance: true},
        getHitbox(door: Door) {
            return (door.definition.d === 'up' || door.definition.d === 'down')
                ? {x: door.x, y: door.y, w: 64, h: 16}
                : {x: door.x, y: door.y, w: 16, h: 64};
        },
        getPathHitbox(door: Door) {
            return (door.definition.d === 'up' || door.definition.d === 'down')
                ? {x: door.x, y: door.y, w: 64, h: 16}
                : {x: door.x, y: door.y, w: 16, h: 64};
        },
    },
};
export type DoorStyle = keyof typeof doorStyles;
