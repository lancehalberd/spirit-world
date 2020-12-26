import { enterArea } from 'app/content/areas';
import { area as testArea } from 'app/content/testArea';

import { GameState, SavedState } from 'app/types';

function getDefaultSavedState(): SavedState {
    return {
        coins: 0,
    };
}

function getDefaultState(): GameState {
    return {
        savedState: getDefaultSavedState(),
        hero: { x: 48, y: 32, w: 16, h: 16, d: 'down' },
        camera: { x: 0, y: 0 },
        time: 0,
        gameHasBeenInitialized: false,
    };
}

let state: GameState;
export function initializeState() {
    state = getDefaultState();
    enterArea(state, testArea, 32, 32);
}

export function getState(): GameState {
    return state;
}
window['getState'] = getState;

