import { enterArea } from 'app/content/areas';
import { area as testArea } from 'app/content/testArea';

import { PeachOfImmortality, PeachOfImmortalityQuarter } from 'app/content/lootObject';

import { GameState, SavedState } from 'app/types';

function getDefaultSavedState(): SavedState {
    return {
        coins: 0,
    };
}

function getDefaultState(): GameState {
    return {
        savedState: getDefaultSavedState(),
        hero: {
            x: 48, y: 32, w: 16, h: 16,
            d: 'down',
            life: 4, maxLife: 4,
            peachQuarters: 0,
        },
        camera: { x: 0, y: 0 },
        time: 0,
        gameHasBeenInitialized: false,
        lastTimeRendered: 0,
    };
}

let state: GameState;
export function initializeState() {
    state = getDefaultState();
    enterArea(state, testArea, 32, 32);
    state.areaInstance.objects.push(new PeachOfImmortality({x: 451, y: 227}));
    state.areaInstance.objects.push(new PeachOfImmortalityQuarter({x: 150, y: 150}));
    state.areaInstance.objects.push(new PeachOfImmortalityQuarter({x: 300, y: 150}));
    state.areaInstance.objects.push(new PeachOfImmortalityQuarter({x: 150, y: 300}));
    state.areaInstance.objects.push(new PeachOfImmortalityQuarter({x: 300, y: 300}));
}

export function getState(): GameState {
    return state;
}
window['getState'] = getState;

