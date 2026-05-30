import {specialBrushes} from 'app/development/specialBrushes';
import {addCaveRoomFrame, applyCaveWalls, createCaveFloor} from 'app/generator/styles/cave';
import {applyStoneWalls, createStoneFloor} from 'app/generator/styles/stone';
import {chunkGenerators} from 'app/generator/chunks/tileChunkGenerators';
import {generatePathMatrix} from 'app/generator/utils/matrixGenerators';
import {directionMap} from 'app/utils/direction';
import {getOrAddLayer, inheritAllLayerTilesFromParent} from 'app/utils/layers';


// Extract this to generator/styles/stone and refactor chunkGenerators to remove cyclical dependency.
function addStoneRoomFrame(random: SRandom, node: TreeNode): Rect {
        let section = node.baseAreaSection;
    const foregroundLayer = getOrAddLayer('foreground', node.baseArea, node.childArea);
    // Doors on the farthest left column are hard to see so replace this column with void tiles.
    for (let y = section.y; y < section.y + section.h; y++) {
        foregroundLayer.grid.tiles[y][section.x] = 57;
    }
    // Reduce the room size by one to account for the removed column above.
    chunkGenerators.stoneRoom.generate(random, node.baseArea, {
        ...section,
        x: section.x + 1,
        w: section.w - 1,
    }, node.childArea);
    inheritAllLayerTilesFromParent(node.childArea, node.childAreaSection);
    return {
        x: section.x + 2,
        y: section.y + 3,
        w: section.w - 3,
        h: section.h - 4,
    };
}

export function addRoomFrame(random: SRandom, node: TreeNode): Rect {
    if (node.style === 'stone') {
        return addStoneRoomFrame(random, node);
    } else {
        return addCaveRoomFrame(random, node);
    }
}

export function addVoidFrame(node: TreeNode): Rect {
    const fieldTiles = getOrAddLayer('field', node.baseArea, node.childArea).grid.tiles;
    const section = node.baseAreaSection;
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
    return {
        x: section.x + 2,
        y: section.y + 3,
        w: section.w - 3,
        h: section.h - 4,
    };
}
export function fillMatrixRect<V>(matrix: V[][], {x, y, w, h}: Rect, value: V) {
    for (let row = y; row < y + h; row++) {
        for (let column = x; column < x + w; column++) {
            matrix[row][column] = value;
        }
    }
}


export function generateEmptyRoom(random: SRandom, node: TreeNode): RoomSkeleton {
    addRoomFrame(random, node);
    const slots: RoomSlot[] = [];
    const paths: RoomPath[] = [];
    const w = node.wide ? 6 : 4;
    const h = node.tall ? 6 : 4;
    const xs = node.wide ? [8, 16, 24] : [node.baseAreaSection.x + 6, node.baseAreaSection.x + 11];
    const ys = node.tall ? [8, 16, 24] : [node.baseAreaSection.y + 7, node.baseAreaSection.y + 11];
    for (const y of ys) {
        for (const x of xs) {
            slots.push({
                id: 's-' + slots.length,
                x: x - w / 2,
                y: y - h / 2,
                w,
                h,
            });
        }
    }
    return {slots, paths};
}

