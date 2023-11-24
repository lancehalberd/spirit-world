
type GenerationStyle = 'cave'|'tree'|'stone'|'wooden'|'crystalCave'|'crystalPalace';


type RequiredItemSet = (PassiveTool | ActiveTool)[];

interface EntranceGenerationRules {
    id: string
    targetZone: string
    targetObjectId: string
    direction: Direction
    style?: GenerationStyle
    type: 'door'|'upstairs'|'downstairs'|'ladder'
}
interface LootGenerationRules {
    id: string
    lootType: LootType
    lootAmount?: number
    lootLevel?: number
    requiredItemSets: RequiredItemSet[]
}

interface RoomGenerationRules {
    entrances: EntranceGenerationRules[]
    checks?: LootGenerationRules[]
    enemyTypes?: EnemyType[]
    bossTypes?: BossType[]
    style: GenerationStyle
}

/*interface DungeonGenerationRules {
    entranceIds: string[]
    world: 'spirit'|'material'|'hybrid'
    size?: number
    enemyTypes?: EnemyType[]
    bossTypes?: BossType[]
}*/

interface GlobalGeneratorContext {
    random: SRandom
    slotGenerators?: SlotGenerator[]
}

interface ZoneGeneratorContext extends GlobalGeneratorContext {
    zoneId: string
}

interface RoomGeneratorContext extends ZoneGeneratorContext {
    roomId: string
    // The primary area content is being generated for.
    area: AreaDefinition
    // The alternate area for the area content is being generated for.
    alternateArea: AreaDefinition
    // The material world area.
    baseArea: AreaDefinition
    section: AreaSection
    // The spirit world area.
    childArea: AreaDefinition
    rules: RoomGenerationRules
}

interface SlotContext extends RoomGeneratorContext {
    slot: RoomSlot
}

interface SlotGenerator {
    isValid?: (context: SlotContext) => boolean
    apply?: (context: SlotContext) => void
}

interface RoomSlot extends Rect {
    d?: Direction
    id: string
}
interface RoomPath extends Rect {
    d: Direction
    sourceId: string
    targetId: string
}

interface RoomSkeleton {
    slots: RoomSlot[]
    paths: RoomPath[]
}

interface TreeNode {
    type?: 'boss'|'bigChest'|'goal'|'trap'|'treasure'
    style?: GenerationStyle
    lootType?: LootType
    lootLevel?: number
    lootAmount?: number
    nodes?: TreeNode[]
    requirements?: LogicCheck[][]
    // Distance from the root to this node.
    depth?: number
    // If set, the room will generate with entrances in this direction.
    // For example if this is ['down'], then the entrance must be on the south side of the room.
    entranceDirections?: Direction[]
    entrance?: {
        d: Direction
        type: 'door'
        id: string
        targetZone: string
        targetObjectId: string
    }
    difficultyModifier?: number
    // Indicates this room is a full super tile in width.
    // Can be set as a requirement when creating the tree or randomly added during generation.
    // Set to false to prevent the room from being randomly assigned a wide layout.
    wide?: boolean
    // Similar to wide, inidicates this room is a full super tile in height.
    tall?: boolean
    minimumSlotCount?: number
    populateRoom?: (context: {zoneId: string, random: SRandom}, node: TreeNode) => void
    // If this is set, the door leading to this room will be centered p% of the way across the available space.
    doorP?: number
    // This will be set if stair cases are added to this node and indicates which slots are still available to
    // have additional stair cases. The current version expect doorways to be centered at
    // 1/4(8), 1/2(16), and 3/4(24) of the super tile, with stairs cases at 1/8(4), 3/8(12), 5/8(20) and 7/8(28)
    stairSlots?: number[]
    // Indicates that this node has a stair case, in which case the top of the node cannot be changed since
    // that would cause the stair case not to line up with connected stair case.
    hasStairs?: boolean
    coords?: Point
    // The width and height of the nodes section in single room units (1/2 super tile size).
    dimensions?: {w: number, h: number}
    baseArea?: AreaDefinition
    baseAreaSection?: AreaSection
    childArea?: AreaDefinition
    childAreaSection?: AreaSection
    // The entrance definition for this node from its parent.
    entranceDefinition?: EntranceDefinition
    allEntranceDefinitions?: EntranceDefinition[]
    // Unique node id
    id?: string
    skeleton?: RoomSkeleton
}
