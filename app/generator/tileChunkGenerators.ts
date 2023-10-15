import { orLogic, hasTeleportation, hasSomersault } from 'app/content/logic';
import { zones } from 'app/content/zones/zoneHash';
import { variantSeed } from 'app/gameConstants';
import { applyNineSlice, slices } from 'app/generator/nineSlice';
import { pad } from 'app/utils/index';
import { getOrAddLayer, inheritAllLayerTilesFromParent, inheritLayerTilesFromParent } from 'app/utils/layers';
import { mapTileIndex } from 'app/utils/mapTile';
import importedRandom from 'app/utils/SRandom';

type ChunkGenerator = (random: SRandom, area: AreaDefinition, r: Rect, alternateArea?: AreaDefinition) => void

function combinedGenerator(generators: ChunkGenerator[]): ChunkGenerator {
    return function(random: SRandom, area: AreaDefinition, r: Rect, alternateArea?: AreaDefinition) {
        for (const generator of generators) {
            random.generateAndMutate();
            generator(random, area, r, alternateArea);
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
        applyNineSlice(random, slices[key], r, area, alternateArea);
    };
}
chunkGenerators.stoneRoom = combinedGenerator([chunkGenerators[`slices-outerStoneWalls`], createStoneFloor]);


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

const materialArea: AreaDefinition = {
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
    parentDefinition: materialArea,
    isSpiritWorld: true,
    layers: [],
    objects: [],
    sections: materialArea.sections.map(s => ({...s})),
};
zones.warPalaceWestRoom = {
    key: 'warPalaceWestRoom',
    floors: [
        {
            grid: [[materialArea]],
            spiritGrid: [[spiritArea]],
        },
    ],
};

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
        baseLayer.grid.tiles[ty] = baseLayer.grid.tiles[ty] || [];
        childLayer.grid.tiles[ty] = childLayer.grid.tiles[ty] || [];
        if (!childLayer.grid.tiles[ty][tx]) {
            childLayer.grid.tiles[ty][tx] = mapTileIndex(baseLayer.grid.tiles[ty][tx]) || 0;
        }
        baseLayer.grid.tiles[ty][tx] = 0;
    } else {
        const childLayer = getOrAddLayer(layerKey, area);
        childLayer.grid.tiles[ty] = childLayer.grid.tiles[ty] || [];
        childLayer.grid.tiles[ty][tx] = 1;
    }
}

interface RoomSlot extends Rect {
    d: Direction
    id: string
}
interface RoomPath extends Rect {
    d: Direction
    sourceId: string
    targetId: string
}

interface RoomSkeleton {
    slots: RoomSlot[]
    paths: RoomPath[]
}

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
                x: innerRect.x + innerRect.w - 3,
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

interface GlobalGeneratorContext {
    random: SRandom
    slotGenerators?: SlotGenerator[]
}

interface ZoneGeneratorContext extends GlobalGeneratorContext {
    zoneId: string
}

interface RoomGeneratorContext extends ZoneGeneratorContext {
    roomId: string
    // The primary area content is being generated for.
    area: AreaDefinition
    // The alternate area for the area content is being generated for.
    alternateArea: AreaDefinition
    // The material world area.
    baseArea: AreaDefinition
    section: AreaSection
    // The spirit world area.
    childArea: AreaDefinition
    rules: RoomGenerationRules
}

interface SlotContext extends RoomGeneratorContext {
    slot: RoomSlot
}

interface SlotGenerator {
    isValid?: (context: SlotContext) => boolean
    apply?: (context: SlotContext) => void
}

const planterSlot: SlotGenerator = {
    isValid(context: SlotContext) {
        return context.slot.w >= 6 && context.slot.h >= 5;
    },
    apply(context: SlotContext) {
        const {random, zoneId, roomId, area, baseArea, childArea, slot} = context;
        const floorLayer = getOrAddLayer('floor', baseArea, childArea);
        const fieldLayer = getOrAddLayer('field', baseArea, childArea);
        const cx = slot.x + Math.floor((slot.w - 1) / 2);
        for (let y = slot.y; y < slot.y + slot.h; y++) {
            for (let x = slot.x; x < slot.x + slot.w; x++) {
                if (y === slot.y || y === slot.y + slot.h - 1 || x === slot.x || x === slot.x + slot.w - 1) {
                    floorLayer.grid.tiles[y][x] = 1215;
                    continue;
                }
                floorLayer.grid.tiles[y][x] = 36;
                if (y >= slot.y + slot.h / 2 - 1 && y < slot.y + slot.h / 2 + 1
                    && (x === cx || x === cx + 1)
                ) {
                    continue;
                }
                fieldLayer.grid.tiles[y][x] = 2;
            }
        }
        inheritLayerTilesFromParent('floor', childArea, slot);
        inheritLayerTilesFromParent('field', childArea, slot);
        area.objects.push({
            type: 'enemy',
            enemyType: area.isSpiritWorld ? random.element(['plantFlame','plantFrost','plantStorm']) : 'plant',
            id: `${zoneId}-${roomId}-${slot.id}-plant`,
            d: 'down',
            status: 'normal',
            x: cx * 16 + 4,
            y: (slot.y + slot.h / 2) * 16 - 8,
        });
    },
};

