import { orLogic, hasTeleportation, hasSomersault } from 'app/content/logic';
import { addDoor } from 'app/generator/doors';
import { applyNineSlice, slices } from 'app/generator/nineSlice';
import { fillSlotFromContext } from 'app/generator/slots/basic';
import { chunkGenerators } from 'app/generator/tileChunkGenerators';
import { pad } from 'app/utils/index';
import { getOrAddLayer, inheritAllLayerTilesFromParent } from 'app/utils/layers';


export function generateTallRoomSkeleton(random: SRandom, area: AreaDefinition, alternateArea: AreaDefinition, section: Rect, rules: RoomGenerationRules): RoomSkeleton {
    const slots: RoomSlot[] = [];
    const paths: RoomPath[] = [];
    const baseArea = area.parentDefinition ? alternateArea : area;
    const childArea = area.parentDefinition ? area : alternateArea;

    chunkGenerators.stoneRoom(random, baseArea, section, childArea);
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
                }, baseArea, childArea);
                applyNineSlice(random, slices.innerStoneWalls, {
                    x: cx + 1,
                    y,
                    w: innerRect.x + innerRect.w - 1 - (cx + 1),
                    h,
                }, baseArea, childArea);
            } else {
                applyNineSlice(random, slices.innerStoneWalls, {
                    x: innerRect.x + 1,
                    y,
                    w: innerRect.w - 2,
                    h,
                }, baseArea, childArea);
            }
        }
        y += h;
    }

    inheritAllLayerTilesFromParent(childArea);

    return {slots, paths};
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
            nodeId: `${zoneId}-${roomId}-${path.targetId}`,
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
