import { canCross2Gaps, canRemoveLightStones, hasBigKey, hasSmallKey, hasWeapon } from 'app/content/logic';
import { zones } from 'app/content/zones/zoneHash';
import { variantSeed } from 'app/gameConstants';
import { getOrAddLayer, inheritAllLayerTilesFromParent } from 'app/utils/layers';
import srandom from 'app/utils/SRandom';
import { chunkGenerators, createSpecialStoneFloor } from 'app/generator/tileChunkGenerators';
import { generateEmptyRoom, generatePitMaze, generateVerticalPath } from 'app/generator/skeletons/basic';
import { addDoorAndClearForegroundTiles, getEntranceDefintion, positionDoors } from 'app/generator/doors';
import { populateTombBoss, populateTombGuardianRoom } from 'app/generator/rooms/tomb';
import { pad } from 'app/utils/index';

const baseVariantRandom = srandom.seed(variantSeed);

/* 
TODO: Add location cues to stairs/entrances/teleporters
TODO:
2. Add shortcut cycles from leaf nodes after spatial assignment.
    A. Starting with the deepest leaf, do a BFS of the grid up to depth 3 and stop on encountering a populated node.
    B. For each populated node, record the node, path and the difference in node depth

TODO: Improve performance by creating zones on demand. (This might be more work than it is worth)
    Make generation within each zone independent of other zones.
    Only generate data needed for randomization initially
        Randomizer logic with full definitions needed for randomization
            lootObject: {id, type, amount, level} instead of just objectId on checks
            doorObject: {...} instead of objectId for entrances/locked doors
        Update randomizer to modify these values during entrance/item randomization when they are found
    Make generation read definitions from generated logic when generated the final zone so that randomizer changes are applied.

    * If this is too much work, an alternative would be to use in demand generation for procedural only so that mode is fast, and
    then for randomizer just generate everything initially as part of randomization since randomization takes a while anyway.

TODO: Add tags that can be set on nodes/slots/paths that can be used for additional context for example:
    'high'/'low' to indicate relative z value
    'far' to indicate a slot is out of the way and may be a good place to place a check or switch
    'turret' might indicate a good spot to place a ranged stationary enemy.
*/

interface ZoneConstraints {
    minX?: number
    maxX?: number
    maxW?: number
    minY?: number
    maxY?: number
    maxH?: number
    minZ?: number
    maxZ?: number
    maxD?: number
}

interface Bounds {
    xMin: number
    xMax: number
    yMin: number
    yMax: number
    zMin: number
    zMax: number
}
function valueMatchesConstraints(newMin: number, newMax: number, currentMin: number, currentMax: number, minValue: number, maxValue: number, maxSpread: number): boolean{
    // If this is a wide or a tall room, then the values %2 must be 0,1 and not 1,0 in order to fit inside a single super tile.
    if (newMin % 2 !== 0 && newMax % 2 === 0) {
        return false;
    }
    if (typeof minValue === 'number' && newMin < minValue) {
        return false;
    }
    if (typeof maxValue === 'number' && newMax > maxValue) {
        return false;
    }
    if (typeof maxSpread === 'number' && ((currentMax - newMin + 1) > maxSpread || (newMax - currentMin + 1) > maxSpread)) {
        return false;
    }
    return true;
}

function areCoordsOpen(nodeMap, x: number, y: number, z: number, w: number, h: number) {
    for (let dy = 0; dy < h; dy++) {
        for (let dx = 0; dx < w; dx++) {
            if (nodeMap[`${z}:${x + dx}x${y + dy}`]) {
                return false;
            }
        }
    }
    return true
}

