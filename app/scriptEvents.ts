import {
    addEffectToArea,
    enterLocation,
    removeEffectFromArea,
    refreshAreaLogic,
} from 'app/content/areas';
import { TextCue } from 'app/content/effects/textCue';
import { dialogueHash } from 'app/content/dialogue/dialogueHash';
import { getLoot } from 'app/content/objects/lootObject';
import { getLootTypes } from 'app/development/objectEditor';
import { GAME_KEY } from 'app/gameConstants';

import { wasConfirmKeyPressed, wasGameKeyPressed } from 'app/keyCommands';
import { parseMessage, showMessage } from 'app/render/renderMessage';
import { playSound } from 'app/musicController';
import { saveGame } from 'app/state';

import {
    ActiveScriptEvent, Frame, GameState, LootType, ScriptEvent,
} from 'app/types';

// Clears all current script events and queues up events parsed from the new script.
export function setScript(state: GameState, script: string): void {
    // console.log('setScript', script);
    state.scriptEvents.queue = parseEventScript(state, script);
    // console.log('setScript', [...state.scriptEvents.queue]);
    state.scriptEvents.activeEvents = [];
}

// Adds events parsed from the script to the front of the event queue.
export function prependScript(state: GameState, script: string): void {
    state.scriptEvents.queue = [
        ...parseEventScript(state, script),
        ...state.scriptEvents.queue,
    ];
    // console.log('prependScript', [...state.scriptEvents.queue]);
}

export function parseScriptText(state: GameState, text: string, duration: number = 0, blockFieldUpdates = true): ScriptEvent[] {
    const events: ScriptEvent[] = [];
    const pages = parseMessage(state, text) as Frame[][][];
    for (const page of pages) {
        events.push({
            type: 'showTextBox',
            textPage: page,
        });
        events.push({
            type: 'wait',
            blockFieldUpdates,
            duration,
            keys: [GAME_KEY.WEAPON, GAME_KEY.PASSIVE_TOOL, GAME_KEY.MENU],
        });
    }
    return events;
}

