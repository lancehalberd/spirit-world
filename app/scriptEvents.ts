import {dialogueHash} from 'app/content/dialogue/dialogueHash';
import {GAME_KEY} from 'app/gameConstants';
import {showMessagePage} from 'app/scenes/message/messageScene';
import {getCameraTarget} from 'app/utils/fixCamera';
import {allLootTypes} from 'app/utils/loot';
import {parseMessage, textScriptToString} from 'app/utils/parseMessage';


export function hideHUD(state: GameState, onSkipCutscene: (state: GameState) => void) {
    // hide HUD to show that player isn't controllable
    appendCallback(state, (state: GameState) => {
        state.hideHUD = true;
        state.scriptEvents.onSkipCutscene = onSkipCutscene;
    });
}

export function showHUD(state: GameState) {
    // show HUD to tell player that control of their character has returned
    appendCallback(state, (state: GameState) => {
        state.hideHUD = false;
    });
}

export function wait(state: GameState, duration: number) {
    state.scriptEvents.queue.push({
        type: 'wait',
        duration: 500,
        blockFieldUpdates: true,
    });
}

export function appendCallback(state: GameState, callback: (state: GameState) => void|boolean) {
    state.scriptEvents.queue.push({
        type: 'callback',
        callback,
    });
}

export function waitForARGameToFinish(state: GameState) {
    appendCallback(state, (state) => {
        state.scriptEvents.activeEvents.push({
            type: 'wait',
            time: 0,
            callback(state: GameState) {
                return state.arState.active;
            },
            blockPlayerUpdates: true,
        });
        // Make sure these block player/field updates as soon as this is appended and not on the next frame.
        state.scriptEvents.blockPlayerUpdates = true;
        // Make sure no other scripts are processed until this finishes.
        return true;
    });
}

export function runBlockingCallback(state: GameState, updateCallback: (state: GameState) => boolean) {
    appendCallback(state, (state) => {
        state.scriptEvents.activeEvents.push({
            type: 'update',
            update: updateCallback,
        });
        state.scriptEvents.activeEvents.push({
            type: 'wait',
            time: 0,
            waitingOnActiveEvents: true,
            blockFieldUpdates: true,
        });
        // Make sure these block field updates as soon as this is appended and not on the next frame.
        state.scriptEvents.blockFieldUpdates = true;
        // Make sure no other scripts are processed until this finishes.
        return true;
    });
}

export function runPlayerBlockingCallback(state: GameState, updateCallback: (state: GameState) => boolean) {
    appendCallback(state, (state) => {
        state.scriptEvents.activeEvents.push({
            type: 'update',
            update: updateCallback,
        });
        state.scriptEvents.activeEvents.push({
            type: 'wait',
            time: 0,
            waitingOnActiveEvents: true,
            blockPlayerUpdates: true,
        });
        // Make sure these block player/field updates as soon as this is appended and not on the next frame.
        state.scriptEvents.blockPlayerUpdates = true;
        state.scriptEvents.blockFieldUpdates = true;
        // Make sure no other scripts are processed until this finishes.
        return true;
    });
}

export function resetCamera(state: GameState) {
    appendCallback(state, (state) => {
        // Reset the camera back to its default target.
        delete state.scriptEvents.cameraTarget;
        // Wait to reset the camera speed until it has reached its default target again.
        waitForCamera(state);
        appendCallback(state, (state) => {
            delete state.camera.speed;
        });
        return true;
    });
}

export function waitForCamera(state: GameState) {
    appendCallback(state, (state) => {
        // Wait to reset the camera speed until it has reached its default target again.
        state.scriptEvents.activeEvents.push({
            type: 'update',
            update(state: GameState) {
                const cameraTarget = getCameraTarget(state);
                if (state.camera.x === cameraTarget.x && state.camera.y === cameraTarget.y) {
                    return false;
                }
                return true;
            },
        });
        state.scriptEvents.activeEvents.push({
            type: 'wait',
            time: 0,
            waitingOnActiveEvents: true,
            blockPlayerUpdates: true,
        });
        // Make sure these block player/field updates as soon as this is appended and not on the next frame.
        state.scriptEvents.blockPlayerUpdates = true;
        return true;
    });
}

// Clears all current script events and queues up events parsed from the new script.
export function setScript(state: GameState, script: TextScript): void {
    // console.log('setScript', script);
    state.scriptEvents.queue = parseEventScript(state, script);
    // console.log('setScript', [...state.scriptEvents.queue]);
    state.scriptEvents.activeEvents = [];
}

// Adds events parsed from the script to the front of the event queue.
export function prependScript(state: GameState, script: TextScript): void {
    state.scriptEvents.queue = [
        ...parseEventScript(state, script),
        ...state.scriptEvents.queue,
    ];
    // console.log('prependScript', [...state.scriptEvents.queue]);
}

export function appendScript(state: GameState, script: TextScript): void {
    state.scriptEvents.queue = [
        ...state.scriptEvents.queue,
        ...parseEventScript(state, script),
    ];
    // console.log('prependScript', [...state.scriptEvents.queue]);
}

