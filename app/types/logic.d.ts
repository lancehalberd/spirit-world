interface SimpleLogicCheck {
    operation?: 'isTrue' | 'isFalse'
    // This logic check is false unless all required flags are set.
    requiredFlags?: string[]
    // This logic check is false if any excluded flag is set.
    excludedFlags?: string[]
    // If this set is populated, this check is false if the current zone is not among the defined zones.
    // This is useful for restricting an NPCs dialogue to a particular area or set of areas.
    zones?: string[]
}

interface LogicDefinition {
    // Set this to indicate something is always in logic
    isTrue?: boolean
    // This can be set to a single key to check.
    hasCustomLogic?: boolean
    customLogic?: string
    // This can be set to a specific logic key to use.
    logicKey?: string
    // If this is true, then the logic is inverted.
    isInverted?: boolean
}

interface AndLogicCheck {
    operation: 'and'
    logicChecks: LogicCheck[]
}

interface OrLogicCheck {
    operation: 'or'
    logicChecks: LogicCheck[]
}

type LogicCheck = SimpleLogicCheck | AndLogicCheck | OrLogicCheck |
    ((state: GameState) => boolean) | true | false;

interface DialogueOption {
    // The logic that determines if this dialogue option is valid for the current game state.
    logicCheck?: LogicCheck
    // If defined, this option will only be valid for objects with a matching object id on their object definition.
    // Only supported for saveStatues currently, but it could be easily added to NPCs as well.
    objectId?: string
    // By default dialogue is not available when using astral projection. Set this flag to allow it for astral projection.
    // Set this and include `requiredFlags:  '$isSpirit']` on the logic check to restrict dialogue to only the astral projection.
    allowSpirit?: boolean
    // If this is set, this flag will be set once the player has finished this dialogue option.
    // Combining this with the same flag in `excludedFlags` will cause dialogue to occur no more than once
    // and should be used for dialogue that grants rewards to prevent giving the awards multiple times.
    progressFlag?: string
    // If this flag is set, this dialogue will be shown if it is the first valid option found with this flag set.
    isExclusive?: boolean
    // The set of dialogues that can occur when this option is chosen.
    text: Dialogue[]
    // If set, dialogue will return to this index after exhausting all options.
    repeatIndex?: number
    // Notes for development purposes.
    notes?: string
}

interface DialogueChoiceDefinition {
    prompt?: string
    choices: {
        text: string
        key: string
    }[]
}

type DialogueType = 'quest' | 'reminder' | 'subquest' | 'hint';

interface Dialogue {
    text: TextScript
    dialogueType?: DialogueType
    dialogueIndex?: number
}

type TextScript = ((state: GameState) => string) | string

interface DialogueSet {
    // The identifier for this dialogue set, used to attach it to a particular NPC.
    key: string,
    // Mapped dialogue options are trigged through {@key} indicators in text.
    // This can be used to create dialogue trees or to map to the same dialogue from multiple places.
    mappedOptions?: {
        [key: string]: TextScript
    }
    // The dialogue options in priority order.
    options: DialogueOption[],
}

type DialogueKey = 'streetVendor' | 'storageVanara';

// Node used for building the logical graph of the game used for randomization.
interface LogicNode {
    // The id of the zone this node is in
    zoneId: string
    // The id for this node, used for targeting it from other nodes.
    nodeId: string
    // The ids of any loot checks in this node.
    checks?: {
        // The id of the object that grants loot, could be a boss, chest or loot.
        objectId: string
        logic?: LogicCheck
    }[]
    complexNpcs?: {
        dialogueKey: DialogueKey
        optionKey: string
        logic?: LogicCheck
    }[]
    // During randomizer simulation, this flag will be set when on this node if it is in logic.
    // Flags associated with checks, bosses and NPCs are already handled, but additional flags
    // get set through various other interactions and can be modeled in logic with this.
    flags?: {
        flag: string
        logic?: LogicCheck
    }[]
    npcs?: {
        loot: DialogueLootDefinition
        logic?: LogicCheck
        progressFlags?: string[]
    }[]
    // Array of fixed paths to other logic nodes along with requirements for using them.
    paths?: {
        nodeId: string
        logic?: LogicCheck
        // If there is a door blocking this path that might be blocked, use the id instead
        // of specifying logic so that the logic can be based on the state of the door.
        doorId?: string
    }[],
    // Ids of any entrance objects
    entranceIds?: string[]
    // Ids of any exits along with logic requirements for using them. These ids are for objects
    // and the exits will point to entranceIds of objects in other nodes.
    exits?: {
        // The id of the object, which can be used to find connected nodes by finding the connected exit
        // and then finding the logic node with the corresponding entranceId.
        objectId: string
        logic?: LogicCheck
    }[]
}
