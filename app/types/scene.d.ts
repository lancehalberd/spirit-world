
// A buffer for holding the last rendered state of the scene/
// This is useful if a scene will be displayed behind another active scene and you don't want to re-render it every frame.
interface CanvasBuffer {
    needsRefresh?: boolean
    canvas: HTMLCanvasElement
    context: CanvasRenderingContext2D
}

interface GameScene {
    // Hack to identify specific scene types on the stack.
    sceneType?: string
    // Optional buffer for this scene which can be used to skip rendering in the background.
    buffer?: CanvasBuffer
    update?: (state: GameState, interactive: boolean) => void
    render?: (context: CanvasRenderingContext2D, state: GameState) => void
    // If true, other scenes below this scene in the stack should not process input.
    // Should be true in most cases.
    blocksInput: boolean
    // If true, other scenes below this in the stack should not render.
    // Typically this is set because a scene either covers the whole screen or has cached
    // the contents of the scene behind it manually.
    blocksRenders?: boolean
    // It true, scenes below this scene in the stack will not be updated.
    blocksUpdates?: boolean
    // If this is defined and returns true, the global music controller will be disabled while
    // this is on the stack.
    updateMusic?: (state: GameState) => boolean
    // Some scenes have built in logic for closing them, such as the map and inventory scenes.
    closeScene?: (state: GameState) => void
}
