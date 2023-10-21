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
    i: number
}
interface PitMazeConnection {
    x: number
    y: number
    dx: number
    dy: number
    sum?: number
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
    const allNodes: PitMazeNode[] = [];

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
                i: livePaths.length,
                directions: ['up', 'down', 'left', 'right'],
            };
            node.root = node;
            livePaths.push(node);
            allNodes.push(node);
            emptyTiles--;
            grid[y][x] = node;
        }
    }

    const allConnections: PitMazeConnection[] = [];

    let changed = false;
    do {
        changed = false;
        for (let i = 0; i < livePaths.length; i++) {
            let head = livePaths[i];
            if (head.directions.length) {
                changed = true;
                const [dx, dy] = directionMap[random.mutate().removeElement(head.directions)];
                const x = head.x + dx, y = head.y + dy;
                if (x >= 0 && x < w && y >= 0 && y < h && !grid[y][x]) {
                    const node: PitMazeNode = {
                        distance: head.distance + 1,
                        parent: head,
                        root: head.root,
                        x, y,
                        i: head.i,
                        directions: ['up', 'down', 'left', 'right'],
                    };
                    emptyTiles--;
                    grid[y][x] = node;
                    livePaths[i] = node;
                    allNodes.push(node);
                    allConnections.push({x: head.x, y: head.y, dx, dy});

                }
            } else if (head.parent) {
                changed = true;
                livePaths[i] = head.parent;
            }
        }
    } while (emptyTiles && changed);

    // If there is more than one path, we need to join them altogether.
    if (livePaths.length > 1) {
        const bestConnections: PitMazeConnection[][] = [];
        for (let i = 0; i < livePaths.length; i++) {
            bestConnections[i] = [];
        }
        for (let y = 0; y < h - 1; y++) {
            for (let x = 0; x < w - 1; x++) {
                const node = grid[y][x ];
                if (!node) {
                    continue;
                }
                for (const [dx, dy] of [[1, 0], [0, 1]]) {
                    const nextNode = grid[y + dy][x + dx];
                    if (!nextNode || nextNode.i === node.i) {
                        continue;
                    }
                    const sum = node.distance + nextNode.distance;
                    if (!bestConnections[node.i][nextNode.i] || bestConnections[node.i][nextNode.i].sum < sum) {
                        bestConnections[node.i][nextNode.i] = {x, y, dx, dy, sum};
                        bestConnections[nextNode.i][node.i] = {x, y, dx, dy, sum};
                    }
                }
            }
        }
        const groups: Set<number>[] = [];
        for (let i = 0; i < livePaths.length; i++) {
            groups[i] = new Set([i]);
        }
        const sortedConnections: PitMazeConnection[] = [];
        for (let i = 1; i < livePaths.length; i++) {
            for (let j = 0; j < i; j++) {
                if (bestConnections[i][j]) {
                    sortedConnections.push(bestConnections[i][j]);
                }
            }
        }
        sortedConnections.sort((a, b) => b.sum - a.sum);
        for (const connection of sortedConnections) {
            const nodeA = grid[connection.y][connection.x];
            const nodeB = grid[connection.y + connection.dy][connection.x + connection.dx];
            if (!groups[nodeA.i].has(nodeB.i)) {
                allConnections.push(connection);
                const combinedGroup = new Set([...groups[nodeA.i], ...groups[nodeB.i]]);
                groups[nodeA.i] = combinedGroup;
                groups[nodeB.i] = combinedGroup;
            }
        }
    }

    for (const connection of allConnections) {
        const {x, y, dx, dy} = connection;
        if (dx) {
            const tx = columnXValues[Math.max(x, x + dx)];
            const ty = random.mutate().range(rowYValues[y] + 1, rowYValues[y + 1] - 1);
            floor2Tiles[ty][tx] = 0;
        } else {
            const tx = random.mutate().range(columnXValues[x] + 1, columnXValues[x + 1] - 1);
            const ty = rowYValues[Math.max(y, y + dy)];
            floor2Tiles[ty][tx] = 0;
        }
    }

    allNodes.sort((a, b) => b.distance - a.distance);

    for (let i = 0; i < 4 && i < allNodes.length; i++) {
        const node = allNodes[i];
        const left = columnXValues[node.x] + 1;
        const right = columnXValues[node.x + 1];
        const top = rowYValues[node.y] + 1;
        const bottom = rowYValues[node.y + 1];
        slots.push({
            id: 's-' + slots.length,
            x: left,
            y: top,
            w: right - left,
            h: bottom - top,
        });
    }

    return {slots, paths};
}
