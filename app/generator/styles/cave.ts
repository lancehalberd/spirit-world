import { getOrAddLayer } from 'app/utils/layers';
import { allTiles } from 'app/content/tiles';



const caveFloorTile = 36;
const caveFloorRandomDecorations = [49, 50, 54, 55, 56];
const closedEye = 51;
const openEye = 52;
const rectangle = 53;


export function createCaveFloor(random: SRandom, area: AreaDefinition, r: Rect, alternateArea?: AreaDefinition) {
    const floorLayer = getOrAddLayer('floor', area, alternateArea);
    const floor2Tiles = getOrAddLayer('floor2', area, alternateArea).grid.tiles;
    const floorTiles = floorLayer.grid.tiles;
    // Limit the rectangle to the bounds of the area.
    const x =  Math.max(0, r.x), y = Math.max(0, r.y);
    r = {
        x, y,
        w: Math.min(r.w, floorLayer.grid.w - x),
        h: Math.min(r.h, floorLayer.grid.h - y),
    };
    for (let y = r.y; y < r.y + r.h; y++) {
        for (let x = r.x; x < r.x + r.w; x++) {
            floorTiles[y][x] = caveFloorTile
            if (random.mutate().random() < 0.85) {
                floor2Tiles[y][x] = 0;
                continue;
            }
            floor2Tiles[y][x] = random.mutate().element(caveFloorRandomDecorations);
        }
    }
}

export function createSpecialCaveFloor(random: SRandom, area: AreaDefinition, r: Rect, alternateArea?: AreaDefinition) {
    const floorLayer = getOrAddLayer('floor', area, alternateArea);
    const floor2Tiles = getOrAddLayer('floor2', area, alternateArea).grid.tiles;
    const floorTiles = floorLayer.grid.tiles;
    // Limit the rectangle to the bounds of the area.
    const x =  Math.max(0, r.x), y = Math.max(0, r.y);
    r = {
        x, y,
        w: Math.min(r.w, floorLayer.grid.w - x),
        h: Math.min(r.h, floorLayer.grid.h - y),
    };
    for (let y = r.y; y < r.y + r.h; y++) {
        for (let x = r.x; x < r.x + r.w; x++) {
            floorTiles[y][x] = caveFloorTile
            const isOutsideRow = y === 0 || y === r.h - 1;
            const isOutsideColumn = x === 0 || x === r.w - 1;
            if (isOutsideRow && isOutsideColumn) {
                floor2Tiles[y][x] = rectangle;
            } else if (isOutsideRow || isOutsideColumn) {
                floor2Tiles[y][x] = openEye;
            } else {
                floor2Tiles[y][x] = closedEye;
            }
        }
    }
}

export function addCaveRoomFrame(random: SRandom, node: TreeNode) {
    const fieldTiles = getOrAddLayer('field', node.baseArea, node.childArea).grid.tiles;
    const section = node.baseAreaSection;
    createCaveFloor(random, node.baseArea, section, node.childArea);
    for (const x of [section.x, section.x + 1, section.x + section.w - 1]) {
        for (let y = section.y; y < section.y + section.h; y++) {
            fieldTiles[y][x] = 57;
        }
    }
    for (const y of [section.y, section.y + 1, section.y + 2, section.y + section.h - 1]) {
        for (let x = section.x; x < section.x + section.w; x++) {
            fieldTiles[y][x] = 57;
        }
    }
    applyCaveWalls(random, node.baseArea, section, node.childArea);
}

