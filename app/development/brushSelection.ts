
export function getSelectionBounds(state: GameState, x1: number, y1: number, x2: number, y2: number): {L: number, R: number, T: number, B: number} {
    const layerDefinition = state.areaInstance.definition.layers[0];
    const tx1 = Math.floor((state.camera.x + x1) / 16);
    const ty1 = Math.floor((state.camera.y + y1) / 16);
    const tx2 = Math.floor((state.camera.x + x2) / 16);
    const ty2 = Math.floor((state.camera.y + y2) / 16);
    const L = Math.max(0, Math.min(tx1, tx2));
    const R = Math.min(layerDefinition.grid.w - 1, Math.max(tx1, tx2));
    const T = Math.max(0, Math.min(ty1, ty2));
    const B = Math.min(layerDefinition.grid.h - 1, Math.max(ty1, ty2));
    return {L, R, T, B};
}
