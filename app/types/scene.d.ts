
// A buffer for holding the last rendered state of the scene/
// This is useful if a scene will be displayed behind another active scene and you don't want to re-render it every frame.
interface CanvasBuffer {
    needsRefresh?: boolean
    canvas: HTMLCanvasElement
    context: CanvasRenderingContext2D
}

interface GameScene {
    // Whether this game scene is paused or not. Scenes are typically paused when they are not at the top of the scene stack.
    paused?: boolean
    // Optional buffer for this scene which can be used to skip rendering in the background.
    buffer?: CanvasBuffer
    update?: (state: GameState, interactive: boolean) => void
    render?: (context: CanvasRenderingContext2D, state: GameState) => void
    // If true, other scenes below this scene in the stack should not process input.
    // Should be true in most cases.
    capturesInput: boolean
}
