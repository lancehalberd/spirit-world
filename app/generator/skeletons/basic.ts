import { applyNineSlice, slices } from 'app/generator/nineSlice';
import { chunkGenerators } from 'app/generator/tileChunkGenerators';
import { directionMap } from 'app/utils/direction';
import { getOrAddLayer, inheritAllLayerTilesFromParent } from 'app/utils/layers';

export function generateTallRoomSkeleton(random: SRandom, area: AreaDefinition, alternateArea: AreaDefinition, section: Rect, rules: RoomGenerationRules): RoomSkeleton {
    const slots: RoomSlot[] = [];
    const paths: RoomPath[] = [];
    const baseArea = area.parentDefinition ? alternateArea : area;
    const childArea = area.parentDefinition ? area : alternateArea;

    chunkGenerators.stoneRoom(random, baseArea, section);
    const innerRect = {
        x: section.x + 1,
        y: section.y + 3,
        w: section.w - 2,
        h: section.h - 4, // This is 28 tiles for the default tall room.
    };
    // This count is for combined slots+paths
    const sectionCount = Math.floor((innerRect.h - 3) / 12);
    // This stores alternating heights for slots/paths.
    const sectionHeights = [];
    let totalHeight = 0;
    for (let i = 0; i < sectionCount * 2; i++) {
        sectionHeights[i] = 6;
        totalHeight += 6;
    }
    for (;totalHeight < innerRect.h - 3; totalHeight++) {
        sectionHeights[Math.floor(random.generateAndMutate() * sectionCount)]++;
    }
    let y = innerRect.y;
    for (let i = 0; i < sectionHeights.length; i++) {
        const h = sectionHeights[i];
        if (i % 2 === 0) {
            slots.unshift({
                id: `slot-${i / 2}`,
                x: innerRect.x,
                y,
                w: innerRect.w,
                h,
                d: 'up',
            });
        } else {
            const targetId = `slot-${(i - 1) / 2}`;
            // The last set of paths are connected to the entrance.
            const sourceId = (i + 1 < sectionCount) ? `slot-${(i + 1) / 2}` : 'entrance';
            paths.push({
                targetId,
                sourceId,
                x: innerRect.x,
                y,
                w: 2,
                h,
                d: 'up',
            });
            paths.push({
                targetId,
                sourceId,
                x: innerRect.x + innerRect.w - 2,
                y,
                w: 2,
                h,
                d: 'up',
            });
            if (random.generateAndMutate() < 0.3) {
                const cx = Math.floor(innerRect.x + innerRect.w / 2);
                paths.push({
                    targetId,
                    sourceId,
                    x: cx,
                    y,
                    w: 2,
                    h,
                    d: 'up',
                });
                applyNineSlice(random, slices.innerStoneWalls, {
                    x: innerRect.x + 1,
                    y,
                    w: cx - (innerRect.x + 1) + 1,
                    h,
                }, baseArea);
                applyNineSlice(random, slices.innerStoneWalls, {
                    x: cx + 1,
                    y,
                    w: innerRect.x + innerRect.w - 1 - (cx + 1),
                    h,
                }, baseArea);
            } else {
                applyNineSlice(random, slices.innerStoneWalls, {
                    x: innerRect.x + 1,
                    y,
                    w: innerRect.w - 2,
                    h,
                }, baseArea);
            }
        }
        y += h;
    }

    inheritAllLayerTilesFromParent(childArea);

    return {slots, paths};
}

const pitTile = 4;

interface PitMazeNode {
    root?: PitMazeNode
    parent?: PitMazeNode
    directions: Direction[]
    distance: number
    x: number
    y: number
}

