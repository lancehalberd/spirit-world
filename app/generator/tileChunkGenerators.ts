import { orLogic, hasTeleportation, hasSomersault } from 'app/content/logic';
import { zones } from 'app/content/zones/zoneHash';
import { variantSeed } from 'app/gameConstants';
import { applyNineSlice, slices } from 'app/generator/nineSlice';
import { getOrAddLayer, inheritAllLayerTilesFromParent } from 'app/utils/layers';
import { mapTileIndex } from 'app/utils/mapTile';
import random from 'app/utils/SRandom';

type ChunkGenerator = (random: SRandom, area: AreaDefinition, r: Rect, alternateArea?: AreaDefinition) => void

function combinedGenerator(generators: ChunkGenerator[]): ChunkGenerator {
    return function(random: SRandom, area: AreaDefinition, r: Rect, alternateArea?: AreaDefinition) {
        for (const generator of generators) {
            generator(random.addSeed(1), area, r, alternateArea);
        }
    }
}

export const chunkGenerators: {[key: string]: ChunkGenerator} = {
    clear(random: SRandom, area: AreaDefinition, r: Rect, alternateArea?: AreaDefinition) {
        for (const layer of area.layers) {
            for (let y = r.y; y < r.y + r.h; y++) {
                if (y >= layer.grid.h) {
                    break;
                }
                for (let x = r.x; x < r.x + r.w; x++) {
                    if (x >= layer.grid.w) {
                        break;
                    }
                    if (!layer.grid.tiles[y]) {
                        layer.grid.tiles[y] = [];
                    }
                    layer.grid.tiles[y][x] = 0;
                }
            }
        }
    }
};

for (const key of Object.keys(slices)) {
    chunkGenerators[`slices-${key}`] = (random: SRandom, area: AreaDefinition, r: Rect, alternateArea?: AreaDefinition) => {
        applyNineSlice(random, area,r, slices[key], alternateArea);
    };
}
chunkGenerators.stoneRoom = combinedGenerator([chunkGenerators[`slices-stoneWalls`], createStoneFloor]);


const singleStoneTiles = [1237, 1238];
const doubleStoneTiles = [1239, 1240];
const emptyStoneTile = 1217;
const fancyStoneTile = 1216;
const fancierStoneTile = 1215;
const fanciestStoneTile = 1214;


function createStoneFloor(random: SRandom, area: AreaDefinition, r: Rect, alternateArea?: AreaDefinition) {
    const floorLayer = getOrAddLayer('floor', area, alternateArea);
    const tiles = floorLayer.grid.tiles;
    for (let y = 0; y < r.h; y++) {
        const tY = r.y + y;
        if (tY >= floorLayer.grid.h) {
            break;
        }
        if (!tiles[tY]) {
            tiles[tY] = [];
        }
        for (let x = 0; x < r.w; x++) {
            const tX = r.x + x;
            if (tX >= floorLayer.grid.w) {
                break;
            }
            if (x < r.w - 1 && (x % 2 === y % 2) && random.generateAndMutate() < 0.2 * (y % 3 + 2)) {
                tiles[tY][tX]  = doubleStoneTiles[0];
                tiles[tY][tX + 1] = doubleStoneTiles[1];
                x++;
            } else if (random.generateAndMutate() < 0.3) {
                tiles[tY][tX] = emptyStoneTile;
            } else {
                tiles[tY][tX] = random.element(singleStoneTiles);
                random.generateAndMutate()
            }
        }
    }
}
function createSpecialStoneFloor(random: SRandom, area: AreaDefinition, r: Rect, alternateArea?: AreaDefinition) {
    const floorLayer = getOrAddLayer('floor', area, alternateArea);
    const tiles = floorLayer.grid.tiles;
    for (let y = 0; y < r.h; y++) {
        const tY = r.y + y;
        if (tY >= floorLayer.grid.h) {
            break;
        }
        if (!tiles[tY]) {
            tiles[tY] = [];
        }
        for (let x = 0; x < r.w; x++) {
            const tX = r.x + x;
            if (tX >= floorLayer.grid.w) {
                break;
            }
            const isOutsideRow = y === 0 || y === r.h - 1;
            const isOutsideColumn = x === 0 || x === r.w - 1;
            if (isOutsideRow && isOutsideColumn) {
                tiles[tY][tX] = fancyStoneTile;
            } else if (isOutsideRow || isOutsideColumn) {
                tiles[tY][tX] = fancierStoneTile;
            } else {
                tiles[tY][tX] = fanciestStoneTile;
            }
        }
    }
}
chunkGenerators.stoneFloor = createStoneFloor;