export function parseEventScript(state: GameState, script: string): ScriptEvent[] {
    let events: ScriptEvent[] = [];
    // Script is a bunch of text broken up by actions marked by brackets like `{weapon}`
    const textAndActions = script.split(/[{}]/);
    while (textAndActions.length) {
        const text = textAndActions.shift();
        if (text) {
            const textEvents = parseScriptText(state, text);
            events = [...events, ...textEvents];
        }
        const actionToken = textAndActions.shift();
        if (!actionToken) {
            continue;
        }
        // This is just used to split text dialogue up, which happens automatically
        // for any action tokens now.
        if (actionToken === '|') {
            continue;
        }
        if (actionToken[0] === '@') {
            const [npcKey, scriptKey] = actionToken.substring(1).split('.');
            events.push({
                type: 'runDialogueScript',
                npcKey, scriptKey,
            });
            continue;
        }
        if (actionToken === 'craftNormalRange') {
            if (state.hero.silverOre < 2) {
                showMessage(state, `I'll need at least 2 Silver Ore to upgrade your range.`);
                continue;
            }
            if (state.hero.money < 100) {
                events.push({
                    type: 'runDialogueScript',
                    npcKey: 'citySmith',
                    scriptKey:'fail'
                });
                continue;
            }
            state.hero.silverOre -= 2;
            state.hero.money -= 100;
            state.hero.weaponUpgrades.normalRange = true;
            showMessage(state, `Excellent! Your Chakram is faster than ever!`);
            saveGame();
            continue;
        }
        if (actionToken === 'craftNormalDamage') {
            if (state.hero.silverOre < 3) {
                showMessage(state, `I'll need at least 3 Silver Ore to upgrade your damage.`);
                continue;
            }
            if (state.hero.money < 100) {
                events.push({
                    type: 'runDialogueScript',
                    npcKey: 'citySmith',
                    scriptKey:'fail'
                });
                continue;
            }
            state.hero.silverOre -= 3;
            state.hero.money -= 100;
            state.hero.weaponUpgrades.normalDamage = true;
            showMessage(state, `Excellent! Your Chakram is more powerful than ever!`);
            saveGame();
            continue;
        }
        if (actionToken === 'craftSpiritRange') {
            if (state.hero.goldOre < 1) {
                showMessage(state, `I'll need some Gold Ore to upgrade your range.`);
                continue;
            }
            if (state.hero.silverOre < 2) {
                showMessage(state, `I'll need at least 2 Silver Ore to upgrade your range.`);
                continue;
            }
            if (state.hero.money < 200) {
                events.push({
                    type: 'runDialogueScript',
                    npcKey: 'forgeSmith',
                    scriptKey:'fail'
                });
                continue;
            }
            state.hero.goldOre -= 1;
            state.hero.silverOre -= 2;
            state.hero.money -= 200;
            state.hero.weaponUpgrades.normalRange = true;
            showMessage(state, `Excellent! Your Chakram is faster than ever!`);
            saveGame();
            continue;
        }
        if (actionToken === 'craftSpiritDamage') {
            if (state.hero.goldOre < 1) {
                showMessage(state, `I'll need some Gold Ore to upgrade your range.`);
                continue;
            }
            if (state.hero.silverOre < 3) {
                showMessage(state, `I'll need at least 3 Silver Ore to upgrade your damage.`);
                continue;
            }
            if (state.hero.money < 200) {
                events.push({
                    type: 'runDialogueScript',
                    npcKey: 'forgeSmith',
                    scriptKey:'fail'
                });
                continue;
            }
            state.hero.goldOre -= 1;
            state.hero.silverOre -= 3;
            state.hero.money -= 200;
            state.hero.weaponUpgrades.normalDamage = true;
            showMessage(state, `Excellent! Your Chakram is more powerful than ever!`);
            saveGame();
            continue;
        }
        if (actionToken === 'rest') {
            events.push({ type: 'rest' });
            continue;
        }
        if (actionToken === 'teleport') {
            const hero = state.hero.activeClone || state.hero;
            events.push({
                type: 'enterLocation',
                location: {
                    ...state.location,
                    x: hero.x,
                    y: hero.y,
                    d: hero.d,
                    isSpiritWorld: !state.location.isSpiritWorld,
                },
            });
            continue;
        }
        // {screenShake:2:0:2200}
        if (actionToken.startsWith('screenShake:')) {
            const paramToken = actionToken.substring('screenShake:'.length);
            const [dx, dy, duration] = paramToken.split(':').map(Number);
            events.push({ type: 'screenShake', dx, dy, duration });
            continue;
        }
        if (actionToken.startsWith('startScreenShake:')) {
            const paramToken = actionToken.substring('startScreenShake:'.length);
            const [dx, dy, id] = paramToken.split(':');
            events.push({ type: 'startScreenShake', dx: Number(dx), dy: Number(dy), id });
            continue;
        }
        if (actionToken.startsWith('stopScreenShake:')) {
            const id = actionToken.substring('stopScreenShake:'.length);
            events.push({ type: 'stopScreenShake', id });
            continue;
        }
        if (actionToken.startsWith('addCue:')) {
            const text = actionToken.substring('addCue:'.length);
            events.push({ type: 'addTextCue', text });
            continue;
        }
        if (actionToken === 'removeCue') {
            events.push({ type: 'removeTextCue' });
            continue;
        }
        if (actionToken.startsWith('choice:')) {
            const choiceToken = actionToken.substring('choice:'.length);
            //console.log(choiceToken);
            const [prompt, ...optionStrings] = choiceToken.split('|');
            const choices = optionStrings.map(o => {
                const [text, key] = o.split(':');
                return { text, key };
            })
            //console.log(prompt, choices);
            events.push({
                type: 'clearTextBox',
            });
            events.push({
                type: 'showChoiceBox',
                prompt,
                choices,
            });
            continue;
        }
        if (actionToken.startsWith('flag:')) {
            const valueToken = actionToken.substring('flag:'.length);
            const [flag, value] = valueToken.split('=');
            const valueNumber = parseInt(value, 10);
            events.push({
                type: 'setFlag',
                flag,
                value: isNaN(valueNumber) ? (value || true) : valueNumber,
            });
            events.push({
                type: 'refreshAreaLogic',
            });
            continue;
        }
        if (actionToken.startsWith('clearFlag:')) {
            const flag = actionToken.substring('clearFlag:'.length);
            events.push({
                type: 'clearFlag',
                flag,
            });
            events.push({
                type: 'refreshAreaLogic',
            });
            continue;
        }
        if (actionToken.startsWith('clearTextBox')) {
            events.push({
                type: 'clearTextBox',
            });
            continue;
        }
        if (actionToken.startsWith('playSound:')) {
            const sound = actionToken.substring('playSound:'.length);
            events.push({
                type: 'playSound',
                sound,
            });
            continue;
        }
        if (actionToken.startsWith('item:')) {
            const valueToken = actionToken.substring('item:'.length);
            const [lootType, amountOrLevel] = valueToken.split('=');
            if (!getLootTypes().includes(lootType as LootType)) {
                throw new Error('Unknown loot type: ' + lootType);
            }
            const number = parseInt(amountOrLevel, 10);
            events.push({ type: 'clearTextBox' });
            events.push({
                type: 'gainLoot',
                lootDefinition: {
                    lootType: lootType as LootType,
                    lootLevel: isNaN(number) ? 0 : number,
                    lootAmount: isNaN(number) ? 0 : number,
                },
            });
            events.push({
                type: 'wait',
                // This must be long enough to let the get loot animation reach
                // adding the loot message to the front of the script queue.
                duration: 1000,
            });
            continue
        }
        if (actionToken.startsWith('buy:')) {
            const valueToken = actionToken.substring('buy:'.length);
            const [cost, successScript, failScript] = valueToken.split(':');
            events.push({
                type: 'attemptPurchase',
                cost: parseInt(cost, 10),
                successScript,
                failScript,
            });
            continue;
        }
        if (actionToken.startsWith('wait:')) {
            const valueToken = actionToken.substring('wait:'.length);
            let duration = parseInt(valueToken, 10);
            if (isNaN(duration)) {
                duration = 1000;
            }
            events.push({
                type: 'wait',
                duration,
            });
            continue
        }
        console.error('Unhandled action token', actionToken);
    }
    events.push({ type: 'clearTextBox' });
    return events;
}

