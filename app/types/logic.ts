import { DialogueLootDefinition, StaffTowerLocation } from 'app/types';

export interface SimpleLogicCheck {
    operation?: 'isTrue' | 'isFalse'
    // This logic check is false unless all required flags are set.
    requiredFlags?: string[]
    // This logic check is false if any excluded flag is set.
    excludedFlags?: string[]
    // If this is set, this logic is false if the staff tower is in the player's inventory or if it's location
    // does not match the specified location.
    staffTowerLocation?: StaffTowerLocation
    // If this set is populated, this check is false if the current zone is not among the defined zones.
    // This is useful for restricting an NPCs dialogue to a particular area or set of areas.
    zones?: string[]
}

export interface LogicDefinition {
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

export interface AndLogicCheck {
    operation: 'and'
    logicChecks: LogicCheck[]
}

export interface OrLogicCheck {
    operation: 'or'
    logicChecks: LogicCheck[]
}

export type LogicCheck = SimpleLogicCheck | AndLogicCheck | OrLogicCheck;

export interface DialogueOption {
    // The logic that determines if this dialogue option is valid for the current game state.
    logicCheck: LogicCheck,
    // If this is set, this flag will be set once the player has finished this dialogue option.
    // Combining this with the same flag in `excludedFlags` will cause dialogue to occur no more than once
    // and should be used for dialogue that grants rewards to prevent giving the awards multiple times.
    progressFlag?: string,
    // If this flag is set, this dialogue will be shown if it is the first valid option found with this flag set.
    isExclusive?: boolean,
    // The set of dialogues that can occur when this option is chosen.
    text: string[],
    // If set, dialogue will return to this index after exhausting all options.
    repeatIndex?: number
    // Notes for development purposes.
    notes?: string,
}

export interface DialogueSet {
    // The identifier for this dialogue set, used to attach it to a particular NPC.
    key: string,
    // The dialogue options in priority order.
    options: DialogueOption[],
}

// Node used for building the logical graph of the game used for randomization.
export interface LogicNode {
    // The id of the zone this node is in
    zoneId: string
    // The id for this node, used for targeting it from other nodes.
    nodeId: string
    // The ids of any loot checks in this node.
    checks?: {
        // The id of the object that grants loot, could be a boss, chest, loot (eventually NPC).
        objectId: string
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