chunkGenerators.specialStoneFloor = createSpecialStoneFloor;

/*interface DungeonGenerationRules {
    entranceIds: string[]
    world: 'spirit'|'material'|'hybrid'
    size?: number
    enemyTypes?: EnemyType[]
    bossTypes?: BossType[]

}*/

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

type GenerationStyle = 'cave'|'tree'|'stone'|'wooden'|'crystalCave'|'crystalPalace';

type RequiredItemSet = (PassiveTool | ActiveTool)[];

interface EntranceGenerationRules {
    id: string
    targetZone: string
    targetObjectId: string
    direction: Direction
    style?: GenerationStyle
    type: 'door'|'upstairs'|'downstairs'|'ladder'
}
interface LootGenerationRules {
    id: string
    lootType: LootType
    lootAmount?: number
    lootLevel?: number
    requiredItemSets: RequiredItemSet[]
}

interface RoomGenerationRules {
    entrances: EntranceGenerationRules[]
    checks?: LootGenerationRules[]
    enemyTypes?: EnemyType[]
    bossTypes?: BossType[]
    style: GenerationStyle
}

// Assuming a tile is defined in the base world and propogating to the child world by default, this
// will modify the two worlds so that the tile is removed from area but kept in alternate area.
// This means that if area is the base world, then the override clear tile will be applied to the alternate area.
// If area is the child world, then the default tiles will be explicitly added to the child world and then replace with empty tiles in the base world.
export function clearTileInOneWorld(area: AreaDefinition, alternateArea: AreaDefinition, layerKey: string, tx: number, ty: number) {
    // Do nothing if this layer does not exist in either area.
    if (!area.layers.find(l => l.key === layerKey) && !alternateArea.layers.find(l => l.key === layerKey)) {
        return;
    }
    const baseArea = area.parentDefinition || area;
    if (area === baseArea) {
        // To clear tiles from the baseArea but keep them in the child area, they must be explicitly set in the child area first and then cleared
        // from the base world.
        const baseLayer = getOrAddLayer(layerKey, area);
        const childLayer = getOrAddLayer(layerKey, alternateArea);
        childLayer.grid.tiles[ty] = childLayer.grid.tiles[ty] || [];
        if (!childLayer.grid.tiles[ty][tx]) {
            childLayer.grid.tiles[ty][tx] = mapTileIndex(baseLayer.grid.tiles[ty][tx]) || 0;
        }
        baseLayer.grid.tiles[ty] = baseLayer.grid.tiles[ty] || [];
        baseLayer.grid.tiles[ty][tx] = 0;
    } else {
        const childLayer = getOrAddLayer(layerKey, area);
        childLayer.grid.tiles[ty] = childLayer.grid.tiles[ty] || [];
        childLayer.grid.tiles[ty][tx] = 1;
    }
}

