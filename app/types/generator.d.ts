
type GenerationStyle = 'cave'|'tree'|'stone'|'wooden'|'crystalCave'|'crystalPalace';


interface RoomSlot extends Rect {
    d: Direction
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
    lootType?: LootType
    lootLevel?: number
    lootAmount?: number
    nodes?: TreeNode[]
    requirements?: LogicCheck[][]
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
    // Indicates this room is a full super tile in width.
    // Can be set as a requirement when creating the tree or randomly added during generation.
    // Set to false to prevent the room from being randomly assigned a wide layout.
    wide?: boolean
    // Similar to wide, inidicates this room is a full super tile in height.
    tall?: boolean
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
    // Unique node id
    id?: string
    skeleton?: RoomSkeleton
}
