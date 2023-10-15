import { canCross2Gaps, canRemoveLightStones, hasBigKey, hasSmallKey, hasWeapon } from 'app/content/logic';
import { zones } from 'app/content/zones/zoneHash';
import { variantSeed } from 'app/gameConstants';
import { getOrAddLayer, inheritAllLayerTilesFromParent } from 'app/utils/layers';
import srandom from 'app/utils/SRandom';
import { addDoorAndClearForegroundTiles, chunkGenerators, getEntranceDefintion } from 'app/generator/tileChunkGenerators';

const baseVariantRandom = srandom.seed(variantSeed);

/* 
TODO: Add location cues to stairs/entrances/teleporters
TODO:
1. Add graph transformations before spatial assignment to give more varied results
    A. (Assuming a defined main entrance) Add a locked door to an edge and a new edge to a node with a key in it.
    B. Insert a node with a passable obstacle in between a leaf and a branch.
    C. Add an edge to a node with 2 or 3 edges that connects to a new node with a random check(75%) or trap(25%).
    D. Add width/height constraints to force dungeons to grow taller for towers.
2. Add shortcut cycles from leaf nodes after spatial assignment.
    A. Starting with the deepest leaf, do a BFS of the grid up to depth 3 and stop on encountering a populated node.
    B. For each populated node, record the node, path and the difference in node depth
*/