function attemptToPlaceChild(
    random: SRandom,
    nodeMap: {[key in string]: TreeNode},
    {xMin, xMax, yMin, yMax, zMin, zMax}: Bounds,
    constraints: ZoneConstraints,
    parent: TreeNode,
    child: TreeNode
): TreeNode|false {
    let {x, y, z} = parent.coords;
    const isKeyBlocked = child.requirements?.[0]?.[0] === hasSmallKey || child.requirements?.[0]?.[0] === hasBigKey;
    // These coordinates don't expand the dimensions of the dungeon at all.
    const goodCoords: Point[] = [];
    // These coords don't add new floors to the dungeon.
    const normalCoords: Point[] = [];
    // These coords require adding a new floor to the dungeon.
    const badCoords: Point[] = [];
    const supportedDirections = {
        up: !child.entranceDirections || child.entranceDirections.includes('up'),
        down: !child.entranceDirections || child.entranceDirections.includes('down'),
        left: !child.entranceDirections || child.entranceDirections.includes('left'),
        right: !child.entranceDirections || child.entranceDirections.includes('right'),
    }
    const w = child.wide === true ? 2 : 1;
    const h = child.tall === true ? 2 : 1;
    child.dimensions = {w, h};
    // If the child is tall, it's y value when placed east/west must be even.
    y = child.tall ? parent.coords.y - Math.abs(parent.coords.y % 2) : parent.coords.y;
    if (supportedDirections.right) {
        const left = x - 1 - (w - 1);
        const right = left + (w - 1);
        if (!isKeyBlocked && valueMatchesConstraints(left, right, xMin, xMax, constraints.minX, constraints.maxX, constraints.maxW)) {
            if (left >= xMin || (constraints.maxW && xMax - left + 1 <= constraints.maxW)) {
                goodCoords.push({x: left, y, z});
                if (parent.tall && !child.tall) {
                    goodCoords.push({x: left, y: y + 1, z});
                }
            } else {
                normalCoords.push({x: left, y, z});
                if (parent.tall && !child.tall) {
                    normalCoords.push({x: left, y: y + 1, z});
                }
            }
        }
    }
    if (supportedDirections.left) {
        const left = x + parent.dimensions.w;
        const right = left + (w - 1);
        if (!isKeyBlocked && valueMatchesConstraints(left, right, xMin, xMax, constraints.minX, constraints.maxX, constraints.maxW)) {
            if (right <= xMax || (constraints.maxW && right - xMin + 1 <= constraints.maxW)) {
                goodCoords.push({x: left, y, z});
                if (parent.tall && !child.tall) {
                    goodCoords.push({x: left, y: y + 1, z});
                }
            } else {
                normalCoords.push({x: left, y, z});
                if (parent.tall && !child.tall) {
                    normalCoords.push({x: left, y: y + 1, z});
                }
            }
        }
    }
    // If the child is wide, it's x value when placed east/west must be even.
    y = parent.coords.y;
    x = child.wide ? parent.coords.x - Math.abs(parent.coords.x % 2) : parent.coords.x;
    if (supportedDirections.down) {
        const top = y - 1 - (h - 1);
        const bottom = top + (h - 1);
        if (valueMatchesConstraints(top, bottom, yMin, yMax, constraints.minY, constraints.maxY, constraints.maxH)) {
            if (top >= yMin || (constraints.maxH && yMax - top + 1 <= constraints.maxH)) {
                goodCoords.push({x, y: top, z});
                if (parent.wide && !child.wide) {
                    goodCoords.push({x: x + 1, y: top, z});
                }
            } else {
                normalCoords.push({x, y: top, z});
                if (parent.wide && !child.wide) {
                    normalCoords.push({x: x + 1, y: top, z});
                }
            }
        }
    }
    if (supportedDirections.up) {
        const top = y + parent.dimensions.h;
        const bottom = top + (h - 1);
        if (!isKeyBlocked && valueMatchesConstraints(top, bottom, yMin, yMax, constraints.minY, constraints.maxY, constraints.maxH)) {
            if (bottom <= yMax || (constraints.maxH && bottom - yMin + 1 <= constraints.maxH)) {
                goodCoords.push({x, y: top, z});
                if (parent.wide && !child.wide) {
                    goodCoords.push({x: x + 1, y: top, z});
                }
            } else {
                normalCoords.push({x, y: top, z});
                if (parent.wide && !child.wide) {
                    normalCoords.push({x: x + 1, y: top, z});
                }
            }
        }
        x = child.wide ? parent.coords.x - Math.abs(parent.coords.x % 2) : parent.coords.x;
        y = child.tall ? parent.coords.y - Math.abs(parent.coords.y % 2) : parent.coords.y;
        // Currently stairs are only supported at the top of areas. This means that if the tops of the parents + child do not align,
        // We cannot create a staircase between them.
        // Dropping this constraint is tricky because it either means allowing staircases not to line up between floors (maybe this isn't too bad),
        // or requiring all generated tall areas to support spawning stairs cases in the southern half or alternatively, allowing nodes that
        // don't allow this to specify it as a constraint the stairs cannot spawn in the southern half.
        if (y === parent.coords.y && valueMatchesConstraints(z - 1, z - 1, zMin, zMax, constraints.minZ, constraints.maxZ, constraints.maxD)) {
            if (z - 1 >= zMin) {
                normalCoords.push({x, y, z: z - 1});
                if (parent.wide && !child.wide) {
                    normalCoords.push({x: x + 1, y, z: z - 1});
                }
            } else {
                badCoords.push({x, y, z: z - 1});
                if (parent.wide && !child.wide) {
                    badCoords.push({x: x + 1, y, z: z - 1});
                }
            }
        }
        if (y === parent.coords.y && valueMatchesConstraints(z + 1, z + 1, zMin, zMax, constraints.minZ, constraints.maxZ, constraints.maxD)) {
            if (z + 1 <= zMax) {
                normalCoords.push({x, y, z: z + 1});
                if (parent.wide && !child.wide) {
                    normalCoords.push({x: x + 1, y, z: z + 1});
                }
            } else {
                badCoords.push({x, y, z: z + 1});
                if (parent.wide && !child.wide) {
                    badCoords.push({x: x + 1, y, z: z + 1});
                }
            }
        }
    }
    /*console.log(supportedDirections);
    console.log(goodCoords);
    console.log(normalCoords);
    console.log(badCoords);*/
    for (const coordsList of [goodCoords, normalCoords, badCoords]) {
        random.generateAndMutate();
        for (const coords of random.shuffle(coordsList)) {
            if (tryPlacingNode(nodeMap, child, coords)) {
                return child;
            }
        }
    }
    //if (child.id === 'extra-t-hiddenTomb-node27') {
    //    debugger;
    //}
    if (supportedDirections.up) {
        for (let i = 2; i < 10; i++) {
            if ((valueMatchesConstraints(z + i, z + i, zMin, zMax, constraints.minZ, constraints.maxZ, constraints.maxD) &&
                tryPlacingNode(nodeMap, child, {x, y, z: z + i}))
                ||
                (valueMatchesConstraints(z - i, z - i, zMin, zMax, constraints.minZ, constraints.maxZ, constraints.maxD) &&
                tryPlacingNode(nodeMap, child, {x, y, z: z - i}))
            ) {
                return child;
            }
        }
    }
    // If this node was key blocked, create another intermediate node that is not key blocked and see if that can be placed.
    if (isKeyBlocked) {
        const newNode: TreeNode = {
            nodes: [child],
            id: `keyblock-${child.id}`,
        };
        const childIndex = parent.nodes.indexOf(child);
        parent.nodes.splice(childIndex, 1, newNode);
        return attemptToPlaceChild(random, nodeMap, {xMin, xMax, yMin, yMax, zMin, zMax}, constraints, parent, newNode);
    }
    // If we failed to place the child and it has defined entrance directions, we need to add an intermediate node without
    // the entrance direction restriction. To make sure this resolves as quickly as possible, we
    if (child.entranceDirections) {
        // Exhaust all paths that stay on the same floor first.
        const pathMapGood: {[key in Direction]?: number[][][]} = {
            down: [
                [[x - 1, y, z], [x - 1, y - 1, z]],
                [[x + 1, y, z], [x + 1, y - 1, z]],
            ],
            up: [
                [[x - 1, y, z], [x - 1, y + 1, z]],
                [[x + 1, y, z], [x + 1, y + 1, z]],
            ],
            right: [
                [[x, y - 1, z], [x - 1, y - 1, z]],
                [[x, y + 1, z], [x - 1, y + 1, z]],
            ],
            left: [
                [[x, y - 1, z], [x + 1, y - 1, z]],
                [[x, y + 1, z], [x + 1, y + 1, z]],
            ],
        };
        // Fall back to paths that change floors if none of the others work.
        const pathMapBad: {[key in Direction]?: number[][][]} = {
            down: [
                [[x, y, z - 1], [x, y - 1, z - 1]],
                [[x, y, z + 1], [x, y - 1, z + 1]],
            ],
            up: [
                [[x, y, z - 1], [x, y + 1, z - 1]],
                [[x, y, z + 1], [x, y + 1, z + 1]],
            ],
            right: [
                [[x, y, z - 1], [x - 1, y, z - 1]],
                [[x, y, z + 1], [x - 1, y, z + 1]],
            ],
            left: [
                [[x, y, z - 1], [x + 1, y, z - 1]],
                [[x, y, z + 1], [x + 1, y, z + 1]],
            ],
        };
        for (const pathMap of [pathMapGood, pathMapBad]) {
            random.generateAndMutate();
            for (const direction of random.shuffle(Object.keys(pathMap))) {
                if (child.entranceDirections.includes(direction as Direction)) {
                    random.generateAndMutate();
                    for (const path of random.shuffle(pathMap[direction as Direction])) {
                        const [x1, y1, z1] = path[0];
                        const [x2, y2, z2] = path[1];
                        // Validate all the coordinates respect the constraints
                        if (!valueMatchesConstraints(x1, x1, xMin, xMax, constraints.minX, constraints.maxX, constraints.maxW)
                            || !valueMatchesConstraints(x2, x2 + w - 1, xMin, xMax, constraints.minX, constraints.maxX, constraints.maxW)
                            || !valueMatchesConstraints(y1, y1, yMin, yMax, constraints.minY, constraints.maxY, constraints.maxH)
                            || !valueMatchesConstraints(y2, y2 + h - 1, yMin, yMax, constraints.minY, constraints.maxY, constraints.maxH)
                            || !valueMatchesConstraints(z1, z1, zMin, zMax, constraints.minZ, constraints.maxZ, constraints.maxD)
                            || !valueMatchesConstraints(z2, z1, zMin, zMax, constraints.minZ, constraints.maxZ, constraints.maxD)
                        ) {
                            continue;
                        }
                        if (areCoordsOpen(nodeMap, x1, y1, z1, 1, 1) && areCoordsOpen(nodeMap, x2, y2, z2, w, h)) {

                            const newNode: TreeNode = {
                                nodes: [child],
                                id: `between-${child.id}`,
                                dimensions: {w: 1, h: 1},
                            };
                            const childIndex = parent.nodes.indexOf(child);
                            parent.nodes.splice(childIndex, 1, newNode);
                            tryPlacingNode(nodeMap, newNode, {x: x1, y: y1, z: z1});
                            return newNode;
                        }
                    }
                }
            }
        }
        // If we still haven't placed the node then just add a new node using the standard rules.
        // Eventually it will path to somewhere that the requirements are met:
        const newNode: TreeNode = {
            nodes: [child],
            id: `extra-${child.id}`,
        };
        const childIndex = parent.nodes.indexOf(child);
        parent.nodes.splice(childIndex, 1, newNode);
        return attemptToPlaceChild(random, nodeMap, {xMin, xMax, yMin, yMax, zMin, zMax}, constraints, parent, newNode);
    }
    console.error('Failed to place child node', {parent, child});
    debugger;
    return false;
}


