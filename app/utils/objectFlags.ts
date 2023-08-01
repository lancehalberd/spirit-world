
export function setObjectFlag(state: GameState, flag: string, value: string | number | boolean = true) {
    if (state.areaInstance && state.savedState.objectFlags[flag] !== value) {
        state.areaInstance.needsLogicRefresh = true;
    }
    state.savedState.objectFlags[flag] = value;
}

export function clearObjectFlag(state: GameState, flag: string) {
    if (state.areaInstance && state.savedState.objectFlags[flag]) {
        state.areaInstance.needsLogicRefresh = true;
    }
    delete state.savedState.objectFlags[flag];
}