// Adds cave walls everywhere that is currently solid in the field layer.
// This assumes cave wall height is 2, but this could be generalized to support taller cave walls.
export function applyCaveWalls(random: SRandom, area: AreaDefinition, r: Rect, alternateArea?: AreaDefinition) {
    const fieldLayer = getOrAddLayer('field', area, alternateArea);
    const foregroundLayer = getOrAddLayer('foreground', area, alternateArea);
    const foreground2Layer = getOrAddLayer('foreground2', area, alternateArea);
    const fieldTiles = fieldLayer.grid.tiles;
    const foregroundTiles = foregroundLayer.grid.tiles;
    const foreground2Tiles = foreground2Layer.grid.tiles;
    // Limit the rectangle to the bounds of the area.
    const x =  Math.max(0, r.x), y = Math.max(0, r.y);
    r = {
        x, y,
        w: Math.min(r.w, fieldLayer.grid.w - x),
        h: Math.min(r.h, fieldLayer.grid.h - y),
    };
    const solidChunks: {
        v: {top: number, bottom: number}
        h: {left: number, right: number}
        isLeft?: boolean
        isRight?: boolean
        isConcave?: boolean
    }[][] = [];
    for (let y = r.y; y < r.y + r.h; y++) {
        solidChunks[y] = [];
        if (!fieldTiles[y]) {
            debugger;
        }
        for (let x = r.x; x < r.x + r.w; x++) {
            const fieldTile = allTiles[fieldTiles[y][x]];
            if (!fieldTile?.behaviors?.solid) {
                continue;
            }
            const v = solidChunks[y - 1]?.[x]?.v || {top: y, bottom: y + 1};
            const h = solidChunks[y][x - 1]?.h || {left: x, right: x + 1};
            v.bottom = y + 1;
            h.right = x + 1;
            // Chunks that go off the edge of the box are assumed to be solid indefinitely, so extend the range by 10.
            if (v.top === r.y) {
                v.top -= 10;
            }
            if (v.bottom === r.y + r.h) {
                v.bottom += 10;
            }
            if (h.left === r.x) {
                h.left -= 10;
            }
            if (h.right === r.x + r.w) {
                h.right += 10;
            }
            solidChunks[y][x] = {v, h}
        }
    }
    for (let i = 0; i < 10; i++) {
        let changed = false;
        for (let y = r.y; y < r.y + r.h; y++) {
            for (let x = r.x; x < r.x + r.w; x++) {
                if (!solidChunks[y][x]) {
                    continue;
                }
                const {v, h} = solidChunks[y][x];
                if (v.bottom - v.top >= 4 && h.right - h.left >= 2) {
                    continue;
                }
                // Split the vertical chunk into two pieces.
                // Create a new chunk for any pieces left above.
                const top = Math.max(v.top, r.y);
                if (y > top) {
                    const newV = {...v, bottom: y};
                    for (let j = top; j < y; j++) {
                        solidChunks[j][x].v = newV;
                    }
                }
                // Update the existing chunk for piece below
                v.top = y + 1;
                // Split the horizontal chunk into two pieces.
                const left = Math.max(h.left, r.x);
                if (x > left) {
                    const newH = {...h, right: x};
                    for (let j = left; j < x; j++) {
                        solidChunks[y][j].h = newH;
                    }
                }
                h.left = x + 1;

                // Place a single tile wall here, we cannot tile this with walls.
                fieldTiles[y][x] = 10;
                // This tile is no longer part of any solid chunks.
                delete solidChunks[y][x];
                changed = true;
            }
        }
        if (!changed) {
            break;
        }
    }
    // Calculate from bottom up so we can determine concavity of southern walls from the bottom tile up.
    for (let y = r.y + r.h - 1; y >= r.y; y--) {
        for (let x = r.x; x < r.x + r.w; x++) {
            if (!solidChunks[y][x]) {
                continue;
            }
            fieldTiles[y][x] = 0;
            const parity = (x + y) % 2
            const {v, h} = solidChunks[y][x];
            if (y === v.top) {
                // Northern facing wall
                if (x === h.left) {
                    if ((y + 1 >= r.y + r.h || solidChunks[y + 1][x - 1]) && (x + 1 >= r.x + r.w || solidChunks[y - 1][x + 1])) {
                        // Make the tile concave if this is an inside corner.
                        foreground2Tiles[y][x] = 749;
                    } else {
                        foreground2Tiles[y][x] = 748;
                    }
                } else if (x === h.right - 1) {
                    if ((y + 1 >= r.y + r.h || solidChunks[y + 1][x + 1]) && (x - 1 < r.x || solidChunks[y - 1][x - 1])) {
                        // Make the tile concave if this is an inside corner.
                        foreground2Tiles[y][x] = 746;
                    } else {
                        foreground2Tiles[y][x] = 747;
                    }
                } else {
                    foregroundTiles[y][x] = 28;
                    // This row should always be defined since rows beyond the range would be assumed solid (and this is the top of the chunk).
                    foreground2Tiles[y - 1][x] = [744, 745][(parity + 1) % 2];
                }
            } else if (y === v.bottom - 1) {
                // Bottom part of south wall
                if (x === h.left) {
                    solidChunks[y][x].isLeft = true;
                    solidChunks[y][x].isConcave = (y - 1 < r.y || !!solidChunks[y - 1][x - 1]) && (x + 1 >= r.x + r.w || !!solidChunks[y + 1][x + 1]);
                    if (solidChunks[y][x].isConcave) {
                        fieldTiles[y][x] = 772;
                    } else {
                        fieldTiles[y][x] = 771;
                    }
                } else if (x === h.right - 1) {
                    solidChunks[y][x].isRight = true;
                    solidChunks[y][x].isConcave = (y - 1 < r.y || !!solidChunks[y - 1][x + 1]) && (x - 1 < r.x || !!solidChunks[y + 1][x - 1]);
                    if (solidChunks[y][x].isConcave) {
                        fieldTiles[y][x] = 773;
                    } else {
                        fieldTiles[y][x] = 774;
                    }
                } else {
                    fieldTiles[y][x] = [762, 763][parity];
                }
            } else if (y === v.bottom - 2) {
                // Upper part of south wall
                solidChunks[y][x].isLeft = solidChunks[y + 1][x].isLeft;
                solidChunks[y][x].isRight = solidChunks[y + 1][x].isRight;
                solidChunks[y][x].isConcave = solidChunks[y + 1][x].isConcave;
                if (x === h.left) {
                    fieldTiles[y][x] = [765, 768][parity];
                } else if (x === h.right - 1) {
                    fieldTiles[y][x] = [766, 769][parity];
                } else {
                    if (solidChunks[y][x].isLeft) {
                        fieldTiles[y][x] = 764;
                    } else if (solidChunks[y][x].isRight) {
                        fieldTiles[y][x] = 770;
                    } else {
                        fieldTiles[y][x] = [753, 754][parity];
                    }
                }
            } else if (y === v.bottom - 3) {
                // Ceiling above south wall
                foregroundTiles[y][x] = 57;
                const {isLeft, isRight, isConcave} = solidChunks[y + 1][x];
                if (x === h.left) {
                    foreground2Tiles[y][x] = isConcave ? 883 : 882;
                } else if (x === h.right - 1) {
                    foreground2Tiles[y][x] = isConcave ? 884 : 885;
                } else {
                    if (isLeft) {
                        foreground2Tiles[y][x] = isConcave ? 883 : 882;
                    } else if (isRight) {
                        foreground2Tiles[y][x] = isConcave ? 884 : 885;
                    } else {
                        // These tiles don't look very good.
                        //foreground2Tiles[y][x] = [732, 733][parity];
                        // So just reuse the tiles from the north walls.
                        foreground2Tiles[y][x] = [744, 745][parity];
                    }
                }
            } else {
                // Vertical interior.
                foregroundTiles[y][x] = 57;
                if (x === h.left) {
                    foreground2Tiles[y][x] = [736, 740][parity];
                } else if (x === h.right - 1) {
                    foreground2Tiles[y][x] = [737, 741][parity];
                } else {
                    const h1 = solidChunks[y + 1]?.[x]?.h, h2 = solidChunks[y + 2]?.[x]?.h
                    if (x === h1?.right - 1 || x === h2?.right - 1) {
                        foreground2Tiles[y][x] = [737, 741][parity];
                    } else if (x === h1?.left || x === h2?.left) {
                        foreground2Tiles[y][x] = [736, 740][parity];
                    }
                }
            }
        }
    }
}