const raisedPlanterSlot: SlotGenerator = {
    isValid(context: SlotContext) {
        return context.slot.w >= 7 && context.slot.h >= 5;
    },
    apply(context: SlotContext) {
        // High chance to split a single raised planter into two if there is enough room in the slot.
        if (context.slot.w >= 13 && context.random.generateAndMutate() < 0.8) {
            raisedPlanterSlot.apply({
                ...context,
                slot: {
                    ...context.slot,
                    id: context.slot.id + 'A',
                    w: 7,
                },
            });
            raisedPlanterSlot.apply({
                ...context,
                slot: {
                    ...context.slot,
                    id: context.slot.id + 'B',
                    x: context.slot.x + 6,
                    w: 7,
                },
            });
            return;
        }
        const {random, zoneId, roomId, area, baseArea, childArea, slot} = context;
        const floorLayer = getOrAddLayer('floor', baseArea, childArea);
        for (let y = slot.y + 1; y < slot.y + slot.h - 2; y++) {
            for (let x = slot.x + 2; x < slot.x + slot.w - 2; x++) {
                floorLayer.grid.tiles[y][x] = 1216;
            }
        }
        applyNineSlice(random, slices.stonePlatform, {
            x: slot.x + 1,
            y: slot.y + 1,
            w: slot.w - 2,
            h: slot.h - 3,
        }, baseArea);
        const fieldLayer = getOrAddLayer('field', baseArea, childArea);
        const y = slot.y + slot.h - 2;
        for (let x = slot.x + 2; x < slot.x + slot.w - 2; x++) {
            fieldLayer.grid.tiles[y][x] = [1204,1203][x % 2];
        }
        fieldLayer.grid.tiles[y][slot.x + 1] = 708;
        fieldLayer.grid.tiles[y][slot.x + slot.w - 2] = 709;
        inheritAllLayerTilesFromParent(childArea, slot);
        random.generateAndMutate();
        area.objects.push({
            type: 'enemy',
            enemyType: area.isSpiritWorld ? random.element(['plantFlame','plantFrost','plantStorm']) : 'plant',
            id: `${zoneId}-${roomId}-${slot.id}-plant`,
            d: 'down',
            status: 'normal',
            x: (slot.x + slot.w / 2) * 16 - 12,
            y: (slot.y + (slot.h - 1) / 2) * 16 - 8,
        });
    },
}

function getSlotGenerators(): SlotGenerator[] {
    return [planterSlot, raisedPlanterSlot];
}

function fillSlotFromContext(context: RoomGeneratorContext, slot: RoomSlot): void {
    const { random } = context;
    if (!context.slotGenerators?.length) {
        context.slotGenerators = getSlotGenerators();
    }
    const slotContext: SlotContext = {
        ...context,
        slot,
    };
    random.generateAndMutate();
    for (const generator of random.shuffle(context.slotGenerators)) {
        if (generator.isValid(slotContext)) {
            generator.apply(slotContext);
            context.slotGenerators.splice(context.slotGenerators.indexOf(generator), 1);
            return;
        }
    }
}

type DoorStyle = 'stone';
type DoorType = 'door'|'upstairs'|'downstairs'|'ladder';
interface DoorContext extends SlotContext {
    doorType: DoorType
}


// This returns w/h for the entrance so we don't have to recompute it from the resulting definition.
export function getEntranceDefintion({id = '', d, style, type}: {id: string, d: Direction, style: DoorStyle, type: DoorType} ): {definition: EntranceDefinition, w: number, h: number} {
    let w = 32, h = 32;
    let computedStyle: string = style;
    // TODO: support other styles
    if (type === 'upstairs') {
        d = 'up';
        // TODO: support other styles
        computedStyle = 'stoneUpstairs';
    }
    if (type === 'downstairs') {
        d = 'up';
        // TODO: support other styles
        computedStyle = 'stoneDownstairs';
    }
    if (type === 'ladder') {
        if (d === 'up') {
            computedStyle ='ladderUp';
            w = 16;
            h = 32;
        } else {
            d = 'down';
            computedStyle = 'ladderdown';
            w = 16;
            h = 16;
        }
    } else if (d === 'left' || d === 'right') {
        w = 16;
        h = 64;
    } else if (d === 'down') {
        w = 64;
        h = 16;
    }
    const definition: EntranceDefinition = {
        type: 'door',
        id,
        d,
        status: 'normal',
        style: computedStyle,
        x: 0,
        y: 0,
    };
    return {definition, w, h};
}

