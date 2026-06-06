
interface EditorArrayProperty<T> {
    name: string
    id?: string
    // A button property will have no value.
    value?: T[]
    // If the property is an enum, you can set the list of all values.
    values?: readonly T[]
    // If the property is editable, you can specify what happens when it is changed.
    onChange: (newValue: T[]) => void
}

// This is used to allow a user to select a tile/group of tiles from a tile palette.
interface EditorPaletteProperty {
    name: string
    id?: string
    // The selection is a complete tile grid, but will often be used to represent a single tile.
    value?: TileGridDefinition
    palette: TilePalette
    onChange: (newValue: TileGridDefinition) => void
}

interface EditorSourcePaletteProperty {
    name: string
    id?: string
    // The selection is a complete tile grid, but will often be used to represent a single tile.
    value?: TileGridDefinition
    sourcePalette: SourcePalette
    onChange: (newValue: TileGridDefinition) => void
}

interface EditorButtonProperty {
    name: string
    id?: string
    onClick: () => void
}

interface EditorSingleProperty<T> {
    name: string
    id?: string
    multiline?: boolean
    // Can add classes like 'small' and 'wide' to inputs.
    inputClass?: string
    // Will set the size attribute for any rendered select element.
    selectSize?: number
    // A button property will have no value.
    value?: T
    // If the property is an enum, you can set the list of all values.
    values?: readonly T[]
    // If the property is editable, you can specify what happens when it is changed.
    onChange?: (newValue: T) => (T | void)
}
type EditorProperty<T> = EditorArrayProperty<T>
    | EditorSingleProperty<T>
    | EditorButtonProperty
    | EditorPaletteProperty
    | EditorSourcePaletteProperty;

type PropertyRow = (EditorProperty<any> | HTMLElement | string)[];

type PanelRows = (EditorProperty<any> | PropertyRow | HTMLElement | string)[];



type OptionValueTypes = string | number | boolean;
// The actual option values selected for a Special Brush
interface BrushOptions {
  [key: string]: OptionValueTypes
}
// The set of possible option values for a Special Brush
type BrushOptionsValues<T extends BrushOptions> = {
  [K in keyof T]?: T[K][]
}
interface SpecialBrush<O extends BrushOptions> {
    options: BrushOptionsValues<O>
    apply: (area: AreaDefinition, alternateArea: AreaDefinition, point: Point, options: O) => Point[]
    modifyOptions?: (options: O, isShiftDown: boolean) => O
}


type SelectableDefinition = ObjectDefinition | VariantData;

interface SpecialBrushSelection<T extends BrushOptions> {
    brush: SpecialBrush<T>
    options: T
}

type EditorToolType = 'brush' | 'object' | 'enemy' | 'boss' | 'replace' | 'select' | 'tileChunk' | 'variant';
interface EditingState {
    tool: EditorToolType
    previousTool: EditorToolType
    hasChanges: boolean
    isEditing: boolean
    brushType: 'palette' | 'special'
    specialBrushSettings?: SpecialBrushSelection<any>
    brush?: {[key: string]: TileGridDefinition}
    clipboardObjects?: SelectableDefinition[]
    needsRefresh?: boolean
    paletteKey?: string
    tileChunkKey?: string
    recentAreas: AreaInstance[]
    selectedLayerKey?: string
    refreshMinimap?: boolean
    replacePercentage: number
    selectedObject?: ObjectDefinition
    selectedObjects: SelectableDefinition[]
    selectedVariantData?: VariantData
    spirit: boolean
    dragObject?: SelectableDefinition
    dragOffset?: {x: number, y: number}
    dragged?: boolean
    selectedSections: number[]
    // Can set to 0.5
    areaScale: number
    sectionDragData?: {
        x: number
        y: number
        sectionIndex: number
        originalSectionX: number
        originalSectionY: number
        dragged: boolean
        movedCount: number
    }
    showWalls?: boolean
    showWallsOpacity: number
    showHitboxes?: boolean
    showRenderPerformance?: boolean
}
