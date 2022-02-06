import { Frame, LootData, ZoneLocation } from 'app/types';

export interface ShowTextBoxScriptEvent {
    type: 'showTextBox'
    textPage: Frame[][]
}
export interface ClearTextBoxScriptEvent {
    type: 'clearTextBox'
}
export interface WaitScriptEvent {
    type: 'wait'
    blockFieldUpdates?: boolean
    duration?: number
    keys?: number[]
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

export type ScriptEvent
    = AttemptPurchaseScriptEvent
    | ClearFlagScriptEvent
    | ClearTextBoxScriptEvent
    | EnterLocationScriptEvent
    | GainLootScriptEvent
    | PlaySoundScriptEvent
    | RefreshAreaLogicScriptEvent
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
    = ShowChoiceBoxActiveScriptEvent
    | WaitActiveScriptEvent
    ;