// TODO: support placing linked doors simultaneously.
export function addDoorAndClearForegroundTiles(definition: EntranceDefinition, area: AreaDefinition, alternateArea: AreaDefinition) {
    area.objects.push(definition);

    if (definition.style !== 'ladderDown' && definition.d === 'down') {
        const left = Math.ceil(definition.x / 16), right = Math.floor((definition.x + 64) / 16);
        const top = ((definition.y / 16) | 0) - 1, bottom = top + 2;
        // Clear the foreground tiles from around the door.
        for (let y = top; y < bottom; y++) {
            for (let x = left; x < right; x++) {
                clearTileInOneWorld(area, alternateArea, 'foreground', x, y);
                clearTileInOneWorld(area, alternateArea, 'foreground2', x, y);
            }
        }
    } else if (definition.d === 'left') {
        const left = ((definition.x / 16) | 0), right = left + 2;
        const top = Math.ceil(definition.y / 16), bottom = Math.floor((definition.y + 64) / 16);
        // Clear the foreground tiles from around the door.
        for (let y = top; y < bottom; y++) {
            for (let x = left; x < right; x++) {
                clearTileInOneWorld(area, alternateArea, 'foreground', x, y);
                clearTileInOneWorld(area, alternateArea, 'foreground2', x, y);
            }
        }
    } else if (definition.d === 'right') {
        const left = ((definition.x / 16) | 0) - 1, right = left + 2;
        const top = Math.ceil(definition.y / 16), bottom = Math.floor((definition.y + 64) / 16);
        // Clear the foreground tiles from around the door.
        for (let y = top; y < bottom; y++) {
            for (let x = left; x < right; x++) {
                clearTileInOneWorld(area, alternateArea, 'foreground', x, y);
                clearTileInOneWorld(area, alternateArea, 'foreground2', x, y);
            }
        }
    }
}

export function addDoor(context: DoorContext): EntranceDefinition {
    const {random, zoneId, roomId, slot, area, alternateArea, doorType} = context;
    // TODO: support other styles
    let d = slot.d, style = 'stone';
    if (doorType === 'upstairs') {
        d = 'up';
        // TODO: support other styles
        style = 'stoneUpstairs';
    }
    if (doorType === 'downstairs') {
        d = 'up';
        // TODO: support other styles
        style = 'stoneDownstairs';
    }
    if (doorType === 'ladder') {
        if (d === 'up') {
            style ='ladderUp';
        } else {
            d = 'down';
            style = 'ladderdown';
        }
    }
    const definition: EntranceDefinition = {
        type: 'door',
        id: `${zoneId}-${roomId}-${slot.id}`,
        d,
        status: 'normal',
        style,
        x: 0,
        y: 0,
    }
    random.generateAndMutate();
    if (doorType === 'door' && d === 'down') {
        const tx = random.range(slot.x, slot.x + slot.w - 4);
        const ty = slot.y + slot.h - 1;
        definition.x = tx * 16;
        definition.y = ty * 16;
        // Clear the foreground tiles from around the door.
        for (let y = 0; y < 2; y++) {
            for (let x = 0; x < 4; x++) {
                clearTileInOneWorld(area, alternateArea, 'foreground', tx + x, ty - 1 + y);
                clearTileInOneWorld(area, alternateArea, 'foreground2', tx + x, ty - 1 + y);
            }
        }
    } else if (d === 'up') {
        const tx = random.range(slot.x, slot.x + slot.w - 2);
        const ty = slot.y;
        definition.x = tx * 16;
        definition.y = ty * 16;
    } else if (d === 'left') {
        const tx = slot.x;
        const ty = random.range(slot.y, slot.y + slot.h - 4);
        definition.x = tx * 16;
        definition.y = ty * 16;
        // Clear the foreground tiles from around the door.
        for (let y = 0; y < 4; y++) {
            for (let x = 0; x < 2; x++) {
                clearTileInOneWorld(area, alternateArea, 'foreground', tx + x, ty + y);
                clearTileInOneWorld(area, alternateArea, 'foreground2', tx + x, ty + y);
            }
        }
    } else if (d === 'right') {
        const tx = slot.x + slot.w - 1;
        const ty = random.range(slot.y, slot.y + slot.h - 4);
        definition.x = tx * 16;
        definition.y = ty * 16;
        // Clear the foreground tiles from around the door.
        for (let y = 0; y < 4; y++) {
            for (let x = 0; x < 2; x++) {
                clearTileInOneWorld(area, alternateArea, 'foreground', tx - 1 + x, ty + y);
                clearTileInOneWorld(area, alternateArea, 'foreground2', tx - 1 + x, ty + y);
            }
        }
    }
    area.objects.push(definition);
    return definition;
}


