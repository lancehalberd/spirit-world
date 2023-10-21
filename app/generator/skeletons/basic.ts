import { applyNineSlice, slices } from 'app/generator/nineSlice';
import { chunkGenerators } from 'app/generator/tileChunkGenerators';
import { inheritAllLayerTilesFromParent } from 'app/utils/layers';

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
