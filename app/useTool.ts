import { Arrow } from 'app/content/arrow';
import { directionMap } from 'app/utils/field';

import { ActiveTool, Direction, GameState, } from 'app/types'

export function useTool(state: GameState, tool: ActiveTool, dx: number, dy: number, direction: Direction): void {
    switch (tool) {
        case 'bow':
            const arrow = new Arrow({
                x: state.hero.x + 8 + 8 * directionMap[state.hero.d][0],
                y: state.hero.y + 8 + 8 * directionMap[state.hero.d][1],
                vx: 4 * directionMap[state.hero.d][0],
                vy: 4 * directionMap[state.hero.d][1],
                direction: state.hero.d
            });
            state.areaInstance.objects.push(arrow);
            break;
    }
}