interface TreeNode {
    type?: 'boss'|'bigChest'|'goal'
    lootType?: LootType
    lootLevel?: number
    lootAmount?: number
    nodes?: TreeNode[]
    requirements?: LogicCheck[][]
    // If set, the room will generate with entrances in this direction.
    // For example if this is ['down'], then the entrance must be on the south side of the room.
    entranceDirections?: Direction[]
    entrance?: {
        d: Direction
        type: 'door'
        id: string
        targetZone: string
        targetObjectId: string
    }
    populateRoom?: (context: {zoneId: string, random: SRandom}, node: TreeNode) => void
    // If this is set, the door leading to this room will be centered p% of the way across the available space.
    doorP?: number
    upDoorSlots?: number[]
    coords?: Point
    baseArea?: AreaDefinition
    baseAreaSection?: AreaSection
    childArea?: AreaDefinition
    childAreaSection?: AreaSection
    // Unique node id
    id?: string
}

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
                                    requirements: [[hasBigKey]],
                                    populateRoom: populateTombBoss,
                                    entranceDirections: ['down'],
                                    doorP: 0.5,
                                    nodes: [
                                        {
                                            populateRoom: populateTombGuardianRoom,
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

function populateTombBoss({zoneId, random}, node: TreeNode) {

}

function populateTombGuardianRoom({zoneId, random}, node: TreeNode) {
    // TODO: Add eye decorations in front of exit door
    // TODO: Add decorations around portal
    // TODO: Add decorations around pots+portal switch
    let x = (node.baseAreaSection.x + node.baseAreaSection.w / 2) * 16;
    let y = (node.baseAreaSection.y + 1 ) * 16;
    node.baseArea.objects.push({
        type: 'door',
        id: 'tombExit',
        style: 'stone',
        status: 'closedSwitch',
        d: 'up',
        targetZone: 'cocoon',
        targetObjectId: 'cocoonEntrance',
        linked: true,
        saveStatus: 'forever',
        x: x - 16, y,
    });
    node.childArea.objects.push({
        type: 'door',
        id: 'tombSpiritExit',
        style: 'stone',
        spirit: true,
        status: 'closedSwitch',
        d: 'up',
        targetZone: zoneId,
        targetObjectId: 'tombSpiritExit',
        linked: true,
        saveStatus: 'forever',
        x: x - 16, y
    });
    y += 48;
    for (let dx = -1; dx < 2; dx += 2) {
        node.childArea.objects.push({type: 'pushPull', x: x + dx * 3 * 16 - 8, y, spirit: true});
        node.childArea.objects.push({type: 'floorSwitch', targetObjectId: 'tombSpiritExit', toggleOnRelease: true, spirit: true, x: x + dx * 4 * 16 - 8, y});
    }

    const fieldLayer = getOrAddLayer('field', node.baseArea, node.childArea);
    const stoneTiles = [6, 6, 7];
    for (y = node.baseAreaSection.y + 6; y <= node.baseAreaSection.y + 7; y++) {
        for (x = node.baseAreaSection.x + 2; x < node.baseAreaSection.x + node.baseAreaSection.w - 1; x++) {
            if (x < node.baseAreaSection.x + 6 || x > node.baseAreaSection.x + 9) {
                fieldLayer.grid.tiles[y][x] = 10;
            } else {
                fieldLayer.grid.tiles[y][x] = random.element(stoneTiles);
            }

        }
    }

    y = (node.baseAreaSection.y + 9) * 16;
    node.baseArea.objects.push({
        type: 'npc',
        style: 'vanaraBlue',
        dialogueKey: 'tombGuardian',
        behavior: 'none',
        x: (node.baseAreaSection.x + 5) * 16,
        y, d: 'down',
    });

    node.baseArea.objects.push({
        type: 'teleporter', status: 'hidden', id: 'tombTeleporter',
        targetZone: 'overworld', targetObjectId: 'tombTeleporter',
        x: (node.baseAreaSection.x + node.baseAreaSection.w - 5) * 16, y,
    });

    const specialPot = random.range(0, 2);
    y = (node.baseAreaSection.y + 12) * 16;
    for (let i = 0; i < 3; i++) {
        const x = (node.baseAreaSection.x + 4 + i) * 16;
        node.baseArea.objects.push({type: 'pushPull',  linked: i === specialPot, x, y});
        if (i === specialPot) {
            node.childArea.objects.push({type: 'pushPull', spirit: true, linked: true, x, y});
        }
    }
    x = (node.baseAreaSection.x + node.baseAreaSection.w - 5) * 16
    node.childArea.objects.push({ id: 'tombTeleporter', x, y, type: 'floorSwitch', saveStatus: 'forever'});
}

function valueMatchesConstraints(newValue: number, currentMin: number, currentMax: number, minValue: number, maxValue: number, maxSpread: number): boolean{
    if (typeof minValue === 'number' && newValue < minValue) {
        return false;
    }
    if (typeof maxValue === 'number' && newValue > maxValue) {
        return false;
    }
    if (typeof maxSpread === 'number' && ((currentMax - newValue + 1) > maxSpread || (newValue - currentMin + 1) > maxSpread)) {
        return false;
    }
    return true;
}

type DoorData = {
    definition: EntranceDefinition
    w: number
    h: number
}

function chooseUpDoorSlot(random: SRandom, node: TreeNode): number {
    if (!node.upDoorSlots) {
        node.upDoorSlots = [0.25, 0.5, 0.75];
    }
    if (!node.upDoorSlots.length) {
        console.error('Ran out of slots for northern doors');
        debugger;
        return 0.375;
    }
    random.generateAndMutate();
    return random.removeElement(node.upDoorSlots);
}

function positionDoors(random: SRandom, baseDoorData: DoorData, baseNode: TreeNode, childDoorData?: DoorData, childNode?: TreeNode) {
    const baseAreaSection = baseNode.baseAreaSection;
    const childAreaSection = childNode?.baseAreaSection;
    // Choose x position for up/down doors
    if (baseDoorData.definition.d === 'up' || baseDoorData.definition.d === 'down') {
        // TODO: Handle ladders here
        let left = (baseAreaSection.x + 1) * 16;
        if (childAreaSection) {
            left = Math.max(left, (childAreaSection.x + 1) * 16);
        }
        let right = (baseAreaSection.x + baseAreaSection.w) * 16;
        if (childAreaSection) {
            right = Math.min(right, (childAreaSection.x + childAreaSection.w) * 16);
        }
        random.generateAndMutate();
        let p = childNode?.doorP || (!childNode
            ? 0.5
            : baseDoorData.definition.d === 'up'
                ? chooseUpDoorSlot(random, baseNode)
                : chooseUpDoorSlot(random, childNode));
        const cx = left + p *(right - left);
        baseDoorData.definition.x = cx - baseDoorData.w / 2;
        if (childDoorData) {
            childDoorData.definition.x = cx - childDoorData.w / 2;
        }
    } else if (baseDoorData.definition.d === 'left' || baseDoorData.definition.d === 'right') {
        // These don't have to be the actual top/bottom as long as they are the same distance from the center.
        let top = (baseAreaSection.y + 2) * 16;
        if (childAreaSection) {
            top = Math.max(top, (childAreaSection.y + 2) * 16);
        }
        let bottom = (baseAreaSection.y + baseAreaSection.h) * 16;
        if (childAreaSection) {
            bottom = Math.min(bottom, (childAreaSection.y + childAreaSection.h) * 16);
        }
        random.generateAndMutate();
        // Keep left/right doors towards the center so that obstacles around doors do not
        // collide with eachother.
        const p = childNode?.doorP || random.element([0.5, 0.4, 0.6]);
        const cy = top + p * (bottom - top);
        baseDoorData.definition.y = cy - baseDoorData.h / 2;
        if (childDoorData) {
            childDoorData.definition.y = cy - childDoorData.h / 2;
        }
    }
    if (baseDoorData.definition.d === 'up') {
        baseDoorData.definition.y = baseAreaSection.y * 16 + 16;
        if (childDoorData) {
            if (childDoorData.definition.d === 'down') {
                childDoorData.definition.y = (childAreaSection.y + childAreaSection.h - 1) * 16;
            } else {
                childDoorData.definition.y = childAreaSection.y * 16 + 16;
            }
        }
    } else  if (baseDoorData.definition.d === 'down') {
        baseDoorData.definition.y = (baseAreaSection.y + baseAreaSection.h - 1) * 16;
        if (childDoorData) {
            childDoorData.definition.y = childAreaSection.y * 16 + 16;
        }
    } else  if (baseDoorData.definition.d === 'left') {
        baseDoorData.definition.x = baseAreaSection.x * 16 + 16;
        if (childDoorData) {
            childDoorData.definition.x = (childAreaSection.x + childAreaSection.w - 1) * 16;
        }
    } else  if (baseDoorData.definition.d === 'right') {
        baseDoorData.definition.x = (baseAreaSection.x + baseAreaSection.w - 1) * 16;
        if (childDoorData) {
            childDoorData.definition.x = childAreaSection.x * 16 + 16;
        }
    }
}

function attemptToPlaceChild(
    random: SRandom,
    nodeMap: {[key in string]: TreeNode},
    {xMin, xMax, yMin, yMax, zMin, zMax}: Bounds,
    constraints: ZoneConstraints,
    parent: TreeNode,
    child: TreeNode
): TreeNode|false {
    const {x, y, z} = parent.coords;
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
    if (supportedDirections.right) {
        if (!isKeyBlocked && valueMatchesConstraints(x - 1, xMin, xMax, constraints.minX, constraints.maxX, constraints.maxW)) {
            if (x - 1 >= xMin || (1 + xMax - xMin) % 2 === 1) {
                goodCoords.push({x: x - 1, y, z});
            } else {
                normalCoords.push({x: x - 1, y, z});
            }
        }
    }
    if (supportedDirections.left) {
        if (!isKeyBlocked && valueMatchesConstraints(x + 1, xMin, xMax, constraints.minX, constraints.maxX, constraints.maxW)) {
            if (x + 1 <= xMax || (1 + xMax - xMin) % 2 === 1) {
                goodCoords.push({x: x + 1, y, z});
            } else {
                normalCoords.push({x: x + 1, y, z});
            }
        }
    }
    if (supportedDirections.down) {
        if (valueMatchesConstraints(y - 1, yMin, yMax, constraints.minY, constraints.maxY, constraints.maxH)) {
            if (y - 1 >= yMin || (1 + yMax - yMin) % 2 === 1) {
                goodCoords.push({x, y: y - 1, z});
            } else {
                normalCoords.push({x, y: y - 1, z});
            }
        }
    }
    if (supportedDirections.up) {
        if (!isKeyBlocked && valueMatchesConstraints(y + 1, yMin, yMax, constraints.minY, constraints.maxY, constraints.maxH)) {
            if (y + 1 <= yMax || (1 + yMax - yMin) % 2 === 1) {
                goodCoords.push({x, y: y + 1, z});
            } else {
                normalCoords.push({x, y: y + 1, z});
            }
        }
        if (valueMatchesConstraints(z - 1, zMin, zMax, constraints.minZ, constraints.maxZ, constraints.maxD)) {
            if (z - 1 >= zMin) {
                goodCoords.push({x, y, z: z - 1});
            } else {
                badCoords.push({x, y, z: z - 1});
            }
        }
        if (valueMatchesConstraints(z + 1, zMin, zMax, constraints.minZ, constraints.maxZ, constraints.maxD)) {
            if (z + 1 <= zMax) {
                goodCoords.push({x, y, z: z + 1});
            } else {
                badCoords.push({x, y, z: z + 1});
            }
        }
    }
    for (const coordsList of [goodCoords, normalCoords, badCoords]) {
        random.generateAndMutate();
        for (const coords of random.shuffle(coordsList)) {
            if (tryPlacingNode(nodeMap, child, coords)) {
                return child;
            }
        }
    }
    if (supportedDirections.up) {
        for (let i = 2; i < 10; i++) {
            if ((valueMatchesConstraints(z + i, zMin, zMax, constraints.minZ, constraints.maxZ, constraints.maxD) &&
                tryPlacingNode(nodeMap, child, {x, y, z: z + i}))
                ||
                (valueMatchesConstraints(z - i, zMin, zMax, constraints.minZ, constraints.maxZ, constraints.maxD) &&
                tryPlacingNode(nodeMap, child, {x, y, z: z + i}))
            ) {
                return child;
            }
        }
    }
    // If this node was key blocked, create another intermediate node that is not key blocked and see if that can be placed.
    if (isKeyBlocked) {
        const newNode: TreeNode = {
            nodes: [child]
        };
        const childIndex = parent.nodes.indexOf(child);
        parent.nodes.splice(childIndex, 1, newNode);
        return attemptToPlaceChild(random, nodeMap, {xMin, xMax, yMin, yMax, zMin, zMax}, constraints, parent, newNode);
    }
    // If we failed to place the child and it has defined entrance directions, we need to add an intermediate node without
    // the entrance direction restriction. To make sure this resolves as quickly as possible, we
    if (child.entranceDirections) {
        function areCoordsOpen(x: number, y: number, z: number) {
            return !nodeMap[`${z}:${x}x${y}`];
        }
        const pathMap: {[key in Direction]?: number[][][]} = {
            down: [
                [[x - 1, y, z], [x - 1, y - 1, z]],
                [[x + 1, y, z], [x + 1, y - 1, z]],
                [[x, y, z - 1], [x, y - 1, z - 1]],
                [[x, y, z + 1], [x, y - 1, z + 1]],
            ],
            up: [
                [[x - 1, y, z], [x - 1, y + 1, z]],
                [[x + 1, y, z], [x + 1, y + 1, z]],
                [[x, y, z - 1], [x, y + 1, z - 1]],
                [[x, y, z + 1], [x, y + 1, z + 1]],
            ],
            right: [
                [[x, y - 1, z], [x - 1, y - 1, z]],
                [[x, y + 1, z], [x - 1, y + 1, z]],
                [[x, y, z - 1], [x - 1, y, z - 1]],
                [[x, y, z + 1], [x - 1, y, z + 1]],
            ],
            left: [
                [[x, y - 1, z], [x + 1, y - 1, z]],
                [[x, y + 1, z], [x + 1, y + 1, z]],
                [[x, y, z - 1], [x + 1, y, z - 1]],
                [[x, y, z + 1], [x + 1, y, z + 1]],
            ],
        }
        random.generateAndMutate();
        for (const direction of random.shuffle(Object.keys(pathMap))) {
            if (child.entranceDirections.includes(direction as Direction)) {
                random.generateAndMutate();
                for (const path of random.shuffle(pathMap[direction as Direction])) {
                    const [x1, y1, z1] = path[0];
                    const [x2, y2, z2] = path[1];
                    // Validate all the coordinates respect the constraints
                    if (!valueMatchesConstraints(x1, xMin, xMax, constraints.minX, constraints.maxX, constraints.maxW)
                        || !valueMatchesConstraints(x2, xMin, xMax, constraints.minX, constraints.maxX, constraints.maxW)
                        || !valueMatchesConstraints(y1, yMin, yMax, constraints.minY, constraints.maxY, constraints.maxH)
                        || !valueMatchesConstraints(y2, yMin, yMax, constraints.minY, constraints.maxY, constraints.maxH)
                        || !valueMatchesConstraints(z1, zMin, zMax, constraints.minZ, constraints.maxZ, constraints.maxD)
                        || !valueMatchesConstraints(z2, zMin, zMax, constraints.minZ, constraints.maxZ, constraints.maxD)
                    ) {
                        continue;
                    }
                    if (areCoordsOpen(x1, y1, z1) && areCoordsOpen(x2, y2, z2)) {
                        const newNode: TreeNode = {
                            nodes: [child]
                        };
                        const childIndex = parent.nodes.indexOf(child);
                        parent.nodes.splice(childIndex, 1, newNode);
                        tryPlacingNode(nodeMap, newNode, {x: x1, y: y1, z: z1});
                        return newNode;
                    }
                }
            }
        }
        // If we still haven't placed the node then just add a new node using the standard rules.
        // Eventually it will path to somewhere that the requirements are met:
        const newNode: TreeNode = {
            nodes: [child]
        };
        const childIndex = parent.nodes.indexOf(child);
        parent.nodes.splice(childIndex, 1, newNode);
        return attemptToPlaceChild(random, nodeMap, {xMin, xMax, yMin, yMax, zMin, zMax}, constraints, parent, newNode);
    }
    return false;
}

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

function sortNodesWithEntranceDirectionsFirst(a: TreeNode, b: TreeNode): number {
    if (a.entranceDirections && !b.entranceDirections) {
        return -1;
    }
    if (b.entranceDirections && !a.entranceDirections) {
        return 1;
    }
    return 0;
}

function createZoneFromTree(props: {
    random: SRandom
    zoneId: string
    tree: TreeNode
    constraints: ZoneConstraints
}) {
    const {random, zoneId, tree, constraints} = props;
    const zone: Zone = {
        key: zoneId,
        floors: [],
    };
    normalizeTree(random, tree);

    const nodeMap: {[key: string]: TreeNode} = {};
    let xMin = 0, xMax = 0, yMin = 0, yMax = 0, zMin = 0, zMax = 0;
    tree.coords = {x:0, y: 0, z: 0};
    nodeMap['0:0x0'] = tree;
    tree.id = `${zoneId}-node0`;
    const placedNodes: TreeNode[] = [tree];
    // This queue will contain parent nodes to have their children processed for BFS processing.
    let queue = [tree], safety = 0;
    while (queue.length && safety++ < 1000) {
        let parent = queue.shift();
        const sortedChildren = (parent.nodes || []).sort(sortNodesWithEntranceDirectionsFirst);
        for (const child of sortedChildren) {
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
                queue.push(placedNode);
                placedNode.id = `${zoneId}-node${placedNodes.length}`;
                placedNodes.push(placedNode);
                xMin = Math.min(xMin, placedNode.coords.x);
                xMax = Math.max(xMax, placedNode.coords.x);
                yMin = Math.min(yMin, placedNode.coords.y);
                yMax = Math.max(yMax, placedNode.coords.y);
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
    // Make the grid even to make sure area sections are populated even for empty areas on the edges.
    if ((1 + yMax - yMin) % 2) {
        yMax++;
    }
    if ((1 + xMax - xMin) % 2) {
        xMax++;
    }
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
                grid[gY][gX].sections.push(baseSection);
                spiritGrid[gY][gX] = spiritGrid[gY][gX] || {
                    parentDefinition: grid[gY][gX],
                    isSpiritWorld: true,
                    layers: [],
                    objects: [],
                    sections: [],
                };
                spiritGrid[gY][gX].sections.push(childSection);
                if (!node) {
                    row += '.';
                    continue;
                }
                row += '+';
                node.baseArea = grid[gY][gX];
                node.childArea = spiritGrid[gY][gX];
                node.baseAreaSection = baseSection;
                node.childAreaSection = childSection;
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
    }

    const style = 'stone';
    // Populate contents of nodes, including door connections.
    for (const node of placedNodes) {
        /*
        TODO: Support multiple parallel requirements. Not sure how to do this yet: [[canCross2Gaps], [canRemoveLightStones]]},
        TODO: Support adding a boss chamber: Add a function for populating the room, which is given the annotated node and other context data.
                This will also require adding additional node constraints like entrance+exit directions for bespoke rooms.
        TODO: Create the 'goal' chamber using the same population as above
        */
        if (node.entrance) {
            const entranceDoorData = getEntranceDefintion({
                id: node.entrance.id,
                d: node.entrance.d,
                style,
                type: node.entrance.type,
            });
            positionDoors(random, entranceDoorData, node);
            addDoorAndClearForegroundTiles(entranceDoorData.definition, node.baseArea, node.childArea);
            entranceDoorData.definition.targetZone = node.entrance.targetZone;
            entranceDoorData.definition.targetObjectId = node.entrance.targetObjectId;
        }
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
                if (random.generateAndMutate() < 0.1) {
                    definition.type = 'loot';
                }
                definition.x -= 8;
                definition.y -= 8;
            }
            node.baseArea.objects.push(definition);
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
                    style,
                    type: node.coords.z < child.coords.z ? 'upstairs' : 'downstairs',
                });
                childDoorData = getEntranceDefintion({
                    id: childId,
                    d: 'up',
                    style,
                    type: node.coords.z < child.coords.z ? 'downstairs' : 'upstairs',
                });
                baseDoorData.definition.targetZone = zoneId;
                baseDoorData.definition.targetObjectId = childDoorData.definition.id;
                childDoorData.definition.targetZone = zoneId;
                childDoorData.definition.targetObjectId = baseDoorData.definition.id;
            } else if (node.coords.y !== child.coords.y) {
                baseDoorData = getEntranceDefintion({
                    id: parentId,
                    d: node.coords.y < child.coords.y ? 'down' : 'up',
                    style,
                    type: 'door',
                });
                childDoorData = getEntranceDefintion({
                    id: childId,
                    d: node.coords.y < child.coords.y ? 'up' : 'down',
                    style,
                    type: 'door',
                });
            } else {
                baseDoorData = getEntranceDefintion({
                    id: parentId,
                    d: node.coords.x < child.coords.x ? 'right' : 'left',
                    style,
                    type: 'door',
                });
                childDoorData = getEntranceDefintion({
                    id: childId,
                    d: node.coords.x < child.coords.x ? 'left' : 'right',
                    style,
                    type: 'door',
                });
            }
            if (child.requirements?.[0][0] === hasWeapon) {
                baseDoorData.definition.status = 'closedEnemy';
                enemyDoors.push(baseDoorData.definition.id);
            }
            if (child.requirements?.[0][0] === hasSmallKey) {
                if (baseDoorData.definition.d === 'up') {
                    baseDoorData.definition.status = 'locked';
                }
                if (childDoorData.definition.d === 'up') {
                    childDoorData.definition.status = 'locked';
                }
                // Locked door pairs must share an id so they are unlocked together.
                childDoorData.definition.id = baseDoorData.definition.id;
            }
            if (child.requirements?.[0][0] === hasBigKey) {
                if (baseDoorData.definition.d === 'up') {
                    baseDoorData.definition.status = 'bigKeyLocked';
                }
                if (childDoorData.definition.d === 'up') {
                    childDoorData.definition.status = 'bigKeyLocked';
                }
                // Locked door pairs must share an id so they are unlocked together.
                childDoorData.definition.id = baseDoorData.definition.id;
            }
            positionDoors(random, baseDoorData, node, childDoorData, child);
            if (child.requirements?.[0][0] === canRemoveLightStones || child.requirements?.[0][0] === canCross2Gaps) {
                const fieldLayer = getOrAddLayer('field', node.baseArea, node.childArea);
                const tiles = child.requirements?.[0][0] === canRemoveLightStones ? [6, 6, 7] : [4, 4, 4, 25];
                const definition = baseDoorData.definition;
                const isVertical = definition.d === 'up' || definition.d === 'down';
                const yR = isVertical ? 2 : 0;
                const xR = isVertical ? 1 : 3;
                const left = Math.floor(definition.x / 16) - xR, right = Math.floor((definition.x + baseDoorData.w) / 16) + xR;
                const top = Math.floor(definition.y / 16) - yR, bottom = Math.floor((definition.y + baseDoorData.h) / 16) + yR;
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
        }
        if (enemyDoors.length) {
            const left = (node.baseAreaSection.x + 1) * 16;
            const right = (node.baseAreaSection.x + node.baseAreaSection.w) * 16;
            const top = (node.baseAreaSection.y + 2) * 16;
            const bottom = (node.baseAreaSection.y + node.baseAreaSection.h) * 16;
            random.generateAndMutate();
            const [px, py] = random.element([[0.25, 0.25], [0.25, 0.75], [0.75, 0.25], [0.75, 0.75]]);
            node.baseArea.objects.push({
                type: 'enemy',
                enemyType: node.baseArea.isSpiritWorld
                    ? random.element(['plantFlame','plantFrost','plantStorm'])
                    : random.element(['beetleHorned', 'snake', 'plant', 'beetleWinged']) ,
                id: `${node.id}-enemy`,
                d: 'down',
                status: 'normal',
                x: left + px * (right - left) - 16,
                y: top + py * (bottom - top) - 8,
            });
        }
        if (node.populateRoom) {
            node.populateRoom({zoneId, random}, node);
        }
    }


    zones[zoneId] = zone;
}

