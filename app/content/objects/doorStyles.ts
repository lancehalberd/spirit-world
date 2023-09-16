import type { Door } from 'app/content/objects/door';
import { createAnimation, drawFrame, drawFrameAt } from 'app/utils/animations';
import { debugCanvas } from 'app/utils/canvas';
import { requireFrame } from 'app/utils/packedImages';

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
const [
    blockedDoorCover, lockedDoorCover, bigLockedDoorCover,
] = createAnimation('gfx/tiles/cavearranged2.png', {w: 32, h: 32},
    {left: 304, top: 224, cols: 3, rows: 1}).frames;

debugCanvas;//(blockedDoorCover);

function renderCavernDoor(this: void, context: CanvasRenderingContext2D, state: GameState, door: Door) {
    if (door.definition.d === 'up') {
        let frame = cavernNorthDoorway, overFrame: Frame = null;
        if (door.renderOpen(state)) {
            if (door.definition.status === 'cracked' || door.definition.status === 'blownOpen') {
                context.fillStyle = 'black';
                context.fillRect(door.x, door.y, 32, 32);
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
        if (frame) {
            drawFrame(context, {...frame, h: 12}, {...frame, x: door.x, y: door.y, h: 12});
        }
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
const [
    blockedCrystalDoorCover, lockedCrystalDoorCover, bigLockedCrystalDoorCover,
] = createAnimation('gfx/tiles/crystalcavesheet.png', {w: 32, h: 32},
    {left: 304, top: 224, cols: 3, rows: 1}).frames;

debugCanvas;//(blockedDoorCover);

function renderCrystalDoor(this: void, context: CanvasRenderingContext2D, state: GameState, door: Door) {
    if (door.definition.d === 'up') {
        let frame = crystalNorthDoorway, overFrame: Frame = null;
        if (door.renderOpen(state)) {
            if (door.definition.status === 'cracked' || door.definition.status === 'blownOpen') {
                context.fillStyle = 'black';
                context.fillRect(door.x, door.y, 32, 32);
                frame = crystalNorthBlownup;
            }
        } else if (door.status === 'locked') {
            overFrame = lockedCrystalDoorCover;
        } else if (door.status === 'bigKeyLocked' ) {
            overFrame = bigLockedCrystalDoorCover;
        } else if (door.status === 'cracked') {
            frame = crystalNorthCrack;
        } else if (door.definition.status !== 'frozen') {
            // This covers closed, closedEnemy + closedSwitch
            overFrame = blockedCrystalDoorCover;
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
        let frame = crystalWestDoorEmpty;
        if (door.definition.status !== 'normal'
            && door.definition.status !== 'cracked'
            && door.definition.status !== 'blownOpen'
        ) {
            frame = door.renderOpen(state) ? crystalWestDoorOpen : crystalWestDoorClosed;
        }
        drawFrame(context, frame, {...frame, x: door.x, y: door.y});
    } else if (door.definition.d === 'right') {
        if (door.status === 'cracked') {
            return;
        }
        let frame = crystalEastDoorEmpty;
        if (door.definition.status !== 'normal'
            && door.definition.status !== 'cracked'
            && door.definition.status !== 'blownOpen'
        ) {
            frame = door.renderOpen(state) ? crystalEastDoorOpen : crystalEastDoorClosed;
        }
        drawFrame(context, frame, {...frame, x: door.x, y: door.y});
    }
    // There is no background frame for southern doors.
}

function renderCrystalDoorForeground(context: CanvasRenderingContext2D, state: GameState, door: Door) {
    if (door.definition.d === 'down') {
        let frame = crystalSouthDoorEmpty;
        // This frame is used if the doorway can have a door in it (closed or locked).
        if (door.definition.status !== 'normal'
            && door.definition.status !== 'cracked'
            && door.definition.status !== 'blownOpen'
        ) {
            frame = door.renderOpen(state) ? crystalSouthDoorOpen : crystalSouthDoorClosed;
        }
        // Draw cracked tiles instead of the door.
        if (door.status === 'cracked') {
            drawFrame(context, crystalCrackedBackground, {x: door.x, y: door.y, w: 16, h: 16});
            drawFrame(context, crystalCrackedBackground, {x: door.x + 16, y: door.y, w: 16, h: 16});
            drawFrame(context, crystalCrackedBackground, {x: door.x + 32, y: door.y, w: 16, h: 16});
            drawFrame(context, crystalCrackedBackground, {x: door.x + 48, y: door.y, w: 16, h: 16});
            drawFrame(context, crystalSouthCrackedWall, {x: door.x + 16, y: door.y, w: 16, h: 16});
            drawFrame(context, crystalSouthCrackedWall, {x: door.x + 32, y: door.y, w: 16, h: 16});
        } else {
            drawFrame(context, frame, {...frame, x: door.x, y: door.y});
        }
    } else if (door.definition.d === 'up') {
        let frame = crystalNorthDoorway;
        if (door.definition.status === 'cracked'
            || door.definition.status === 'blownOpen'
            || door.definition.status === 'frozen'
        ) {
            frame = door.renderOpen(state) ? crystalNorthBlownup : null;
        }
        // Only draw the top 12 pixels of southern facing doors over the player.
        if (frame) {
            drawFrame(context, {...frame, h: 12}, {...frame, x: door.x, y: door.y, h: 12});
        }
    } else if (door.definition.d === 'left') {
        let frame = crystalWestDoorEmptyForeground;
        if (door.definition.status !== 'normal'
            && door.definition.status !== 'cracked'
            && door.definition.status !== 'blownOpen'
        ) {
            frame = door.renderOpen(state) ? crystalWestDoorOpenForeground : null;
        }
        // Draw cracked tiles on top fo the door frame graphic.
        if (door.status === 'cracked') {
            drawFrame(context, crystalCrackedBackground, {x: door.x, y: door.y, w: 16, h: 16});
            drawFrame(context, crystalCrackedBackground, {x: door.x, y: door.y + 16, w: 16, h: 16});
            drawFrame(context, crystalCrackedBackground, {x: door.x, y: door.y + 32, w: 16, h: 16});
            drawFrame(context, crystalWestCrackedWall, {x: door.x, y: door.y + 16, w: 16, h: 16});
            drawFrame(context, crystalWestCrackedWall, {x: door.x, y: door.y + 32, w: 16, h: 16});
        } else if (frame) {
            drawFrame(context, frame, {...frame, x: door.x, y: door.y});
        }
    } else if (door.definition.d === 'right') {
        let frame = crystalEastDoorEmptyForeground;
        if (door.definition.status !== 'normal'
            && door.definition.status !== 'cracked'
            && door.definition.status !== 'blownOpen'
        ) {
            frame = door.renderOpen(state) ? crystalEastDoorOpenForeground : null;
        }
        // Draw cracked tiles on top fo the door frame graphic.
        if (door.status === 'cracked') {
            drawFrame(context, crystalCrackedBackground, {x: door.x, y: door.y, w: 16, h: 16});
            drawFrame(context, crystalCrackedBackground, {x: door.x, y: door.y + 16, w: 16, h: 16});
            drawFrame(context, crystalCrackedBackground, {x: door.x, y: door.y + 32, w: 16, h: 16});
            drawFrame(context, crystalEastCrackedWall, {x: door.x, y: door.y + 16, w: 16, h: 16});
            drawFrame(context, crystalEastCrackedWall, {x: door.x, y: door.y + 32, w: 16, h: 16});
        } else if (frame) {
            drawFrame(context, frame, {...frame, x: door.x, y: door.y});
        }
    }
}


const stoneImage = 'gfx/tiles/stonetileset.png';
const stoneCrackedBackground: Frame = requireFrame(stoneImage, {x: 0, y: 240, w: 16, h: 16});
const stoneEastCrackedWall: Frame = requireFrame(stoneImage, {x: 304, y: 64, w: 16, h: 16});
const stoneWestCrackedWall: Frame = requireFrame(stoneImage, {x: 320, y: 64, w: 16, h: 16});
//const stoneNorthCrackedWall: Frame = requireFrame(stoneImage, {x: 304, y: 80, w: 16, h: 16});
const stoneSouthCrackedWall: Frame = requireFrame(stoneImage, {x: 320, y: 80, w: 16, h: 16});
const [
    stoneSouthDoorClosed, stoneSouthDoorOpen, stoneSouthDoorEmpty
] = createAnimation(stoneImage, {w: 64, h: 16},
    {left: 432, y: 9, cols: 1, rows: 3}).frames;
const [
    stoneWestDoorClosed, stoneEastDoorClosed, stoneWestDoorOpen, stoneEastDoorOpen,
    /* */, /* */, stoneWestDoorEmpty, stoneEastDoorEmpty,
] = createAnimation(stoneImage, {w: 16, h: 64},
    {left: 432, y: 0, cols: 4, rows: 2}).frames;
const [
    stoneWestDoorOpenForeground, stoneEastDoorOpenForeground,
    stoneWestDoorEmptyForeground, stoneEastDoorEmptyForeground,
] = createAnimation(stoneImage, {w: 16, h: 64},
    {left: 432, top: 192, cols: 4, rows: 1}).frames;
const [
    stoneStairsUp, stoneStairsDown, stoneNorthDoorway, stoneNorthBlownup,
    /*stoneStairs*/, stoneNorthCrack,
] = createAnimation(stoneImage, {w: 32, h: 32},
    {left: 304, y: 0, cols: 4, rows: 2}).frames;
const [
    blockedStoneDoorCover, lockedStoneDoorCover, bigLockedStoneDoorCover,
] = createAnimation(stoneImage, {w: 32, h: 32},
    {left: 304, top: 224, cols: 3, rows: 1}).frames;

debugCanvas;//(blockedDoorCover);

function renderStoneDoor(this: void, context: CanvasRenderingContext2D, state: GameState, door: Door) {
    if (door.definition.d === 'up') {
        let frame = stoneNorthDoorway, overFrame: Frame = null;
        if (door.renderOpen(state)) {
            if (door.definition.status === 'cracked' || door.definition.status === 'blownOpen') {
                context.fillStyle = 'black';
                context.fillRect(door.x, door.y, 32, 32);
                frame = stoneNorthBlownup;
            }
        } else if (door.status === 'locked') {
            overFrame = lockedStoneDoorCover;
        } else if (door.status === 'bigKeyLocked' ) {
            overFrame = bigLockedStoneDoorCover;
        } else if (door.status === 'cracked') {
            frame = stoneNorthCrack;
        } else if (door.definition.status !== 'frozen') {
            // This covers closed, closedEnemy + closedSwitch
            overFrame = blockedStoneDoorCover;
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
        let frame = stoneWestDoorEmpty;
        if (door.definition.status !== 'normal'
            && door.definition.status !== 'cracked'
            && door.definition.status !== 'blownOpen'
        ) {
            frame = door.renderOpen(state) ? stoneWestDoorOpen : stoneWestDoorClosed;
        }
        drawFrame(context, frame, {...frame, x: door.x, y: door.y});
    } else if (door.definition.d === 'right') {
        if (door.status === 'cracked') {
            return;
        }
        let frame = stoneEastDoorEmpty;
        if (door.definition.status !== 'normal'
            && door.definition.status !== 'cracked'
            && door.definition.status !== 'blownOpen'
        ) {
            frame = door.renderOpen(state) ? stoneEastDoorOpen : stoneEastDoorClosed;
        }
        drawFrame(context, frame, {...frame, x: door.x, y: door.y});
    }
    // There is no background frame for southern doors.
}

function renderStoneDoorForeground(context: CanvasRenderingContext2D, state: GameState, door: Door) {
    if (door.definition.d === 'down') {
        let frame = stoneSouthDoorEmpty;
        // This frame is used if the doorway can have a door in it (closed or locked).
        if (door.definition.status !== 'normal'
            && door.definition.status !== 'cracked'
            && door.definition.status !== 'blownOpen'
        ) {
            frame = door.renderOpen(state) ? stoneSouthDoorOpen : stoneSouthDoorClosed;
        }
        // Draw cracked tiles instead of the door.
        if (door.status === 'cracked') {
            drawFrame(context, stoneCrackedBackground, {x: door.x, y: door.y, w: 16, h: 16});
            drawFrame(context, stoneCrackedBackground, {x: door.x + 16, y: door.y, w: 16, h: 16});
            drawFrame(context, stoneCrackedBackground, {x: door.x + 32, y: door.y, w: 16, h: 16});
            drawFrame(context, stoneCrackedBackground, {x: door.x + 48, y: door.y, w: 16, h: 16});
            drawFrame(context, stoneSouthCrackedWall, {x: door.x + 16, y: door.y, w: 16, h: 16});
            drawFrame(context, stoneSouthCrackedWall, {x: door.x + 32, y: door.y, w: 16, h: 16});
        } else {
            drawFrame(context, frame, {...frame, x: door.x, y: door.y});
        }
    } else if (door.definition.d === 'up') {
        let frame = stoneNorthDoorway;
        if (door.definition.status === 'cracked'
            || door.definition.status === 'blownOpen'
            || door.definition.status === 'frozen'
        ) {
            frame = door.renderOpen(state) ? stoneNorthBlownup : null;
        }
        // Only draw the top 12 pixels of southern facing doors over the player.
        if (frame) {
            drawFrame(context, {...frame, h: 12}, {...frame, x: door.x, y: door.y, h: 12});
        }
    } else if (door.definition.d === 'left') {
        let frame = stoneWestDoorEmptyForeground;
        if (door.definition.status !== 'normal'
            && door.definition.status !== 'cracked'
            && door.definition.status !== 'blownOpen'
        ) {
            frame = door.renderOpen(state) ? stoneWestDoorOpenForeground : null;
        }
        // Draw cracked tiles on top fo the door frame graphic.
        if (door.status === 'cracked') {
            drawFrame(context, stoneCrackedBackground, {x: door.x, y: door.y, w: 16, h: 16});
            drawFrame(context, stoneCrackedBackground, {x: door.x, y: door.y + 16, w: 16, h: 16});
            drawFrame(context, stoneCrackedBackground, {x: door.x, y: door.y + 32, w: 16, h: 16});
            drawFrame(context, stoneWestCrackedWall, {x: door.x, y: door.y + 16, w: 16, h: 16});
            drawFrame(context, stoneWestCrackedWall, {x: door.x, y: door.y + 32, w: 16, h: 16});
        } else if (frame) {
            drawFrame(context, frame, {...frame, x: door.x, y: door.y});
        }
    } else if (door.definition.d === 'right') {
        let frame = stoneEastDoorEmptyForeground;
        if (door.definition.status !== 'normal'
            && door.definition.status !== 'cracked'
            && door.definition.status !== 'blownOpen'
        ) {
            frame = door.renderOpen(state) ? stoneEastDoorOpenForeground : null;
        }
        // Draw cracked tiles on top fo the door frame graphic.
        if (door.status === 'cracked') {
            drawFrame(context, stoneCrackedBackground, {x: door.x, y: door.y, w: 16, h: 16});
            drawFrame(context, stoneCrackedBackground, {x: door.x, y: door.y + 16, w: 16, h: 16});
            drawFrame(context, stoneCrackedBackground, {x: door.x, y: door.y + 32, w: 16, h: 16});
            drawFrame(context, stoneEastCrackedWall, {x: door.x, y: door.y + 16, w: 16, h: 16});
            drawFrame(context, stoneEastCrackedWall, {x: door.x, y: door.y + 32, w: 16, h: 16});
        } else if (frame) {
            drawFrame(context, frame, {...frame, x: door.x, y: door.y});
        }
    }
}

export const doorStyles: {[key: string]: DoorStyleDefinition} = {
    cavernDownstairs: {
        ...oldSquareBaseDoorStyle,
        isStairs: true,
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
        },
    },
    cavernUpstairs: {
        ...oldSquareBaseDoorStyle,
        isStairs: true,
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
        },
    },
    cavern: {
        ...commonBaseDoorStyle,
        render: renderCavernDoor,
        renderForeground: renderCavernDoorForeground,
    },
    crystalDownstairs: {
        ...oldSquareBaseDoorStyle,
        isStairs: true,
        render(context: CanvasRenderingContext2D, state: GameState, door: Door) {
            if (door.status !== 'normal') {
                doorStyles.crystal.render(context, state, door);
                return;
            }
            const frame = crystalStairsDown;
            drawFrameAt(context, frame, {x: door.x, y: door.y});
        },
        renderForeground(context: CanvasRenderingContext2D, state: GameState, door: Door) {
            const frame = crystalStairsDown;
            drawFrame(context, {...frame, h: 12}, {...frame, x: door.x, y: door.y, h: 12});
        },
    },
    crystalUpstairs: {
        ...oldSquareBaseDoorStyle,
        isStairs: true,
        render(context: CanvasRenderingContext2D, state: GameState, door: Door) {
            if (door.status !== 'normal') {
                doorStyles.crystal.render(context, state, door);
                return;
            }
            const frame = crystalStairsUp;
            drawFrameAt(context, frame, {x: door.x, y: door.y});
        },
        renderForeground(context: CanvasRenderingContext2D, state: GameState, door: Door) {
            const frame = crystalStairsUp;
            drawFrame(context, {...frame, h: 12}, {...frame, x: door.x, y: door.y, h: 12});
        },
    },
    crystal: {
        ...commonBaseDoorStyle,
        render: renderCrystalDoor,
        renderForeground: renderCrystalDoorForeground,
    },
    stoneDownstairs: {
        ...oldSquareBaseDoorStyle,
        isStairs: true,
        render(context: CanvasRenderingContext2D, state: GameState, door: Door) {
            if (door.status !== 'normal') {
                doorStyles.stone.render(context, state, door);
                return;
            }
            const frame = stoneStairsDown;
            drawFrameAt(context, frame, {x: door.x, y: door.y});
        },
        renderForeground(context: CanvasRenderingContext2D, state: GameState, door: Door) {
            const frame = stoneStairsDown;
            drawFrame(context, {...frame, h: 12}, {...frame, x: door.x, y: door.y, h: 12});
        },
    },
    stoneUpstairs: {
        ...oldSquareBaseDoorStyle,
        isStairs: true,
        render(context: CanvasRenderingContext2D, state: GameState, door: Door) {
            if (door.status !== 'normal') {
                doorStyles.stone.render(context, state, door);
                return;
            }
            const frame = stoneStairsUp;
            drawFrameAt(context, frame, {x: door.x, y: door.y});
        },
        renderForeground(context: CanvasRenderingContext2D, state: GameState, door: Door) {
            const frame = stoneStairsUp;
            drawFrame(context, {...frame, h: 12}, {...frame, x: door.x, y: door.y, h: 12});
        },
    },
    stone: {
        ...commonBaseDoorStyle,
        render: renderStoneDoor,
        renderForeground: renderStoneDoorForeground,
    },
    woodenDownstairs: {
        ...oldSquareBaseDoorStyle,
        isStairs: true,
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
        },
    },
    woodenUpstairs: {
        ...oldSquareBaseDoorStyle,
        isStairs: true,
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
        },
    },
    wooden: {
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
    },
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
        pathBehaviors: {climbable: true},
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
        pathBehaviors: {climbable: true},
    },
    square: oldSquareBaseDoorStyle,
    wideEntrance: {
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
