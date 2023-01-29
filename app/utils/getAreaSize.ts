import { GameState, Rect } from 'app/types'

export function getAreaSize(state: GameState): {w: number, h: number, section: Rect} {
    const area = state.areaInstance;
    const areaSection = state.nextAreaSection || state.areaSection;
    return {
        w: 16 * area.w,
        h: 16 * area.h,
        section: {
            x: areaSection.x * 16,
            y: areaSection.y * 16,
            w: areaSection.w * 16,
            h: areaSection.h * 16,
        },
    }
}