// 32% change to expand in one direction => ~10% chance to expand in both.
const expandRoomChance = 0.32;

function checkToExpandPlacedNode(
    random: SRandom,
    nodeMap: {[key in string]: TreeNode},
    {xMin, xMax, yMin, yMax, zMin, zMax}: Bounds,
    constraints: ZoneConstraints,
    node: TreeNode
) {
    function tryMakingWider() {
        // Can only expand nodes randomly when they don't have explicit flags set for wide/tall.
        if (node.wide !== undefined) {
            return;
        }
        if (random.generateAndMutate() > expandRoomChance) {
            return;
        }
        // Can only expand if the new coordinate fits within the constraints for the x value.
        const left = node.coords.x - Math.abs(node.coords.x % 2);
        const right = left + 1;
        if (!valueMatchesConstraints(left, right, xMin, xMax, constraints.minX, constraints.maxX, constraints.maxW)) {
            return;
        }
        node.dimensions.w = 2;
        if (tryPlacingNode(nodeMap, node, {x: left, y: node.coords.y, z: node.coords.z})) {
            //console.log('Made node wide', node);
            node.wide = true;
        } else {
            node.dimensions.w = 1;
        }
    }
    function tryMakingTaller() {
        // Can only expand nodes randomly when they don't have explicit flags set for wide/tall.
        if (node.tall !== undefined) {
            return;
        }
        if (random.generateAndMutate() > expandRoomChance) {
            return;
        }
        // Can only expand if the new coordinate fits within the constraints for the y value.
        const top = node.coords.y - Math.abs(node.coords.y % 2);
        const bottom = top + 1;
        // Nodes with stairs cases can only expand down, otherwise the stairs won't line up correctly.
        if (top !== node.coords.y && node.hasStairs) {
            return;
        }
        if (!valueMatchesConstraints(top, bottom, yMin, yMax, constraints.minY, constraints.maxY, constraints.maxH)) {
            return;
        }
        node.dimensions.h = 2;
        if (tryPlacingNode(nodeMap, node, {x: node.coords.x, y: top, z: node.coords.z})) {
            // console.log('Made node tall', node);
            node.tall = true;
        } else {
            node.dimensions.h = 1;
        }
    }
    random.generateAndMutate();
    if (random.generateAndMutate() < 0.5) {
        tryMakingWider();
        tryMakingTaller();
    } else {
        tryMakingTaller();
        tryMakingWider();
    }

}


