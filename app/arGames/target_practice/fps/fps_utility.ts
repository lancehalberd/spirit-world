
import {getMovementDeltas} from 'app/userInput';
import {TargetPracticeState} from './fps_types';


export function getHeroPosition(state: GameState, gameState: TargetPracticeState): Rect {
    const cursorSpeed = 3.5;
    const [dx, dy] = getMovementDeltas(state, true);
    const cursorSize = 16;
    

    let diagMultiplier = (dx !== 0 && dy !== 0) ? 0.7 : 1;
    
    return {
        x: Math.max(
            gameState.screen.x + cursorSize / 2,
            Math.min(gameState.screen.x + gameState.screen.w - cursorSize / 2, gameState.crosshair.x + cursorSpeed * dx * diagMultiplier)),
        y: Math.max(
            gameState.screen.y + cursorSize / 2,
            Math.min(gameState.screen.y + gameState.screen.h - cursorSize / 2, gameState.crosshair.y + cursorSpeed * dy * diagMultiplier)),
        w: 16,
        h: 16,
    };
}