export function generatePitMaze(random: SRandom, node: TreeNode): RoomSkeleton {
    const slots: RoomSlot[] = [];
    const paths: RoomPath[] = [];
    const baseArea = node.baseArea;
    const section = node.baseAreaSection;
    const columnXValues = [];
    const rowYValues = [];
    const floor2Tiles = getOrAddLayer('floor2', baseArea).grid.tiles;
    // Create pit columns.
    for (let tx = 6; tx <= 26; tx += 4) {
        if (tx <= section.x + 2 || tx >= section.x + section.w - 2) {
            continue;
        }
        columnXValues.push(tx);
        for (let ty = section.y; ty < section.y + section.h; ty++) {
            floor2Tiles[ty][tx] = pitTile;
        }
    }
    columnXValues.unshift(section.x + 1);
    columnXValues.push(section.x + section.w - 1);
    // Create pit rows.
    for (const ty of [6, 11, 22, 27]) {
        if (ty < section.y || ty >= section.y + section.h) {
            continue;
        }
        rowYValues.push(ty);
        for (let tx = section.x; tx < section.x + section.w; tx++) {
            floor2Tiles[ty][tx] = pitTile;
        }
    }
    rowYValues.unshift(section.y + 2);
    rowYValues.push(section.y + section.h - 1);
    const w = columnXValues.length - 1;
    const h = rowYValues.length - 1;
    const grid: PitMazeNode[][] = [];
    for (let y = 0; y < h; y++) {
        grid[y] = [];
    }
    const livePaths: PitMazeNode[] = [];
    let emptyTiles = w * h;


    const entrances = node.allEntranceDefinitions.filter(o => o.type === 'door') as EntranceDefinition[];
    for (const entrance of entrances) {
        let x = -1, y = -1;
        if (entrance.d === 'up') {
            y = 0;
        } else if (entrance.d === 'down') {
            y = h - 1;
        } else {
            for (const ty of rowYValues) {
                if (ty * 16 > entrance.y + 32) {
                    break;
                }
                y++;
            }
        }
        if (entrance.d === 'left') {
            x = 0;
        } else if (entrance.d === 'right') {
            x = w - 1;
        } else {
            for (const tx of columnXValues) {
                // 24 is the average door width / 2.
                // This doesn't need to be precise to get the correct answer.
                if (tx * 16 > entrance.x + 24) {
                    break;
                }
                x++;
            }
        }
        // Doors from other sections in the area will be outside of these bounds.
        if (x >= 0 && x < w && y >= 0 && y < h) {
            const node: PitMazeNode = {
                distance: 0,
                x, y,
                directions: ['up', 'down', 'left', 'right'],
            };
            livePaths.push(node);
            emptyTiles--;
            grid[y][x] = node
            //console.log(x, y, entrance);
        }
    }

    let changed = false;
    do {
        changed = false;
        for (let i = 0; i < livePaths.length; i++) {
            let head = livePaths[i];
            if (head.directions.length) {
                const [dx, dy] = directionMap[random.mutate().removeElement(head.directions)];
                const x = head.x + dx, y = head.y + dy;
                if (x >= 0 && x < w && y >= 0 && y < h && !grid[y][x]) {
                    const node: PitMazeNode = {
                        distance: head.distance + 1,
                        x, y,
                        directions: ['up', 'down', 'left', 'right'],
                    };
                    emptyTiles--;
                    grid[y][x] = node;
                    livePaths[i] = node;
                    changed = true;
                    if (dx) {
                        const tx = columnXValues[Math.max(head.x, head.x + dx)];
                        const ty = random.mutate().range(rowYValues[head.y] + 1, rowYValues[head.y + 1] - 1);
                        floor2Tiles[ty][tx] = 0;
                    } else {
                        const tx = random.mutate().range(columnXValues[head.x] + 1, columnXValues[head.x + 1] - 1);
                        const ty = rowYValues[Math.max(head.y, head.y + dy)];
                        floor2Tiles[ty][tx] = 0;
                    }
                }
            } else if (head.parent) {
                livePaths[i] = head.parent;
                changed = true;
            }
        }
    } while (emptyTiles && changed);
    //console.log({ emptyTiles});

    return {slots, paths};
}