function sortNodesWithEntranceDirectionsFirst(a: TreeNode, b: TreeNode): number {
    const aHasRequirements = a.entranceDirections || a.requirements?.[0][0] === hasSmallKey || a.requirements?.[0][0] === hasBigKey;
    const bHasRequirements = b.entranceDirections || b.requirements?.[0][0] === hasSmallKey || b.requirements?.[0][0] === hasBigKey;
    if (aHasRequirements&& !bHasRequirements) {
        return -1;
    }
    if (bHasRequirements && !aHasRequirements) {
        return 1;
    }
    return 0;
}

function createZoneFromTree(props: {
    random: SRandom
    zoneId: string
    tree: TreeNode
    constraints: ZoneConstraints
    entrance: {x: number[], y: number[], z: number[]}
}) {
    const {entrance, random, zoneId, tree, constraints} = props;
    const zone: Zone = {
        key: zoneId,
        floors: [],
    };
    normalizeTree(random, tree);
    mutateTree(random, tree);

    const nodeMap: {[key: string]: TreeNode} = {};
    // Choose random parity for the starting room so that the initial room is not always placed in the top left corner
    random.generateAndMutate();
    const startX = random.range(entrance.x[0], entrance.x[1]);
    random.generateAndMutate();
    const startY = random.range(entrance.y[0], entrance.y[1]);
    random.generateAndMutate();
    const startZ = random.range(entrance.z[0], entrance.z[1]);
    let xMin = startX, xMax = startX, yMin = startY, yMax = startY, zMin = startZ, zMax = startZ;
    if (xMin % 2) {
        xMin--;
    }
    if (xMax % 2 === 0) {
        xMax++;
    }
    if (yMin % 2) {
        yMin--;
    }
    if (yMax % 2 === 0) {
        yMax++;
    }
    tree.coords = {x: startX, y: startY, z: startZ};
    tree.dimensions = {w: tree.wide ? 2: 1, h: tree.tall ? 2 : 1};
    checkToExpandPlacedNode(
        random,
        nodeMap,
        {xMin, xMax, yMin, yMax, zMin, zMax},
        constraints,
        tree
    );
    nodeMap[`${startZ}:${startX}x${startY}`] = tree;
    tree.id = `${zoneId}-node0`;
    const placedNodes: TreeNode[] = [tree];
    // This queue will contain parent nodes to have their children processed for BFS processing.
    let queue = [tree], safety = 0;
    while (queue.length && safety++ < 1000) {
        let parent = queue.shift();
        const sortedChildren = (parent.nodes || []).sort(sortNodesWithEntranceDirectionsFirst);
        for (const child of sortedChildren) {
            child.id = `t-${zoneId}-node${placedNodes.length}`;
            // When attempting to place the child, a new node may be generated and placed instead.
            // So always process the returned node that was placed, not the child itself.
            const placedNode = attemptToPlaceChild(
                random,
                nodeMap,
                {xMin, xMax, yMin, yMax, zMin, zMax},
                constraints,
                parent,
                child
            );
            if (placedNode) {
                if (placedNode.coords.z !== parent.coords.z) {
                    placedNode.hasStairs = true;
                    parent.hasStairs = true;
                }
                placedNode.id = `${zoneId}-node${placedNodes.length}`;
                // If a node does not have a defined size, it will be a square room by default.
                // This function will randomly expand the room in one or both dimensions if
                // there is room to do so.
                checkToExpandPlacedNode(
                    random,
                    nodeMap,
                    {xMin, xMax, yMin, yMax, zMin, zMax},
                    constraints,
                    placedNode
                );
                queue.push(placedNode);
                placedNodes.push(placedNode);
                xMin = Math.min(xMin, placedNode.coords.x);
                // Because each unit is half a super tile, we require
                // the x and y values to always be even.
                if (xMin % 2) {
                    xMin--;
                }
                xMax = Math.max(xMax, placedNode.coords.x + placedNode.dimensions.w - 1);
                if (xMax % 2 === 0) {
                    xMax++;
                }
                yMin = Math.min(yMin, placedNode.coords.y);
                if (yMin % 2) {
                    yMin--;
                }
                yMax = Math.max(yMax, placedNode.coords.y + placedNode.dimensions.h - 1);
                if (yMax % 2 === 0) {
                    yMax++;
                }
                zMin = Math.min(zMin, placedNode.coords.z);
                zMax = Math.max(zMax, placedNode.coords.z);
            } else {
                console.error('Failed to place child node', {parent, child});
                debugger;
            }
        }
    }
    if (safety >= 1000) {
        console.error('Infinte loop in createZoneFromTree');
        debugger;
    }
    finalizeTree(tree);
    const floorCount = 1 + zMax - zMin;
    for (let floor = 0; floor < floorCount; floor++) {
        const grid: AreaDefinition[][] = [], spiritGrid: AreaDefinition[][] = [];
        let rows: string[] = []
        for (let y = 0; y < 1 + yMax - yMin; y++) {
            const gY = (y / 2) | 0;
            grid[gY] = grid[gY] || [];
            spiritGrid[gY] = spiritGrid[gY] || [];
            let row = '';
            for (let x = 0; x < 1 + xMax - xMin; x++) {
                const gX = (x / 2) | 0;
                const key = `${floor + zMin}:${x + xMin}x${y + yMin}`;
                const node = nodeMap[key];
                const baseSection = {x: (x % 2) * 16, y: (y % 2) * 16, w: 16, h: 16};
                const childSection = {x: (x % 2) * 16, y: (y % 2) * 16, w: 16, h: 16};
                grid[gY][gX] = grid[gY][gX] || {
                    w: 32,
                    h: 32,
                    layers: [],
                    objects: [],
                    sections: [],
                };
                spiritGrid[gY][gX] = spiritGrid[gY][gX] || {
                    parentDefinition: grid[gY][gX],
                    isSpiritWorld: true,
                    layers: [],
                    objects: [],
                    sections: [],
                };
                // If there is no node here, add a default empty section here.
                if (!node) {
                    grid[gY][gX].sections.push(baseSection);
                    spiritGrid[gY][gX].sections.push(childSection);
                    row += '.';
                    continue;
                }
                row += '+';
                if (!node.baseArea) {
                    if (node.dimensions.w === 2) {
                        baseSection.x = 0;
                        baseSection.w = 32;
                        childSection.x = 0;
                        childSection.w = 32;
                    }
                    if (node.dimensions.h === 2) {
                        baseSection.y = 0;
                        baseSection.h = 32;
                        childSection.y = 0;
                        childSection.h = 32;
                    }
                    node.baseArea = grid[gY][gX];
                    node.childArea = spiritGrid[gY][gX];
                    node.baseAreaSection = baseSection;
                    node.childAreaSection = childSection;
                    grid[gY][gX].sections.push(baseSection);
                    spiritGrid[gY][gX].sections.push(childSection);
                }
            }
            rows.push(row);
        }
        // console.log(rows.join("\n"));
        zone.floors[floor] = {
            grid,
            spiritGrid,
        };
    }
    // Add floor/walls to all placed rooms
    for (const node of placedNodes) {
        let section = node.baseAreaSection;
        if (!node.baseArea || !node.childArea) {
            console.error('Placed node missing area', node);
            debugger;
            continue;
        }
        const foregroundLayer = getOrAddLayer('foreground', node.baseArea, node.childArea);
        for (let y = section.y; y < section.y + section.h; y++) {
            foregroundLayer.grid.tiles[y][section.x] = 57;
        }
        // Reduce the room size by one to account for the removed column above.
        section = {
            ...section,
            x: section.x + 1,
            w: section.w - 1,
        };
        chunkGenerators.stoneRoom(random, node.baseArea, section);
        inheritAllLayerTilesFromParent(node.childArea, node.childAreaSection);
        node.allEntranceDefinitions = [];
    }

    // Populate contents of nodes, including door connections.
    for (const node of placedNodes) {
        /*
        TODO: Support multiple parallel requirements. Not sure how to do this yet: [[canCross2Gaps], [canRemoveLightStones]]},
        TODO: Populate tomb boss room.
        */
        if (node.entrance) {
            const entranceDoorData = getEntranceDefintion({
                id: node.entrance.id,
                d: node.entrance.d,
                style: node.style,
                type: node.entrance.type,
            });
            positionDoors(random, entranceDoorData, node);
            addDoorAndClearForegroundTiles(entranceDoorData.definition, node.baseArea, node.childArea);
            entranceDoorData.definition.targetZone = node.entrance.targetZone;
            entranceDoorData.definition.targetObjectId = node.entrance.targetObjectId;
            node.allEntranceDefinitions.push(entranceDoorData.definition);
        }

        const enemyDoors: string[] = [];
        //const switchDoors: string = [];

        // Add doors between nodes.
        for (const child of (node.nodes || [])) {
            let baseDoorData: ReturnType<typeof getEntranceDefintion>, childDoorData: ReturnType<typeof getEntranceDefintion>;
            const parentId = `${node.id}-to-${child.id}`;
            // For locked doors/stair cases it is simplest if paired doors always share the same id.
            // This could be a problem if a closed door is paired with a locked door, so let's just prevent that by adding
            // an additional node anywhere we would do that.
            const childId = parentId;
            if (node.coords.z !== child.coords.z) {
                baseDoorData = getEntranceDefintion({
                    id: parentId,
                    d: 'up',
                    style: node.style,
                    type: node.coords.z < child.coords.z ? 'upstairs' : 'downstairs',
                });
                childDoorData = getEntranceDefintion({
                    id: childId,
                    d: 'up',
                    style: node.style,
                    type: node.coords.z < child.coords.z ? 'downstairs' : 'upstairs',
                });
                baseDoorData.definition.targetZone = zoneId;
                baseDoorData.definition.targetObjectId = childDoorData.definition.id;
                childDoorData.definition.targetZone = zoneId;
                childDoorData.definition.targetObjectId = baseDoorData.definition.id;
            } else if (node.coords.y + node.dimensions.h <= child.coords.y || child.coords.y + child.dimensions.h <= node.coords.y) {
                baseDoorData = getEntranceDefintion({
                    id: parentId,
                    d: node.coords.y < child.coords.y ? 'down' : 'up',
                    style: node.style,
                    type: 'door',
                });
                childDoorData = getEntranceDefintion({
                    id: childId,
                    d: node.coords.y < child.coords.y ? 'up' : 'down',
                    style: node.style,
                    type: 'door',
                });
            } else {
                baseDoorData = getEntranceDefintion({
                    id: parentId,
                    d: node.coords.x < child.coords.x ? 'right' : 'left',
                    style: node.style,
                    type: 'door',
                });
                childDoorData = getEntranceDefintion({
                    id: childId,
                    d: node.coords.x < child.coords.x ? 'left' : 'right',
                    style: node.style,
                    type: 'door',
                });
            }
            // Doors leading out of boss chambers should have status closedEnemy
            if (node.type === 'boss') {
                baseDoorData.definition.status = 'closedEnemy';
            }
            if (child.type === 'boss' || child.type === 'trap') {
                childDoorData.definition.status = 'closedEnemy';
                // Force enemy trap doors open when the player has no weapon to defeat the enemies
                // so that they do not get softlocked in the room.
                childDoorData.definition.openLogic = {logicKey: 'hasWeapon', isInverted: true};
            }
            if (child.requirements?.[0][0] === hasWeapon) {
                baseDoorData.definition.status = 'closedEnemy';
                enemyDoors.push(baseDoorData.definition.id);
            }
            if (child.requirements?.[0][0] === hasSmallKey) {
                if (baseDoorData.definition.d === 'up' && node.type !== 'boss') {
                    baseDoorData.definition.status = 'locked';
                }
                if (childDoorData.definition.d === 'up' && node.type !== 'boss') {
                    childDoorData.definition.status = 'locked';
                }
                // Locked door pairs must share an id so they are unlocked together.
                if (baseDoorData.definition.status === 'locked' && childDoorData.definition.status === 'locked') {
                    childDoorData.definition.id = baseDoorData.definition.id;
                }
            }
            if (child.requirements?.[0][0] === hasBigKey) {
                if (baseDoorData.definition.d === 'up' && node.type !== 'boss') {
                    baseDoorData.definition.status = 'bigKeyLocked';
                }
                if (childDoorData.definition.d === 'up' && child.type !== 'boss') {
                    childDoorData.definition.status = 'bigKeyLocked';
                }
                // Locked door pairs must share an id so they are unlocked together.
                if (baseDoorData.definition.status === 'bigKeyLocked' && childDoorData.definition.status === 'bigKeyLocked') {
                    childDoorData.definition.id = baseDoorData.definition.id;
                }
            }
            positionDoors(random, baseDoorData, node, childDoorData, child);
            if (child.requirements?.[0][0] === canRemoveLightStones || child.requirements?.[0][0] === canCross2Gaps) {
                const fieldLayer = getOrAddLayer('field', node.baseArea, node.childArea);
                const tiles = child.requirements?.[0][0] === canRemoveLightStones ? [6, 6, 7] : [4, 4, 4, 25];
                const definition = baseDoorData.definition;
                const isVertical = definition.d === 'up' || definition.d === 'down';
                const yR = isVertical ? 3 : 2;
                const xR = isVertical ? 2 : 3;
                const cx = definition.x + baseDoorData.w / 2;
                let cy = definition.y + baseDoorData.h / 2;
                const left = Math.floor(cx / 16 - xR), right = Math.floor(cx / 16 + xR);
                const top = Math.floor(cy / 16 - yR), bottom = Math.floor(cy / 16 + yR);
                for (let y = top; y <= bottom; y++) {
                    if (y < node.baseAreaSection.y || y >= node.baseAreaSection.y + node.baseAreaSection.h) {
                        continue;
                    }
                    const isYEdge = y === top || y === bottom;
                    for (let x = left; x <= right; x++) {
                        if (x < node.baseAreaSection.x || x >= node.baseAreaSection.x + node.baseAreaSection.w) {
                            continue;
                        }
                        const isXEdge = x === left || x === right;
                        if (!isXEdge && !isYEdge) {
                            continue;
                        }
                        // Any tiles that are not empty are probably already blocked, so do not replace them.
                        // In particular, we don't want to erase the southern facing walls on the north side of the room.
                        if (fieldLayer.grid.tiles[y][x] !== 0 && fieldLayer.grid.tiles[y][x] !== 1) {
                            continue;
                        }
                        random.generateAndMutate();
                        fieldLayer.grid.tiles[y][x] = random.element(tiles);
                    }
                }
            }
            addDoorAndClearForegroundTiles(baseDoorData.definition, node.baseArea, node.childArea);
            addDoorAndClearForegroundTiles(childDoorData.definition, child.baseArea, child.childArea);
            node.allEntranceDefinitions.push(baseDoorData.definition);
            child.allEntranceDefinitions.push(childDoorData.definition);

            child.entranceDefinition = childDoorData.definition;
        }
        if (node.type === 'treasure') {
            node.lootType = 'money'
            const roll = random.generateAndMutate();
            if (roll < 0.1) {
                node.lootAmount = 100;
            } else if (roll < 0.5) {
                node.lootAmount = 50;
            } else {
                node.lootAmount = 20;
            }
        }
        if (node.populateRoom) {
            node.populateRoom({zoneId, random}, node);
            continue;
        }
        // Determine the minimum number of slots required before generating the room skeleton.
        node.minimumSlotCount = node.minimumSlotCount || 0;
        // Must have a slot for the loot check.
        if (node.lootType) {
            node.minimumSlotCount++;
        }
        const enemyRequired = (enemyDoors.length || node.type === 'trap')
            // 50% chance a chest will require defeating enemies to spawn it.
            || (node.lootType && random.mutate().random() < 0.5);
        // Must have a slot for at least one enemy.
        if (enemyRequired) {
            node.minimumSlotCount++;
        }

        if (!node.skeleton && random.mutate().random() < 0.3) {
            node.skeleton = generateVerticalPath(random, node);
        }
        if (!node.skeleton && random.mutate().random() < 0.2) {
            node.skeleton = generatePitMaze(random, node);
        }
        if (!node.skeleton) {
            node.skeleton = generateEmptyRoom(random, node);
        }
        const roomDifficulty = node.depth || random.mutate().range(3, 5);
        let enemyDifficulty = 0;
        if (node.skeleton) {
            const {slots, paths} = node.skeleton;
            for (let i = 0; i < slots.length; i++) {
                const slot = slots[i];
                if (node.lootType) {
                    const w = Math.min(slot.w, 4);
                    const h = Math.min(slot.h, 4);
                    const x = Math.floor(slot.x + slot.w / 2 - w / 2);
                    const y = Math.floor(slot.y + slot.h / 2 - h / 2);
                    // TODO: if this gets complex, moves this to its own function for populating checks in slots.
                    //   Call this function first with all slots in case it wants to add puzzle elements for the check.
                    //   Indicate the number of free slots that can be used for the check, or just pass in a subset that is this long.
                    createSpecialStoneFloor(random, node.baseArea, {x, y, w, h}, node.childArea);
                    const definition: LootObjectDefinition = {
                        type: 'chest',
                        id: `${node.id}-smallKey`,
                        status: (node.type !== 'bigChest' && enemyRequired) ? 'hiddenEnemy' : 'normal',
                        x: (x + w / 2) * 16,
                        y: (y + h / 2) * 16,
                        lootType: node.lootType,
                        lootLevel: node.lootLevel,
                        lootAmount: node.lootAmount,
                    }
                    if (node.type === 'bigChest') {
                        definition.type = 'bigChest';
                        definition.x -= 16;
                        definition.y -= 16;
                    } else {
                        definition.x -= 8;
                        definition.y -= 8;
                    }
                    node.baseArea.objects.push(definition);
                    delete node.lootType;
                    continue;
                }
                const mustAddEnemy = enemyRequired && !enemyDifficulty;
                if (mustAddEnemy || (enemyDifficulty < roomDifficulty && random.mutate().random() < 0.8)) {
                    // TODO: Use enemies code to add an enemy that matches contextual requirements and difficulty.
                    random.generateAndMutate();
                    node.baseArea.objects.push({
                        type: 'enemy',
                        enemyType: node.baseArea.isSpiritWorld
                            ? random.element(['plantFlame','plantFrost','plantStorm'])
                            : random.element(['beetleHorned', 'snake', 'plant', 'beetleWinged']) ,
                        id: `${node.id}-enemy`,
                        d: 'down',
                        status: 'normal',
                        x: (slot.x + slot.w / 2) * 16 - 16,
                        y: (slot.y + slot.h / 2) * 16 - 8,
                    });
                    enemyDifficulty++;
                    continue;
                }
                const outerTile = random.mutate().element([0, 0, 2,2, 4, 5]);
                const innerTile = random.mutate().element([0, 2,4,5]);
                const r = random.mutate().range(1, 2);
                const fieldLayer = getOrAddLayer('field', node.baseArea, node.childArea);
                const rect = pad(slot, -1);
                for (let y = rect.y; y < rect.y + rect.h; y++) {
                    for (let x = rect.x; x < rect.x + rect.w; x++) {
                        if (fieldLayer.grid.tiles[y][x]) {
                            continue;
                        }
                        if (y < rect.y + r || y >= rect.y + rect.h - r || x < rect.x + r || x >= rect.x + rect.w - r) {
                            fieldLayer.grid.tiles[y][x] = outerTile;
                        } else {
                            fieldLayer.grid.tiles[y][x] = innerTile;
                        }
                    }
                }
            }
            for (let i = 0; i < paths.length; i++) {
                const path = paths[i];
                if (random.mutate().random() < 0.2) {
                    const fieldLayer = getOrAddLayer('field', node.baseArea, node.childArea);
                    const tile = random.mutate().element([2,5]);
                    for (let y = path.y; y < path.y + path.h; y++) {
                        for (let x = path.x; x < path.x + path.w; x++) {
                            fieldLayer.grid.tiles[y][x] = tile;
                        }
                    }
                }
            }
        } /*else {
            // This is the standard interior rect for rooms.
            let slot = {
                x: node.baseAreaSection.x + 2,
                w: node.baseAreaSection.w - 3,
                y: node.baseAreaSection.y + 3,
                h: node.baseAreaSection.h - 4,
            };
            if (node.lootType) {
                const definition: LootObjectDefinition = {
                    type: 'chest',
                    id: `${node.id}-smallKey`,
                    status: 'normal',
                    x: (node.baseAreaSection.x + node.baseAreaSection.w / 2) * 16,
                    y: (node.baseAreaSection.y + node.baseAreaSection.h / 2) * 16,
                    lootType: node.lootType,
                    lootLevel: node.lootLevel,
                    lootAmount: node.lootAmount,
                }
                if (node.type === 'bigChest') {
                    definition.type = 'bigChest';
                    definition.x -= 16;
                    definition.y -= 16;
                } else {
                    definition.x -= 8;
                    definition.y -= 8;
                }
                node.baseArea.objects.push(definition);
            }
            //console.log(random.nextSeed().random());
            if (random.mutate().random() < 0.3) {
                slot = pad(slot, -2);
                const fieldLayer = getOrAddLayer('field', node.baseArea, node.childArea);
                for (let y = slot.y; y < slot.y + slot.h; y++) {
                    for (let x = slot.x; x < slot.x + slot.w; x++) {
                        if (y === slot.y || y === slot.y + slot.h - 1 || x === slot.x || x === slot.x + slot.w - 1) {
                            fieldLayer.grid.tiles[y][x] = fieldLayer.grid.tiles[y][x] || 2;
                        }
                    }
                }
            } else if (random.mutate().random() < 0.2) {
                const fieldLayer = getOrAddLayer('field', node.baseArea, node.childArea);
                for (let y = slot.y; y < slot.y + slot.h; y++) {
                    fieldLayer.grid.tiles[y][slot.x + 4] = fieldLayer.grid.tiles[y][slot.x + 2] || 2;
                    fieldLayer.grid.tiles[y][slot.x + slot.w - 4 - 1] = fieldLayer.grid.tiles[y][slot.x + slot.w - 2 - 1] || 2;
                }
            } else if (random.mutate().random() < 0.2) {
                const fieldLayer = getOrAddLayer('field', node.baseArea, node.childArea);
                for (let x = slot.x; x < slot.x + slot.w; x++) {
                    fieldLayer.grid.tiles[slot.y + 2][x] = fieldLayer.grid.tiles[slot.y + 2][x] || 2;
                    fieldLayer.grid.tiles[slot.y + slot.h - 2 - 1][x] = fieldLayer.grid.tiles[slot.y + slot.h - 2 - 1][x] || 2;
                }
            }
        }*/
    }


    zones[zoneId] = zone;
}