// TODO: Think of some templates for structuring rooms as multiple connected chunks and populate each chunk with content.
// TODO: Support additional requirements/checks per room by adding barriers between connected chunks (add logic nodes+paths for each chunk).
// TODO: Create multiple room area with more complex checks+requirements and support cave style rooms.
// TODO: Add the rarest check to a stone room at the end of the cave area.
export function generateRoomAndLogic(random: SRandom, zoneId: string, area: AreaDefinition, alternateArea: AreaDefinition, section: AreaSection, rules: RoomGenerationRules): {
    logicNodes: LogicNode[]
    entrancesById: {[key: string]: EntranceDefinition}
} {
    const baseArea = area.parentDefinition ? alternateArea : area;
    const childArea = area.parentDefinition ? area : alternateArea;
    const logicNodes: LogicNode[]  = [];
    const entrancesById: {[key: string]: EntranceDefinition} = {};
    // TODO: Support other style besides stone.
    chunkGenerators.stoneRoom(random, baseArea, section);
    inheritAllLayerTilesFromParent(childArea);
    for (const entrance of rules.entrances) {
        if (entrance.direction === 'down') {
            const tx = random.range(section.x + 2, section.x + section.w - 6);
            const ty = section.y + section.h - 1;
            area.objects.push({
                type: 'door',
                id: entrance.id,
                d: entrance.direction,
                status: 'normal',
                x: tx * 16,
                y: ty * 16,
                style: 'stone',
                targetZone: entrance.targetZone,
                targetObjectId: entrance.targetObjectId,
            });
            // Clear the foreground tiles from around the door.
            for (let y = 0; y < 2; y++) {
                for (let x = 0; x < 4; x++) {
                    clearTileInOneWorld(area, alternateArea, 'foreground', tx + x, ty - 1 + y);
                    clearTileInOneWorld(area, alternateArea, 'foreground2', tx + x, ty - 1 + y);
                }
            }
        }
        // TODO: Add entrance floor tiles
        // TODO: support other entrances
    }
    const roomLogic: LogicNode = {
        zoneId,
        nodeId: `${zoneId}-entrance`,
        checks: [],
        exits: rules.entrances.map(entrance => ({objectId: entrance.id})),
        entranceIds: rules.entrances.map(entrance => entrance.id),
    }
    for (const checkRules of rules.checks) {
        // Defines the rectangle that can be used for this check. Leaves space between all the walls in this room.
        const checkRect = {
            x: section.x + 3,
            y: section.y + 5,
            w: section.w - 6,
            h: section.h - 8,
        };
        let checkLogic: LogicCheck;
        // Currently we only support a single item requirement for checks.
        if (checkRules.requiredItemSets[0][0] === 'teleportation') {
            // Ring of rocks teleportation chunk:
            // The chest is inside a ring of rocks that don't exist in the alternate world so
            // the player can teleport inside to get the check.
            // Any narrower than 4 and it is too difficult to teleport in. Any larger and there isn't enough
            // room between the ring and the walls.
            random.generateAndMutate();
            const w = random.range(4, Math.min(7, checkRect.w));
            random.generateAndMutate();
            const h = random.range(4, Math.min(7, checkRect.h));
            random.generateAndMutate();
            const x = random.range(checkRect.x, checkRect.x + checkRect.w - w);
            random.generateAndMutate();
            const y = random.range(checkRect.y, checkRect.y + checkRect.h - h);
            const chestX = random.range(x + 1, x + w - 2);
            const chestY = random.range(y, y + h - 4);
            // TODO: Add function for adding chest which includes style + option to add floor decorations.
            area.objects.push({
                type: 'chest',
                id: checkRules.id,
                status: 'normal',
                x: chestX * 16,
                y: chestY * 16,
                lootType: checkRules.lootType,
                lootAmount: checkRules.lootAmount,
                lootLevel: checkRules.lootLevel,
            });
            const fieldLayer = getOrAddLayer('field', area, alternateArea);
            const tiles = fieldLayer.grid.tiles;
            for (let tY = y; tY < y + h; tY++) {
                if (!tiles[tY]) {
                    tiles[tY] = [];
                }
                for (let tX = x; tX < x + w; tX++) {
                    if (tX === chestX && tY === chestY) {
                        continue;
                    }
                    const isOutsideRow = tY === y || tY === y + h - 1;
                    const isOutsideColumn = tX === x || tX === x + w - 1;
                    if (isOutsideRow || isOutsideColumn) {
                        tiles[tY][tX] = area.isSpiritWorld ? 189 : 10;
                    }
                }
            }
            checkLogic = orLogic(hasTeleportation, hasSomersault);
        } else {
            // If we don't know how to satisfy the requirements, or there are none,
            // just put a check with no obstacles in.
            const chestX = random.range(checkRect.x, checkRect.x + checkRect.w - 1);
            const chestY = random.range(checkRect.y, checkRect.y + checkRect.h - 1);
            area.objects.push({
                type: 'chest',
                id: checkRules.id,
                status: 'normal',
                x: chestX * 16,
                y: chestY * 16,
                lootType: checkRules.lootType,
                lootAmount: checkRules.lootAmount,
                lootLevel: checkRules.lootLevel,
            });
        }
        roomLogic.checks.push({objectId: checkRules.id, logic: checkLogic});
    }
    logicNodes.push(roomLogic);
    return {
        logicNodes,
        entrancesById,
    };
}


const baseVariantRandom = random.seed(variantSeed);

const { logicNodes } = generateRoomAndLogic(
    baseVariantRandom,
    'warPalaceWestRoom',
    spiritArea, area, spiritArea.sections[0], {
    entrances: [{
        id: 'warPalaceWestDoor',
        targetZone: 'overworld',
        targetObjectId: 'warPalaceWestDoor',
        direction: 'down',
        type: 'door',
    }],
    checks: [{
        id: 'warPalaceWestPeachPiece',
        lootType: 'peachOfImmortalityPiece',
        // Currently only a single requirement will be respected at the room level.
        requiredItemSets: [['teleportation']],
    }],
    style: 'stone',
});
spiritArea.sections[0].mapId = 'overworld';
spiritArea.sections[0].entranceId = 'warPalaceWestDoor';
spiritArea.sections[0].index = 500;

export const warPalaceWestRoomNodes = logicNodes;
