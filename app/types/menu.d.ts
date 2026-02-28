
interface MenuPanel extends Rect {
    // Unique id for this panel.
    id: string
    rows: number
    columns: number
    optionsOffset?: Point
    options: MenuElement[]
}

interface MenuElement extends Rect {
    getLabel: (state: GameState) => string
    isVisible: (state: GameState) => boolean
    isSelected?: (state: GameState) => boolean
    render: (context: CanvasRenderingContext2D, state: GameState) => void
    renderSelection?: (context: CanvasRenderingContext2D, state: GameState) => void
    // Tool index will be set to 0/1 if the LEFT_TOOL or RIGHT_TOOL button is used to select.
    onSelect: (state: GameState, toolIndex?: number) => boolean
    onUpgrade?: (state: GameState) => void
}