function tryPlacingNode(nodeMap, node: TreeNode, coords: Point): boolean {
    const {w, h} = node.dimensions;
    // We can place this node here as long as any of the covered spots are either
    // open, or already occupied by this node (in the case of trying to expand the node).
    for (let dy = 0; dy < h; dy++) {
        for (let dx = 0; dx < w; dx++) {
            const key = `${coords.z}:${coords.x + dx}x${coords.y + dy}`;
            if (nodeMap[key] && nodeMap[key] !== node) {
                //console.log(`${node.id} is blocked: ${key} is already assigned to ${nodeMap[key].id}`);
                return false;
            }
        }
    }
    node.coords = coords;
    for (let dy = 0; dy < h; dy++) {
        for (let dx = 0; dx < w; dx++) {
            const key = `${coords.z}:${coords.x + dx}x${coords.y + dy}`;
            //console.log(`Assigning ${key} to ${node.id}`);
            nodeMap[key] = node;
        }
    }
    return true;
}

function normalizeTree(random: SRandom, tree: TreeNode) {
    if (tree.requirements?.[0].length > 1) {
        random.generateAndMutate();
        const firstRequirement = random.removeElement(tree.requirements[0]);
        // The new node will have all the properties of the current node except for the one removed requirement.
        const newNode: TreeNode = {
            ...tree,
        };
        // The existing node will be left with a single requirement and a link to the new node that now has its remaining properties.
        tree.requirements = [[firstRequirement]];
        tree.nodes = [newNode];
    }
    // Normalized tree has at most 4 edges per node: one entrance + three exits.
    const childCount = (tree.nodes?.length || 0);
    if (childCount > 3) {
        random.generateAndMutate();
        const allNodes = random.shuffle(tree.nodes);
        const cutoff = Math.min(2, (tree.nodes.length / 2) | 0);
        tree.nodes = allNodes.slice(0, cutoff);
        // This new node will get recursively normalized if it still has too many edges.
        tree.nodes.push({nodes: allNodes.slice(cutoff)});
    }
    for (const node of (tree.nodes || [])) {
        normalizeTree(random, node);
    }
}


