
import { applyNineSlice, slices } from 'app/generator/nineSlice';
import { getOrAddLayer, inheritAllLayerTilesFromParent, inheritLayerTilesFromParent } from 'app/utils/layers';

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

export function fillSlotFromContext(context: RoomGeneratorContext, slot: RoomSlot): void {
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
