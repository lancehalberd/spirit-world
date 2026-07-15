
export function setObjectFlag(state: GameState, flag: string, value: string | number | boolean = true) {
    if (state.savedState.objectFlags[flag] !== value) {
        state.currentAreaNeedsLogicRefresh = true;
    }
    state.savedState.objectFlags[flag] = value;
}

export function clearObjectFlag(state: GameState, flag: string) {
    if (state.savedState.objectFlags[flag]) {
        state.currentAreaNeedsLogicRefresh = true;
    }
    delete state.savedState.objectFlags[flag];
}