function mutateTree(random: SRandom, tree: TreeNode) {
    random.generateAndMutate();
    const childCount = (tree.nodes?.length || 0);
    // non-leaf nodes that are not full have a chance of adding an extra leaf to them
    // which might be a bonus treasure or a trap room
    if (childCount === 1 || childCount === 2) {
        const roll = random.generateAndMutate();
        if (roll < 0.1) {
            tree.nodes.push({
                lootType: 'smallKey',
            });
            const i = random.range(0, 1);
            random.generateAndMutate();
            if (random.generateAndMutate() > 0.3) {
                // Most of the time add the locked door immediately to this node.
                tree.nodes.splice(i, 1, {
                    nodes: [tree.nodes[i]],
                    requirements: [[hasSmallKey]],
                });
            } else {
                // Sometimes add an extra node before the locked door.
                tree.nodes.splice(i, 1, {
                    nodes: [{
                        nodes: [tree.nodes[i]],
                        requirements: [[hasSmallKey]],
                    }],
                });
            }
        } else if (roll < 0.2) {
            tree.nodes.push({
                type: (random.generateAndMutate()) < 0.25 ? 'trap' : 'treasure'
            });
        }
    }
    if (childCount > 1) {
        // For any leaf directly off of a branch, there is a % chance that an extra
        // node will be inserted before the leaf.
        for (let i = 0; i < tree.nodes.length; i++) {
            const child = tree.nodes[i];
            if (!child.nodes?.length && random.generateAndMutate() <= 0.5) {
                tree.nodes.splice(i, 1, {
                    nodes: [child]
                });
            }
        }
    }
    for (const node of (tree.nodes || [])) {
        mutateTree(random, node);
    }
}