// TODO: Think of some templates for structuring rooms as multiple connected chunks and populate each chunk with content.
// TODO: Support additional requirements/checks per room by adding barriers between connected chunks (add logic nodes+paths for each chunk).
// TODO: Create multiple room area with more complex checks+requirements and support cave style rooms.
// TODO: Add the rarest check to a stone room at the end of the cave area.
// TODO: Add room and hallway skeleton
// TODO: Add "planter" slot content
// TODO: Add filler check 1 random money check+ one optional requirement, possibly limited by context rules to make sure dungeons can be full cleared with
//   specific loadouts.
export function generateRoomAndLogic(context: RoomGeneratorContext): { //random: SRandom, zoneId: string, area: AreaDefinition, alternateArea: AreaDefinition, section: Rect, rules: RoomGenerationRules): {
    logicNodes: LogicNode[]
    entrancesById: {[key: string]: EntranceDefinition}
} {
    // Always make the left column abyss tiles so that the magic bar doesn't cover up anything important.
    const {random, zoneId, roomId, area, alternateArea, baseArea, childArea, section, rules} = context;
    const foregroundLayer = getOrAddLayer('foreground', baseArea, childArea);
    for (let y = 0; y < section.h; y++) {
        foregroundLayer.grid.tiles[y][0] = 57;
    }
    // Reduce the room size by one to account for the removed column above.
    const rect = {
        ...section,
        x: section.x + 1,
        w: section.w - 1,
    };
    const entrancesById: {[key: string]: EntranceDefinition} = {};
    // TODO: Support other style besides stone.
    const {slots, paths} = generateTallRoomSkeleton(random, area, alternateArea, rect, rules);
    const nodesById: {[key: string]: LogicNode} = {};
    nodesById.entrance = {
        zoneId,
        nodeId: `${zoneId}-entrance`,
        checks: [],
        paths: [],
        exits: rules.entrances.map(entrance => ({objectId: entrance.id})),
        entranceIds: rules.entrances.map(entrance => entrance.id),
    };
    for (const slot of slots) {
        nodesById[slot.id] = {
            zoneId,
            nodeId: `${zoneId}-${roomId}-${slot.id}`,
            checks: [],
            paths: [],
        };
    }
    for (const path of paths) {
        const node = nodesById[path.sourceId];
        if (!node) {
            console.error('Missing node for path source', path.sourceId);
            debugger;
        }
        if (!nodesById[path.targetId]) {
            console.error('Missing node for path target', path.targetId);
            debugger;
        }
        // TODO: Optionally add a barrier here based on the requirements and include its logic on this path connection.
        node.paths.push({
            nodeId: `${zoneId}-${path.targetId}`,
        });
    }

    for (const entrance of rules.entrances) {
        const entranceDefinition = addDoor({
            ...context,
            slot: {
                id: 'entrance',
                x: section.x + 2, w: section.w - 4,
                y: section.y, h: section.h,
                d: 'down',
            },
            doorType: 'door',
        })
        entranceDefinition.id = entrance.id;
        entranceDefinition.targetZone = entrance.targetZone;
        entranceDefinition.targetObjectId = entrance.targetObjectId;
        entrancesById[entranceDefinition.id] = entranceDefinition;
        /*if (entrance.direction === 'down') {
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
        }*/
        // TODO: Add entrance floor tiles
        // TODO: support other entrances
    }
    for (const checkRules of rules.checks) {
        const slot = slots[slots.length - 1];
        const node = nodesById[slot.id];
        // Leave some s
        const checkRect = pad(slot, - 1);
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
        node.checks.push({objectId: checkRules.id, logic: checkLogic});
    }
    for (let i = 0; i < slots.length - 1; i++) {
        fillSlotFromContext(context, slots[i]);
    }
    const logicNodes: LogicNode[] = Object.values(nodesById);
    return {
        logicNodes,
        entrancesById,
    };
}


export function getAreaContext(area: AreaDefinition, alternateArea: AreaDefinition) {
    const baseArea = area.parentDefinition ? alternateArea : area;
    const childArea = area.parentDefinition ? area : alternateArea;
    return { area, alternateArea, baseArea, childArea};
}

const baseVariantRandom = importedRandom.seed(variantSeed);

const { logicNodes } = generateRoomAndLogic({
    random: baseVariantRandom,
    zoneId: 'warPalaceWestRoom',
    roomId: 'room',
    ...getAreaContext( spiritArea, materialArea),
    section: spiritArea.sections[0],
    rules: {
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
    }
});
spiritArea.sections[0].mapId = 'overworld';
spiritArea.sections[0].entranceId = 'warPalaceWestDoor';
spiritArea.sections[0].index = 500;

export const warPalaceWestRoomNodes = logicNodes;