export const updateScriptEvents = (state: GameState): void => {
    state.scriptEvents.blockEventQueue = false;
    state.scriptEvents.blockFieldUpdates = false;
    state.scriptEvents.handledInput = false;
    const activeEvents: ActiveScriptEvent[] = [];
    for (const event of state.scriptEvents.activeEvents) {
        switch (event.type) {
            case 'wait': {
                if (event.duration && state.time - event.time >= event.duration) {
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
                if (!finished) {
                    state.scriptEvents.blockEventQueue = true;
                    if (event.blockFieldUpdates) {
                        state.scriptEvents.blockFieldUpdates = true;
                    }
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
    }
    state.scriptEvents.activeEvents = activeEvents;
    // Do not process the event queue if there is an active blocking event.
    if (state.scriptEvents.blockEventQueue) {
        return;
    }
    while (state.scriptEvents.queue.length) {
        const event = state.scriptEvents.queue.shift();
        //console.log('Running event', event.type, event);
        switch (event.type) {
            case 'wait':
                state.scriptEvents.activeEvents.push({
                    ...event,
                    time: state.time,
                });
                if (event.blockFieldUpdates) {
                    state.scriptEvents.blockFieldUpdates = true;
                }
                return;
            case 'screenShake':
                state.screenShakes.push({
                    dx: event.dx,
                    dy: event.dy,
                    startTime: state.fieldTime,
                    endTime: state.fieldTime + event.duration,
                });
                return;
            case 'startScreenShake':
                state.screenShakes.push({
                    dx: event.dx,
                    dy: event.dy,
                    startTime: state.fieldTime,
                    id: event.id,
                });
                return;
            case 'stopScreenShake': {
                const index = state.screenShakes.findIndex(screenShake => screenShake.id === event.id);
                if (index >= 0) {
                    state.screenShakes.splice(index, 1);
                } else {
                    console.error(`screenShake id not found: ${event.id}`, state.screenShakes);
                }
                return;
            }
            case 'addTextCue': {
                removeTextCue(state);
                addEffectToArea(state, state.areaInstance, new TextCue(state, {
                    duration: 0,
                    text: event.text,
                }));
                return;
            }
            case 'removeTextCue': {
                removeTextCue(state);
                return;
            }
            case 'showChoiceBox':
                // Text cues and text choice cannot be displayed together, so dismiss any text cues.
                removeTextCue(state);
                state.scriptEvents.activeEvents.push({
                    ...event,
                    choiceIndex: 0,
                });
                state.scriptEvents.blockFieldUpdates = true;
                return;
            case 'showTextBox':
                // Text cues and text box cannot be displayed together, so dismiss any text cues.
                removeTextCue(state);
                state.messagePage = event.textPage;
                break;
            case 'clearTextBox':
                state.messagePage = null;
                break;
            case 'clearFlag':
                delete state.savedState.objectFlags[event.flag];
                refreshAreaLogic(state, state.areaInstance);
                refreshAreaLogic(state, state.areaInstance.alternateArea);
                saveGame();
                break;
            case 'setFlag':
                state.savedState.objectFlags[event.flag] = event.value;
                refreshAreaLogic(state, state.areaInstance);
                refreshAreaLogic(state, state.areaInstance.alternateArea);
                saveGame();
                break;
            case 'refreshAreaLogic':
                refreshAreaLogic(state, state.areaInstance);
                refreshAreaLogic(state, state.areaInstance.alternateArea);
                break;
            case 'gainLoot':
                getLoot(state, {type: 'dialogueLoot', ...event.lootDefinition});
                // Don't continue processing events until the loot gives up priority.
                return;
            case 'playSound':
                playSound(event.sound);
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
                return;
            case 'attemptPurchase':
                if (event.cost <= state.hero.money) {
                    state.hero.money -= event.cost;
                    followMessagePointer(state, event.successScript);
                } else {
                    followMessagePointer(state, event.failScript);
                }
                // Since this overwrites remaining events, don't continue processing events this frame.
                return;
            case 'rest':
                state.transitionState = {
                    callback() {
                        state.hero.life = state.hero.maxLife;
                    },
                    nextLocation: state.location,
                    time: 0,
                    type: 'fade',
                };
                return;
            case 'enterLocation':
                enterLocation(state, event.location, false);
                break;
        }
    }
}
export function removeTextCue(state: GameState) {
    if (!state.areaInstance) {
        return;
    }
    const effect = state.areaInstance.effects.find(
        effect => effect instanceof TextCue
    );
    if (effect) {
        removeEffectFromArea(state, effect);
    }
}

function followMessagePointer(state: GameState, pointer) {
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
    prependScript(state, script);
}