// const pitTile = 4;

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
    const innerRect = addRoomFrame(random, node);
    const slots: RoomSlot[] = [];
    const paths: RoomPath[] = [];
    const {baseArea, childArea, baseAreaSection: section} = node;
    const columnXValues = [];
    const rowYValues = [];
    // Create pit columns.
    for (let tx = 6; tx <= 26; tx += 4) {
        if (tx <= section.x + 2 || tx >= section.x + section.w - 2) {
            continue;
        }
        columnXValues.push(tx);
        for (let ty = innerRect.y; ty < innerRect.y + innerRect.h + 1; ty++) {
            specialBrushes.cavePitBrush.apply(baseArea, childArea, {x: tx * 16, y: ty * 16}, false);
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
            specialBrushes.cavePitBrush.apply(baseArea, childArea, {x: tx * 16, y: ty * 16}, false);
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

    for (const entrance of node.allEntranceDefinitions) {
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
            specialBrushes.cavePitBrush.apply(baseArea, childArea, {x: tx * 16, y: ty * 16}, true);
        } else {
            const tx = random.mutate().range(columnXValues[x] + 1, columnXValues[x + 1] - 1);
            const ty = rowYValues[Math.max(y, y + dy)];
            specialBrushes.cavePitBrush.apply(baseArea, childArea, {x: tx * 16, y: ty * 16}, true);
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


export function generateVerticalPath(random: SRandom, node: TreeNode): RoomSkeleton|undefined {
    const slots: RoomSlot[] = [];
    const paths: RoomPath[] = [];
    const {baseArea, childArea} = node;
    const fieldTiles = getOrAddLayer('field', baseArea, childArea).grid.tiles;
    const innerRect = addVoidFrame(node);
    let hasNorthDoor = false, hasSouthDoor = false;
    for (const entrance of node.allEntranceDefinitions) {
        if (entrance.d === 'left' || entrance.d === 'right') {
            return;
        } else if (entrance.d === 'up') {
            hasNorthDoor = true;
        } else  if (entrance.d === 'down') {
            hasSouthDoor = true;
        }
    }
    if (hasNorthDoor) {
        innerRect.y += 3;
        innerRect.h -= 3;
    }
    if (hasSouthDoor) {
        innerRect.h -= 3;
    }
    let slotHeight = innerRect.h;
    const slotCount = Math.floor(slotHeight / 8);
    if (node.minimumSlotCount && node.minimumSlotCount > slotCount) {
        return;
    }

    function addPaths(y: number, h: number, sourceId: string, targetId: string) {
        // Start by making the entire row solid.
        fillMatrixRect(fieldTiles, {
            ...innerRect,
            y,
            h,
        }, 57);
        function addPath(x: number) {
            paths.push({
                targetId,
                sourceId,
                x,
                y,
                w: 2,
                h,
                d: 'up',
            });
            fillMatrixRect(fieldTiles, {
                x,
                w: 2,
                y,
                h,
            }, 0);
        }
        // Always add paths to the left and right side.
        addPath(innerRect.x);
        addPath(innerRect.x + innerRect.w - 2);
        // Optionally add a path in the middle 30% of the time.
        if (random.mutateAndGenerate() < 0.3) {
            addPath(Math.floor(innerRect.x + innerRect.w / 2));
        }
    }
    const slotAndPathCount = 2 * slotCount + ((hasNorthDoor && hasSouthDoor) ? 1 : 0);
    const baseHeight = Math.floor(slotHeight / slotAndPathCount);
    let extraHeight = slotHeight - slotAndPathCount * baseHeight;
    function getH() {
        if (extraHeight && random.mutate().random() < 0.5) {
            extraHeight--;
            return baseHeight + 1;
        }
        return baseHeight;
    }

    let y = innerRect.y;
    for (let i = 0; i < slotCount; i++) {
        // Start with a path section
        if (i === 0 && hasNorthDoor) {
            const h = getH();
            addPaths(y, h, 'northEntrance', 's-0');
            y += h;
        }
        const h = getH();
        slots.push({
            id: `s-${i}`,
            x: innerRect.x,
            y,
            w: innerRect.w,
            h,
        });
        y += h;
        if (i < slotCount - 1 || hasSouthDoor) {
            const isAfterLastSlot = (i === slotCount - 1);
            const h = isAfterLastSlot ? baseHeight + extraHeight : getH();
            addPaths(y, h, `s-${i}`, isAfterLastSlot ? `southEntrance` : `s-${i + 1}`);
            y += h;
        }
    }
    // Add a single path connecting north + south if there was no room for interior slots.
    if (!slotCount) {
        addPaths(innerRect.y, Math.min(7, innerRect.h), 'northEntrance', 'southEntrance');
    }

    // Apply the area style to the walls.
    if (node.style === 'cave') {
        createCaveFloor(random, baseArea, node.baseAreaSection, childArea);
        applyCaveWalls(random, baseArea, node.baseAreaSection, childArea);
    } else {
        createStoneFloor(random, baseArea, node.baseAreaSection, childArea);
        applyStoneWalls(random, baseArea, node.baseAreaSection, childArea);
    }
    inheritAllLayerTilesFromParent(childArea);

    return {slots, paths};
}

export function generateShortTunnel(random: SRandom, node: TreeNode): RoomSkeleton|undefined {
    if (node.tall || node.allEntranceDefinitions.length < 2 || node.minimumSlotCount > 0) {
        return;
    }
    const slots: RoomSlot[] = [];
    const paths: RoomPath[] = [];
    let left = 1000, right = 0;
    const section = node.baseAreaSection;
    const fieldTiles = getOrAddLayer('field', node.baseArea, node.childArea).grid.tiles;
    // Fill the entire section with walls that we will later clear out.
    for (let y = section.y; y < section.y + section.h; y++) {
        for (let x = section.x; x < section.x + section.w; x++) {
            // TODO: change/randomize this solid tile to match the style of this node.
            // For example, use crystals in the spirit world.
            fieldTiles[y][x] = 10;
        }
    }
    for (const entrance of node.allEntranceDefinitions) {
        if (entrance.d === 'down') {
            const center = Math.ceil(entrance.x / 16) + 1;
            left = Math.min(left, center);
            right = Math.max(right, center + 1);
            for (let y = section.y + 9; y < section.y + section.h - 1; y++) {
                fieldTiles[y][center] = 0;
               // if (y >= section.y + section.h - 3) {
                    fieldTiles[y][center - 1] = 0;
                    fieldTiles[y][center + 1] = 0;
                //}

            }
        }
        if (entrance.d === 'up') {
            const center = Math.floor(entrance.x / 16) + 1;
            left = Math.min(left, center);
            right = Math.max(right, center + 1);
            for (let y = section.y + 3; y <= section.y + 9; y++) {
                fieldTiles[y][center] = 0;
                //if (y <= section.y + 4) {
                    fieldTiles[y][center - 1] = 0;
                    fieldTiles[y][center + 1] = 0;
                //}
            }
        }
        if (entrance.d === 'left') {
            left = section.x + 2;
        }
        if (entrance.d === 'right') {
            right = section.x + section.w - 1;
        }
    }

    for (let x = left; x < right; x++) {
        fieldTiles[section.y + 8][x] = 0;
        fieldTiles[section.y + 9][x] = 0
        fieldTiles[section.y + 10][x] = 0;
        if (x <= section.x + 3 || x >= section.x + section.w - 3) {
            fieldTiles[section.y + 7][x] = 0;
            fieldTiles[section.y + 11][x] = 0;
        }
    }

    if (node.style === 'stone') {
        createStoneFloor(random, node.baseArea, section, node.childArea);
        applyStoneWalls(random, node.baseArea, section, node.childArea);
    } else {
        createCaveFloor(random, node.baseArea, section, node.childArea);
        applyCaveWalls(random, node.baseArea, section, node.childArea);
    }

    return {slots, paths};
}


export function generateBridgeRoom(random: SRandom, node: TreeNode): RoomSkeleton|undefined {
    if (node.minimumSlotCount > 0) {
        return;
    }
    const innerRect = addRoomFrame(random, node)
    const slots: RoomSlot[] = [];
    const paths: RoomPath[] = [];
    if (innerRect.h <= 0 || innerRect.w <= 0) {
        debugger;
        return {slots, paths};
    }
    const matrix: number[][] = [];
    for (let y = 0; y < innerRect.h + 1; y++) {
        matrix[y] = [];
        for (let x = 0; x < innerRect.w + 2; x++) {
            matrix[y][x] = undefined;
        }
    }
    for (const entrance of node.allEntranceDefinitions) {
        // Convert door bounds to matrix coords.
        const left = Math.floor((entrance.x) / 16 - innerRect.x + 1);
        const right = Math.floor((entrance.x + entrance.w) / 16 - innerRect.x + 1);
        const top = Math.floor((entrance.y) / 16 - innerRect.y);
        const bottom = Math.floor((entrance.y + entrance.h) / 16 - innerRect.y);
        if (entrance.d === 'down' || entrance.d === 'up') {
            const rows = entrance.d === 'up' ? [0] : [innerRect.h - 1, innerRect.h];
            for (let column = left; column <= right; column++) {
                for (const row of rows)matrix[row][column] = 2;
            }
        }
        if (entrance.d === 'left' || entrance.d === 'right') {
            const columns = entrance.d === 'left' ? [0, 1] : [innerRect.w, innerRect.w + 1];
            for (let row = top; row <= bottom; row++) {
                for (const column of columns)matrix[row][column] = 2;
            }
        }
    }
    const pitMatrix = generatePathMatrix({
        random, matrix, pathRadius: 1, debug: false, //node.id.indexOf('mountainPassage') >= 0,
        rowCount: Math.floor(innerRect.h / 5),
        columnCount: Math.floor(innerRect.w / 5),
    });

    for (let y = 0; y < matrix.length; y++) {
        for (let x = 0; x < matrix[y].length; x++) {
            if (pitMatrix[y][x] === 0) {
                const areaPoint = {x: 16 * (innerRect.x - 1 + x), y: 16 * (innerRect.y + y)};
                specialBrushes.cavePitBrush.apply(node.baseArea, node.childArea, areaPoint, false);
            }
        }
    }

    return {slots, paths};
}
