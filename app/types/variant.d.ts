
type VariantType = 'blockedPath' | 'switch';


interface VariantSeedData {
    // The seed to use for this particular variant.
    seed?: number
    // Whether this variant is fixed or not. If true the seed will be used directly,
    // otherwise the seed will be combined with the parent variant seed.
    fixed?: boolean
}

// A definition for a variant section.
// Variant section definitions can be added areas using the editor
// and will fill in the defined section with procedural content
// based on the parameters in the definition.
// Variants define logic that can be incorporated into the logic
// of the zone for determining requirements for paths, doors and checks.
interface VariantData<T = any> extends VariantSeedData, Rect {
    // This id is used for referencing the variant from the game logic.
    id: string
    // Variants often have a directionality.
    // If the variant has a start and an end, the direction should correspond
    // to the direction pointing from the start to the end.
    d?: Direction
    type: VariantType
    styleWeights?: {[key: string]: number}
    fields?: T
    // Development only fields. These get set during a drag operation to keep track of where the object was
    // at the start of a drag operation.
    _dragStartX?: number
    _dragStartY?: number
    // Set when copying objects to easily refer to the section and calculate their relative section coordinates.
    _sourceSection?: AreaSection
    // Used to disambiguate VariantData from ObjectDefinition.
    _editorType?: 'variant'
}

interface VariantField {
    key: string
    defaultValue: any
    getValues?: (state: GameState) => any
}

interface VariantDefinition {
    styles: string[]
    fields?: VariantField[]
    // Defaults to 4
    gridSize?: number
    // This will return false if this variant is incompatbile with the provided data.
    applyToArea(style: string, random: SRandom, state: GameState, area: AreaInstance, data: VariantData): boolean
    getLogic(style: string, random: SRandom, data: VariantData): LogicCheck
}