function finalizeTree(tree: TreeNode) {
    tree.depth = tree.depth || 0;
    for (const child of (tree.nodes || [])) {
        child.style = child.style || tree.style;
        child.depth = tree.depth + 1;
        finalizeTree(child);
    }
}

/*
const tombTree: TreeNode = {
    entrance: {
        d: 'down',
        type: 'door',
        id: 'tombEntrance',
        targetZone: 'overworld',
        targetObjectId: 'tombEntrance',
    },
    nodes: [
        { lootType: 'smallKey'},
        { lootType: 'map' },
        {
            requirements: [[hasSmallKey, hasWeapon]],
            nodes: [
                { lootType: 'silverOre', requirements: [[canCross2Gaps], [canRemoveLightStones]]},
                {
                    type: 'bigChest',
                    lootType: 'roll',
                    lootLevel: 1,
                    nodes: [
                        { lootType: 'smallKey'},
                        { lootType: 'bigKey', requirements: [[hasSmallKey]]},
                        {
                            requirements: [[canCross2Gaps], [canRemoveLightStones]],
                            nodes: [
                                {
                                    type: 'boss',
                                    wide: false,
                                    tall: false,
                                    requirements: [[hasBigKey]],
                                    populateRoom: populateTombBoss,
                                    entranceDirections: ['down'],
                                    doorP: 0.5,
                                    nodes: [
                                        {
                                            populateRoom: populateTombGuardianRoom,
                                            // This room is designed to be narrow.
                                            wide: false,
                                            entranceDirections: ['down']
                                        }
                                    ],
                                }
                            ],
                        },
                    ],
                }
            ],
        }
    ],
};*/

