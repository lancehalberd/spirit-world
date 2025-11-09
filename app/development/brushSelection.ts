
export function getSelectionBounds(state: GameState, x1: number, y1: number, x2: number, y2: number): {L: number, R: number, T: number, B: number} {
    const layerDefinition = state.areaInstance.definition.layers[0];
    if (!layerDefinition || !layerDefinition.grid) {
        return {L: 0, R: 0, T: 0, B: 0};
    }
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

export function getChunkGeneratorSelectionBounds(state: GameState, generator: ChunkGenerator, x1: number, y1: number, x2: number, y2: number): {L: number, R: number, T: number, B: number} {
    let {L, R, T, B} = getSelectionBounds(state, x1, y1, x2, y2);
    if (generator.minW && R - L < generator.minW - 1) {
        R = L + generator.minW - 1;
    } else if (generator.maxW && R - L > generator.maxW - 1) {
        R = L + generator.maxW - 1;
    }
    if (generator.minH && B - T < generator.minH - 1) {
        B = T + generator.minH - 1;
    } else if (generator.maxH && B - T > generator.maxH - 1) {
        B = T + generator.maxH - 1;
    }
    return {L, R, T, B};
}
