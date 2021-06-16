import { StaffTowerLocation } from 'app/types';

export interface LogicCheck {
    // This logic check is false unless all required flags are set.
    requiredFlags: string[],
    // This logic check is false if any excluded flag is set.
    excludedFlags: string[],
    // If this is set, this logic is false if the staff tower is in the player's inventory or if it's location
    // does not match the specified location.
    staffTowerLocation?: StaffTowerLocation,
    // If this set is populated, this check is false if the current zone is not among the defined zones.
    // This is useful for restricting an NPCs dialogue to a particular area or set of areas.
    zones?: string[],
}


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