const tombTreeNoLocks: TreeNode = {
    entrance: {
        d: 'down',
        type: 'door',
        id: 'tombEntrance',
        targetZone: 'overworld',
        targetObjectId: 'tombEntrance',
    },
    nodes: [
        { lootType: 'map', style: 'stone' },
        {
            requirements: [[hasWeapon]],
            nodes: [
                { lootType: 'silverOre', requirements: [[canCross2Gaps], [canRemoveLightStones]]},
                {
                    type: 'bigChest',
                    lootType: 'roll',
                    lootLevel: 1,
                    nodes: [
                        {
                            nodes: [
                                {lootType: 'bigKey'},
                            ],
                        },
                        {
                            requirements: [[canCross2Gaps], [canRemoveLightStones]],
                            nodes: [
                                {
                                    type: 'boss',
                                    wide: false,
                                    tall: false,
                                    requirements: [[hasBigKey]],
                                    populateRoom: populateTombBoss,
                                    entranceDirections: ['down'],
                                    doorP: 0.5,
                                    nodes: [
                                        {
                                            populateRoom: populateTombGuardianRoom,
                                            // This room is designed to be narrow.
                                            wide: false,
                                            entranceDirections: ['down']
                                        }
                                    ],
                                }
                            ],
                        },
                    ],
                }
            ],
        }
    ],
};

createZoneFromTree({
    random: baseVariantRandom,
    zoneId: 'hiddenTomb',
    tree: tombTreeNoLocks,
    constraints: {
        // The dungeon cannot extend south past the entrance.
        maxY: 1,
        // The dungeon is at most 3x3 super tiles
        maxW: 6,
        maxH: 6,
        // The dungeon has no upper floors.
        maxZ: 0,
    },
    // Make the entrance on the south side of the top floor of the dungeon near the center.
    entrance: {x: [2, 3], y: [1,1], z: [0, 0]},
});

