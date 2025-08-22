import { addTextCue, removeTextCue } from 'app/content/effects/textCue';
import { dialogueHash } from 'app/content/dialogue/dialogueHash';
import { getLoot } from 'app/content/objects/lootObject';
import { GAME_KEY } from 'app/gameConstants';
import { prependScript } from 'app/scriptEvents';

import { wasConfirmKeyPressed, wasGameKeyPressed } from 'app/userInput';
import { playSound } from 'app/utils/sounds';
import { enterLocation } from 'app/utils/enterLocation';
import { clearObjectFlag, setObjectFlag } from 'app/utils/objectFlags';
import { saveGame } from 'app/utils/saveGame';


export function skipCutscene(state: GameState) {
    state.scriptEvents.queue = [];
    state.scriptEvents.activeEvents = [];
    delete state.scriptEvents.overrideMusic;
    state.hideHUD = false;
    delete state.hero.action;
    state.messagePage = null;
    state.scriptEvents.onSkipCutscene?.(state);
    delete state.scriptEvents.onSkipCutscene;
    delete state.scriptEvents.cameraTarget;
    delete state.camera.speed;
}

export function updateScriptEvents(state: GameState): void {
    state.scriptEvents.blockEventQueue = false;
    state.scriptEvents.blockFieldUpdates = false;
    state.scriptEvents.blockPlayerInput = false;
    state.scriptEvents.blockPlayerUpdates = false;
    state.scriptEvents.handledInput = false;
    const activeEvents: ActiveScriptEvent[] = [];
    let activeEventCountSinceLastWaitEvent = 0;
    if (state.hideHUD && wasGameKeyPressed(state, GAME_KEY.MENU) && state.scriptEvents.onSkipCutscene) {
        if ((state.scriptEvents.skipTime ?? 0) + 2000 > state.time) {
            skipCutscene(state);
        } else {
            state.scriptEvents.skipTime = state.time;
        }
    }
    for (const event of state.scriptEvents.activeEvents) {
        switch (event.type) {
            case 'update': {
                // This event will continue running until the update returns false.
                if (event.update(state)) {
                    activeEvents.push(event);
                }
                break;
            }
            case 'wait': {
                if (event.duration && state.time - event.time >= event.duration) {
                    break;
                }
                if (event.waitingOnActiveEvents && !activeEventCountSinceLastWaitEvent) {
                    break;
                }
                if (event.callback && !event.callback(state)) {
                    break;
                }
                let finished = false;
                for (const gameKey of (event.keys || [])) {
                    if (wasGameKeyPressed(state, gameKey)) {
                        finished = true;
                        state.scriptEvents.handledInput = true;
                        break;
                    }
                }
                if (event.blockPlayerInput) {
                    state.scriptEvents.blockPlayerInput = true;
                }
                if (event.blockPlayerUpdates) {
                    state.scriptEvents.blockPlayerUpdates = true;
                }
                if (event.blockFieldUpdates) {
                    state.scriptEvents.blockFieldUpdates = true;
                }
                if (!finished) {
                    state.scriptEvents.blockEventQueue = true;
                    activeEvents.push(event);
                }
                break;
            }
            case 'showChoiceBox':
                if (wasConfirmKeyPressed(state)) {
                    const option = event.choices[event.choiceIndex];
                    followMessagePointer(state, option.key);
                    state.scriptEvents.handledInput = true;
                    break;
                }
                const optionCount = event.choices.length;
                if (wasGameKeyPressed(state, GAME_KEY.UP)) {
                    event.choiceIndex = (event.choiceIndex + optionCount - 1) % optionCount;
                    state.scriptEvents.handledInput = true;
                } else if (wasGameKeyPressed(state, GAME_KEY.DOWN)) {
                    event.choiceIndex = (event.choiceIndex + 1) % optionCount;
                    state.scriptEvents.handledInput = true;
                }
                state.scriptEvents.blockEventQueue = true;
                state.scriptEvents.blockFieldUpdates = true;
                activeEvents.push(event);
                break;
        }
        if (event.type !== 'wait') {
            activeEventCountSinceLastWaitEvent++;
        } else {
            activeEventCountSinceLastWaitEvent = 0;
        }
    }
    state.scriptEvents.activeEvents = activeEvents;
    // Do not process the event queue if there is an active blocking event.
    while (!state.scriptEvents.blockEventQueue && state.scriptEvents.queue.length) {
        const event = state.scriptEvents.queue.shift();
        //console.log('Running event', event.type, event);
        switch (event.type) {
            case 'callback':
                if (event.callback(state)) {
                    state.scriptEvents.blockEventQueue = true;
                }
                break;
            case 'wait':
                state.scriptEvents.activeEvents.push({
                    ...event,
                    time: state.time,
                });
                if (event.blockFieldUpdates) {
                    state.scriptEvents.blockFieldUpdates = true;
                }
                if (event.blockPlayerInput) {
                    state.scriptEvents.blockPlayerInput = true;
                }
                if (event.blockPlayerUpdates) {
                    state.scriptEvents.blockPlayerUpdates = true;
                }
                state.scriptEvents.blockEventQueue = true;
                break;
            case 'screenShake':
                state.screenShakes.push({
                    dx: event.dx,
                    dy: event.dy,
                    startTime: state.fieldTime,
                    endTime: state.fieldTime + event.duration,
                });
                break;
            case 'startScreenShake':
                state.screenShakes.push({
                    dx: event.dx,
                    dy: event.dy,
                    startTime: state.fieldTime,
                    id: event.id,
                });
                break;
            case 'stopScreenShake': {
                const index = state.screenShakes.findIndex(screenShake => screenShake.id === event.id);
                if (index >= 0) {
                    state.screenShakes.splice(index, 1);
                } else {
                    console.error(`screenShake id not found: ${event.id}`, state.screenShakes);
                }
                break;
            }
            case 'addTextCue': {
                addTextCue(state, event.text, 0, 0);
                break;
            }
            case 'removeTextCue': {
                removeTextCue(state);
                break;
            }
            case 'showChoiceBox':
                // Text cues and text choice cannot be displayed together, so dismiss any text cues.
                removeTextCue(state);
                state.scriptEvents.activeEvents.push({
                    ...event,
                    choiceIndex: 0,
                });
                state.scriptEvents.blockFieldUpdates = true;
                state.scriptEvents.blockEventQueue = true;
                break;
            case 'showTextBox':
                // Text cues and text box cannot be displayed together, so dismiss any text cues.
                removeTextCue(state);
                state.messagePage = {
                    ...event.textPage,
                    lineIndex: 0,
                    animationTime: 0,
                };
                break;
            case 'clearTextBox':
                state.messagePage = null;
                break;
            case 'clearFlag':
                clearObjectFlag(state, event.flag);
                saveGame(state);
                break;
            case 'setFlag':
                setObjectFlag(state, event.flag, event.value);
                saveGame(state);
                break;
            case 'refreshAreaLogic':
                state.areaInstance.needsLogicRefresh = true;
                break;
            case 'gainLoot':
                getLoot(state, {type: 'dialogueLoot', ...event.lootDefinition});
                // Don't continue processing events until the loot gives up priority.
                state.scriptEvents.blockEventQueue = true;
                break;
            case 'playSound':
                playSound(event.sound);
                break;
            case 'playTrack':
                state.scriptEvents.overrideMusic = event.track;
                break;
            // This doesn't stop the BGM, it reverts back to the default BGM.
            case 'stopTrack':
                delete state.scriptEvents.overrideMusic;
                break;
            case 'runDialogueScript':
                const dialogueSet = dialogueHash[event.npcKey];
                if (!dialogueSet) {
                    console.error('Missing dialogue set', event.npcKey, dialogueSet);
                    return;
                }
                const script = dialogueSet.mappedOptions[event.scriptKey];
                prependScript(state, script);
                // Since this overwrites remaining events, don't continue processing events this frame.
                state.scriptEvents.blockEventQueue = true;
                // Block the player input so that the player doesn't move during the frame the event queue is blocked.
                state.scriptEvents.blockPlayerInput = true;
                break;
            case 'attemptPurchase':
                if (event.cost <= state.hero.savedData.money) {
                    state.hero.savedData.money -= event.cost;
                    followMessagePointer(state, event.successScript);
                } else {
                    followMessagePointer(state, event.failScript);
                }
                // Since this overwrites remaining events, don't continue processing events this frame.
                state.scriptEvents.blockEventQueue = true;
                break;
            case 'rest':
                state.transitionState = {
                    callback() {
                        state.hero.life = state.hero.savedData.maxLife;
                    },
                    nextLocation: state.location,
                    time: 0,
                    type: 'fade',
                };
                state.scriptEvents.blockEventQueue = true;
                break;
            case 'enterLocation':
                enterLocation(state, event.location);
                state.scriptEvents.blockPlayerInput = true;
                state.scriptEvents.blockEventQueue = true;
                break;
        }
    }
}

function followMessagePointer(state: GameState, pointer: string) {
    if (!pointer) {
        return;
    }
    const [dialogueKey, optionKey] = pointer.split('.');
    const dialogueSet = dialogueHash[dialogueKey];
    if (!dialogueSet) {
        console.error('Missing dialogue set', dialogueKey, pointer);
        return;
    }
    const script = dialogueSet.mappedOptions[optionKey];
    // Empty string script does nothing.
    if (script === '') {
        return;
    }
    if (!script) {
        console.error('Missing dialogue option',  dialogueSet.mappedOptions, optionKey);
        return;
    }
    prependScript(state, script);
}