function tryPlacingNode(nodeMap, node: TreeNode, coords: Point): boolean {
    const key = `${coords.z}:${coords.x}x${coords.y}`;
    if (nodeMap[key]) {
        return false;
    }
    nodeMap[key] = node;
    node.coords = coords;
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

createZoneFromTree({
    random: baseVariantRandom,
    zoneId: 'hiddenTomb',
    tree: tombTree,
    constraints: {
        // The dungeon cannot extend south past the entrance.
        maxY: 0,
        // The dungeon is at most 3x3 super tiles
        maxW: 6,
        maxH: 6,
        // The dungeon has no upper floors.
        maxZ: 0,
    }
});

/*

const area: AreaDefinition = {
    w: 32,
    h: 32,
    layers: [],
    objects: [],
    sections: [
        {x: 0, y: 0, w: 16, h: 32, mapId: 'overworld'},
        {x: 16, y: 0, w: 16, h: 32, mapId: 'overworld'},
    ],
};
const spiritArea: AreaDefinition = {
    parentDefinition: area,
    isSpiritWorld: true,
    layers: [],
    objects: [],
    sections: area.sections.map(s => ({...s})),
};
zones.warPalaceWestRoom = {
    key: 'warPalaceWestRoom',
    floors: [
        {
            grid: [[area]],
            spiritGrid: [[spiritArea]],
        },
    ],
};
*/
