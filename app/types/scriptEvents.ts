import { Frame, GameState, LootData, ZoneLocation } from 'app/types';


// Defines a taunt an enemy can make as a text cue with parameters to control
// how often and when it can override other text cues.
export interface TextCueTaunt {
    text: string
    // Higher priority taunts can override lower priority text cues
    priority?: number
    // How long this cue should display.
    duration?: number
    // Can only be used once every this many milliseconds, defaults to 3000
    cooldown?: number
    // Can only be used this many times per encounter.
    limit?: number
}

export interface TextCueTauntInstance {
    definition: TextCueTaunt
    // Time until this taunt can be used again.
    cooldown: number
    // Number of times this was used
    timesUsed: number
}

export interface TextPage {
    textRows: string[]
    frames: Frame[][]
}

export interface ShowTextBoxScriptEvent {
    type: 'showTextBox'
    textPage: TextPage
}
export interface ClearTextBoxScriptEvent {
    type: 'clearTextBox'
}
// This event will cause a corresponding WaitActiveScriptEvent to be added to the active events.
// It is used to stop other events from happening until certain conditions are met.
// For example, to play a sequence of sound effects, simple wait events with short durations
// can be added between each PlaySoundScriptEvent to spread them out.
// In a tutorial event, the game can be frozen until the player presses a button indicated by
// the tutorial instructions.
// During a cut scene, active events can be run to perform simultaneous animations or other effects
// and a wait event can be added to delay the next script until all existing animations complete
export interface WaitScriptEvent {
    type: 'wait'
    // Whether or not to block field updates while this event is active.
    blockFieldUpdates?: boolean
    // If this is true player input will be blocked while this event is active.
    blockPlayerInput?: boolean
    // If defined, wait will end once this callback returns false.
    callback?: (state: GameState) => boolean
    // If this is set the event is cleared after duration milliseconds.
    duration?: number
    // Any game keys set here will clear this event.
    keys?: number[]
    // If this is true, this wait will be cleared once there are no active script events
    // between it and any other 'wait' events.
    waitingOnActiveEvents?: boolean
}
export type WaitActiveScriptEvent = WaitScriptEvent & {
    time: number
}
export interface ShowChoiceBoxScriptEvent {
    type: 'showChoiceBox'
    prompt?: string
    choices: {
        text: string
        key: string
    }[]
}
export type ShowChoiceBoxActiveScriptEvent = ShowChoiceBoxScriptEvent & {
    choiceIndex: number
}
export interface SetFlagScriptEvent {
    type: 'setFlag'
    flag: string
    value?: boolean | number | string
}
export interface CallbackScriptEvent {
    type: 'callback'
    callback: (state: GameState) => void
}
export interface ClearFlagScriptEvent {
    type: 'clearFlag'
    flag: string
}
export interface RefreshAreaLogicScriptEvent {
    type: 'refreshAreaLogic'
    // Perhaps define whether to use a transition here.
}
export interface GainLootScriptEvent {
    type: 'gainLoot'
    lootDefinition: LootData
}
export interface PlaySoundScriptEvent {
    type: 'playSound'
    sound: string
}
export interface RunDialogueScriptScriptEvent {
    type: 'runDialogueScript'
    // Dialogue is currently organized by npc
    npcKey: string
    // NPC Dialogue can map a key to a particular dialogue on the `mappedOptions` property.
    scriptKey: string
}

export interface AttemptPurchaseScriptEvent {
    type: 'attemptPurchase'
    cost: number
    // Instead of using string here, these could also be parsed arrays of ScriptEvents
    successScript: string
    failScript: string
}

export interface RestScriptEvent {
    type: 'rest'
}
export interface ScreenShakeScriptEvent {
    type: 'screenShake'
    dx: number
    dy: number
    duration: number
}
export interface StartScreenShakeScriptEvent {
    type: 'startScreenShake'
    dx: number
    dy: number
    id: string
}
export interface StopScreenShakeScriptEvent {
    type: 'stopScreenShake'
    id: string
}
export interface EnterLocationScriptEvent {
    type: 'enterLocation'
    location: ZoneLocation
}

export interface AddTextCueScriptEvent {
    type: 'addTextCue'
    text: string
}

export interface RemoveTextCueScriptEvent {
    type: 'removeTextCue'
}

export interface UpdateActiveScriptEvent {
    type: 'update'
    update: (state: GameState) => boolean
}

export type ScriptEvent
    = AddTextCueScriptEvent
    | AttemptPurchaseScriptEvent
    | CallbackScriptEvent
    | ClearFlagScriptEvent
    | ClearTextBoxScriptEvent
    | EnterLocationScriptEvent
    | GainLootScriptEvent
    | PlaySoundScriptEvent
    | RefreshAreaLogicScriptEvent
    | RemoveTextCueScriptEvent
    | RestScriptEvent
    | RunDialogueScriptScriptEvent
    | ScreenShakeScriptEvent
    | SetFlagScriptEvent
    | ShowChoiceBoxScriptEvent
    | ShowTextBoxScriptEvent
    | StartScreenShakeScriptEvent
    | StopScreenShakeScriptEvent
    | WaitScriptEvent
    ;

export type ActiveScriptEvent
    = UpdateActiveScriptEvent
    | ShowChoiceBoxActiveScriptEvent
    | WaitActiveScriptEvent
    ;
