import { canCross2Gaps, canRemoveLightStones, hasBigKey, hasSmallKey } from 'app/content/logic';
import { zones } from 'app/content/zones/zoneHash';
import { variantSeed } from 'app/gameConstants';
import { getOrAddLayer, inheritAllLayerTilesFromParent } from 'app/utils/layers';
import srandom from 'app/utils/SRandom';
import { addDoorAndClearForegroundTiles, chunkGenerators, getEntranceDefintion } from 'app/generator/tileChunkGenerators';

const baseVariantRandom = srandom.seed(variantSeed);

/* 
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
    nodes?: TreeNode[]
    requirements?: LogicCheck[][]
    entrance?: {
        d: Direction
        type: 'door'
        id: string
        targetZone: string
        targetObjectId: string
    }
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
            requirements: [[hasSmallKey]],
            nodes: [
                { lootType: 'silverOre', requirements: [[canCross2Gaps], [canRemoveLightStones]]},
                {
                    type: 'bigChest',
                    lootType: 'roll',
                    nodes: [
                        { lootType: 'smallKey'},
                        { lootType: 'bigKey', requirements: [[hasSmallKey]]},
                        {
                            requirements: [[canCross2Gaps], [canRemoveLightStones]],
                            nodes: [
                                { 
                                    requirements: [[hasBigKey]],
                                    type: 'boss', 
                                    nodes: [
                                        {type: 'goal'}
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
        let p = !childNode
            ? 0.5
            : baseDoorData.definition.d === 'up'
                ? chooseUpDoorSlot(random, baseNode)
                : chooseUpDoorSlot(random, childNode);
        const cx = left + p *(right - left);
        baseDoorData.definition.x = cx - baseDoorData.w / 2;
        if (childDoorData) {
            childDoorData.definition.x = cx - childDoorData.w / 2;
        }
        // TODO: support multiple possible slots and record which are used on the node to prevent overlaps.
        //for (const p of random.shuffle([0.5, 0.25, 0.75])) {

        //}
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
        const p = random.element([0.5, 0.25, 0.75]);
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

function createZoneFromTree(props: {
    random: SRandom
    zoneId: string
    tree: TreeNode
    constraints: {
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
        let {x, y, z} = parent.coords;
        for (const child of (parent.nodes || [])) {
            // These coordinates don't expand the dimensions of the dungeon at all.
            const goodCoords: Point[] = [];
            // These coords don't add new floors to the dungeon.
            const normalCoords: Point[] = [];
            // These coords require adding a new floor to the dungeon.
            const badCoords: Point[] = [];
            if (valueMatchesConstraints(x - 1, xMin, xMax, constraints.minX, constraints.maxX, constraints.maxW)) {
                if (x - 1 >= xMin || (1 + xMax - xMin) % 2 === 1) {
                    goodCoords.push({x: x - 1, y, z});
                } else {
                    normalCoords.push({x: x - 1, y, z});
                }
            }
            if (valueMatchesConstraints(x + 1, xMin, xMax, constraints.minX, constraints.maxX, constraints.maxW)) {
                if (x + 1 <= xMax || (1 + xMax - xMin) % 2 === 1) {
                    goodCoords.push({x: x + 1, y, z});
                } else {
                    normalCoords.push({x: x + 1, y, z});
                }
            }
            if (valueMatchesConstraints(y - 1, yMin, yMax, constraints.minY, constraints.maxY, constraints.maxH)) {
                if (y - 1 >= yMin || (1 + yMax - yMin) % 2 === 1) {
                    goodCoords.push({x, y: y - 1, z});
                } else {
                    normalCoords.push({x, y: y - 1, z});
                }
            }
            if (valueMatchesConstraints(y + 1, yMin, yMax, constraints.minY, constraints.maxY, constraints.maxH)) {
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
            let placed = false;
            for (const coordsList of [goodCoords, normalCoords, badCoords]) {
                random.generateAndMutate();
                for (const coords of random.shuffle(coordsList)) {
                    if (tryPlacingNode(nodeMap, child, coords)) {
                        placed = true;
                        break;
                    }
                }
                if (placed) {
                    break;
                }
            }
            if (!placed) {
                for (let i = 2; i < 10; i++) {
                    if ((valueMatchesConstraints(z + i, zMin, zMax, constraints.minZ, constraints.maxZ, constraints.maxD) &&
                        tryPlacingNode(nodeMap, child, {x, y, z: z + i}))
                        ||
                        (valueMatchesConstraints(z - i, zMin, zMax, constraints.minZ, constraints.maxZ, constraints.maxD) &&
                        tryPlacingNode(nodeMap, child, {x, y, z: z + i}))
                    ) {
                        placed = true;
                        break;
                    }
                }
            }
            if (!placed) {
                console.error('Failed to place child node', {parent, child});
                debugger;
            }
            queue.push(child);
            child.id = `${zoneId}-node${placedNodes.length}`;
            placedNodes.push(child);
            xMin = Math.min(xMin, child.coords.x);
            xMax = Math.max(xMax, child.coords.x);
            yMin = Math.min(yMin, child.coords.y);
            yMax = Math.max(yMax, child.coords.y);
            zMin = Math.min(zMin, child.coords.z);
            zMax = Math.max(zMax, child.coords.z);
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

        {
            nodes: [
                { requirements: [[canCross2Gaps], [canRemoveLightStones]]},
                {
                    type: 'bigChest',
                    lootType: 'roll',
                    nodes: [
                        { lootType: 'smallKey'},
                        { lootType: 'bigKey', requirements: [[hasSmallKey]]},
                        {
                            requirements: [[canCross2Gaps], [canRemoveLightStones]],
                            nodes: [
                                {
                                    type: 'boss',
                                    nodes: [
                                        {type: 'goal'}
    ],
        */
        if (node.entrance) {
            // TODO: Fix stairs styles aren't right and are not linked
            // Fix East/West/South doors from parent -> child should use key blocks instead of locked doors
            // Locked South doors from child -> parent should just be open.
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

        // Add doors between nodes.
        for (const child of (node.nodes || [])) {
            let baseDoorData: ReturnType<typeof getEntranceDefintion>, childDoorData: ReturnType<typeof getEntranceDefintion>
            if (node.coords.z !== child.coords.z) {
                baseDoorData = getEntranceDefintion({
                    id: `${node.id}-to-${child.id}`,
                    d: 'up',
                    style,
                    type: node.coords.z < child.coords.z ? 'upstairs' : 'downstairs',
                });
                childDoorData = getEntranceDefintion({
                    id: `${child.id}-to-${node.id}`,
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
                    id: `${node.id}-to-${child.id}`,
                    d: node.coords.y < child.coords.y ? 'down' : 'up',
                    style,
                    type: 'door',
                });
                childDoorData = getEntranceDefintion({
                    id: `${child.id}-to-${node.id}`,
                    d: node.coords.y < child.coords.y ? 'up' : 'down',
                    style,
                    type: 'door',
                });
            } else {
                baseDoorData = getEntranceDefintion({
                    id: `${node.id}-to-${child.id}`,
                    d: node.coords.x < child.coords.x ? 'right' : 'left',
                    style,
                    type: 'door',
                });
                childDoorData = getEntranceDefintion({
                    id: `${child.id}-to-${node.id}`,
                    d: node.coords.x < child.coords.x ? 'left' : 'right',
                    style,
                    type: 'door',
                });
            }
            if (child.requirements?.[0][0] === hasSmallKey) {
                baseDoorData.definition.status = 'locked';
                childDoorData.definition.status = 'locked';
                // Locked door pairs must share an id so they are unlocked together.
                childDoorData.definition.id = baseDoorData.definition.id;
            }
            if (child.requirements?.[0][0] === hasBigKey) {
                baseDoorData.definition.status = 'bigKeyLocked';
                childDoorData.definition.status = 'bigKeyLocked';
                // Locked door pairs must share an id so they are unlocked together.
                childDoorData.definition.id = baseDoorData.definition.id;
            }
            positionDoors(random, baseDoorData, node, childDoorData, child);

            // Choose x position for up/down doors
            /*if (baseDoorData.definition.d === 'up' || baseDoorData.definition.d === 'down') {
                // TODO: Handle ladders here
                const left = Math.max((node.baseAreaSection.x + 1) * 16, (child.baseAreaSection.x + 1) * 16);
                const right = Math.min((node.baseAreaSection.x + node.baseAreaSection.w) * 16, (child.baseAreaSection.x + child.baseAreaSection.w) * 16);
                random.generateAndMutate();
                const p = random.element([0.5, 0.25, 0.75]);
                const cx = left + p *(right - left);
                baseDoorData.definition.x = cx - baseDoorData.w / 2;
                childDoorData.definition.x = cx - childDoorData.w / 2;
                // TODO: support multiple possible slots and record which are used on the node to prevent overlaps.
                //for (const p of random.shuffle([0.5, 0.25, 0.75])) {

                //}
            } else if (baseDoorData.definition.d === 'left' || baseDoorData.definition.d === 'right') {
                // These don't have to be the actual top/bottom as long as they are the same distance from the center.
                const top = Math.max((node.baseAreaSection.y + 2) * 16, (child.baseAreaSection.y + 2) * 16);
                const bottom = Math.min((node.baseAreaSection.y + node.baseAreaSection.h) * 16, (child.baseAreaSection.y + child.baseAreaSection.h) * 16);
                random.generateAndMutate();
                const p = random.element([0.5, 0.25, 0.75]);
                const cy = top + p * (bottom - top);
                baseDoorData.definition.y = cy - baseDoorData.h / 2;
                childDoorData.definition.y = cy - childDoorData.h / 2;
            }
            if (baseDoorData.definition.d === 'up') {
                baseDoorData.definition.y = node.baseAreaSection.y * 16 + 16;
                childDoorData.definition.y = (child.baseAreaSection.y + child.baseAreaSection.h - 1) * 16;
            } else  if (baseDoorData.definition.d === 'down') {
                baseDoorData.definition.y = (node.baseAreaSection.y + node.baseAreaSection.h - 1) * 16;
                childDoorData.definition.y = child.baseAreaSection.y * 16 + 16;
            } else  if (baseDoorData.definition.d === 'left') {
                baseDoorData.definition.x = node.baseAreaSection.x * 16 + 16;
                childDoorData.definition.x = (child.baseAreaSection.x + child.baseAreaSection.w - 1) * 16;
            } else  if (baseDoorData.definition.d === 'right') {
                baseDoorData.definition.x = (node.baseAreaSection.x + node.baseAreaSection.w - 1) * 16;
                childDoorData.definition.x = child.baseAreaSection.x * 16 + 16;
            }*/

            addDoorAndClearForegroundTiles(baseDoorData.definition, node.baseArea, node.childArea);
            addDoorAndClearForegroundTiles(childDoorData.definition, child.baseArea, child.childArea);
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