export function textCueWithInput(state: GameState, text: string, duration?: number) {
    appendScript(state, `{addCue:${text}}`);
    waitForInput(state, duration);
    appendScript(state, `{removeCue}`);
}

export function waitForInput(state: GameState, duration = 0) {
    appendCallback(state, (state) => {
        state.scriptEvents.activeEvents.push({
            type: 'wait',
            time: duration,
            keys: [GAME_KEY.WEAPON, GAME_KEY.PASSIVE_TOOL, GAME_KEY.MENU],
            blockPlayerUpdates: true,
        });
        return true;
    });
}

export function followMessagePointer(state: GameState, pointer: string) {
    if (!pointer) {
        return;
    }
    const [dialogueKey, optionKey] = pointer.split('.');
    const dialogueSet = dialogueHash[dialogueKey];
    if (!dialogueSet) {
        console.error('Missing dialogue set', dialogueKey, pointer);
        return;
    }
    const randomizedScript = state.randomizerState?.items?.dialogueReplacements?.[dialogueKey]?.[optionKey];
    const script = randomizedScript ?? dialogueSet.mappedOptions[optionKey];
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

export function parseScriptText(state: GameState, text: TextScript, blockFieldUpdates = true): ShowTextBoxScriptEvent[] {
    const events: ShowTextBoxScriptEvent[] = [];
    const pages = parseMessage(state, text);
    if (pages.length) {
        events.push({
            type: 'showTextBox',
            textPages: pages,
            blockFieldUpdates,
        });
    }
    return events;
}

export function showMessage(
    state: GameState,
    message: TextScript,
): void {
    if (!message){
        return;
    }
    prependScript(state, textScriptToString(state, message));
}

// Shows a message box ignoring any additional scripting elements.
// This allows us to effectively show messages outside of contexts where scripts run, for example
// when showing messages from the inventory.
export function showSimpleMessage(
    state: GameState,
    message: TextScript,
): void {
    if (!message){
        return;
    }
    showMessagePage(state, parseScriptAsTextPages(state, textScriptToString(state, message)));
}

export function parseScriptAsTextPages(state: GameState, script: TextScript): TextPage[] {
    let textPages: TextPage[] = [];
    // Script is a bunch of text broken up by actions marked by brackets like `{weapon}`
    const textAndActions = textScriptToString(state, script).split(/[{}]/);
    while (textAndActions.length) {
        const text = textAndActions.shift();
        if (text) {
            const textEvents = parseScriptText(state, text);
            for (const event of textEvents) {
                textPages = [...textPages, ...event.textPages];
            }

        }
        // Skip any actions found in the text
        const actionToken = textAndActions.shift();
        if (actionToken && actionToken !== '|') {
            console.warn('Attempted to process a script as a simple message', script);
        }
    }
    return textPages;
}

export function parseScriptAsTextPage(state: GameState, script: TextScript): TextPage {
    const textPages = parseScriptAsTextPages(state, script);
    const textPage: TextPage = {
        textRows: [],
        frames: [],
    }
    for (const page of textPages) {
        textPage.textRows = [...textPage.textRows, ...page.textRows];
        textPage.frames = [...textPage.frames, ...page.frames];
    }
    return textPage;
}

export function parseEventScript(state: GameState, script: TextScript): ScriptEvent[] {
    let events: ScriptEvent[] = [];
    // Script is a bunch of text broken up by actions marked by brackets like `{weapon}`
    const textAndActions = textScriptToString(state, script).split(/[{}]/);
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
        if (actionToken === 'rest') {
            events.push({ type: 'rest' });
            continue;
        }
        if (actionToken === 'teleport') {
            events.push({
                type: 'enterLocation',
                location: {
                    ...state.location,
                    x: state.hero.x,
                    y: state.hero.y,
                    d: state.hero.d,
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
                const [text, key] = o.trim().split(':');
                return { text, key };
            })
            //console.log(prompt, choices);
            events.push({
                type: 'clearTextBox',
            });
            events.push({
                type: 'showChoiceBox',
                // We don't support multiple pages on the prompt, we just grow
                // it vertically.
                prompt: parseScriptAsTextPage(state, prompt),
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
                flag: flag.trim(),
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
                flag: flag.trim(),
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
        if (actionToken.startsWith('playTrack:')) {
            const track = actionToken.substring('playTrack:'.length) as TrackKey;
            events.push({
                type: 'playTrack',
                track: track,
            });
            continue;
        }
        if (actionToken.startsWith('stopTrack')) {
            events.push({
                type: 'stopTrack',
            });
            continue;
        }
        if (actionToken.startsWith('item:')) {
            const valueToken = actionToken.substring('item:'.length);
            const [lootType, amountOrLevel] = valueToken.split('=');
            if (!allLootTypes.includes(lootType as LootType)) {
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
                blockPlayerInput: true,
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
                blockPlayerInput: true,
                duration,
            });
            continue
        }
        if (actionToken.startsWith('timeout:')) {
            const valueToken = actionToken.substring('timeout:'.length);
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
    if (events.length) {
        //console.log('extra clear textbox');
        //console.log([...events]);
        // events.push({ type: 'clearTextBox' });
    }
    return events;
}
