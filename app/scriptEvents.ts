import {dialogueHash} from 'app/content/dialogue/dialogueHash';
import {showMessagePage} from 'app/scenes/message/messageScene';
import {getCameraTarget} from 'app/utils/fixCamera';
import {GAME_KEY} from 'app/gameConstants';
import {parseMessage, textScriptToString} from 'app/utils/parseMessage';
import {parseScriptEvents} from 'app/scenes/script/parseScriptEvents';


export function hideHUD(state: GameState, onSkipCutscene: (state: GameState) => void) {
    // hide HUD to show that player isn't controllable
    appendCallback(state, (state: GameState) => {
        state.hideHUD = true;
        state.cutscene.onSkipCutscene = onSkipCutscene;
    });
}

export function showHUD(state: GameState) {
    // show HUD to tell player that control of their character has returned
    appendCallback(state, (state: GameState) => {
        state.hideHUD = false;
        state.cutscene = {};
    });
}

export function wait(state: GameState, duration: number) {
    appendScriptEvents(state, [{
        type: 'wait',
        duration: 500,
        blocksUpdates: true,
    }]);
}
function noop() {}
// Schedules a callback to disable updates on the given set of targets.
export function appendDisableUpdatesForTargets(state: GameState, targets: Target[]) {
    appendCallback(state, (state: GameState) => {
        for (const target of targets) {
            if (target.update && target.update !== noop) {
                target.disabledUpdate = target.update;
                // If update is an instance method, running `delete target.update` will just restore it to the instance method,
                // so we need to assign something like a noop if we actually want to disable the function.
                target.update = noop;
            }
        }
    });
}
export function appendEnableUpdatesForTargets(state: GameState, targets: Target[]) {
    appendCallback(state, (state: GameState) => {
        for (const target of targets) {
            if (target.disabledUpdate) {
                target.update = target.disabledUpdate;
                delete target.disabledUpdate;
            }
        }
    });
}

// Append an event to the script queue that will run an update function blocking further script events in the queue until
// it returns false.
// This does not block updates or inputs for the reset of the scene stack.
export function appendScriptBlockingCallback(state: GameState, updateCallback: (state: GameState, scene: ScriptScene) => boolean) {
    appendCallback(state, (state: GameState, scene: ScriptScene) => {
        prependScriptEvents(state, [{
            type: 'update',
            update: updateCallback,
        },{
            type: 'wait',
            waitingOnActiveEvents: true,
        }]);
        // Make sure no other scripts are processed until this finishes.
        return true;
    });
}

// Append an event to the script queue that will run an update function blocking further script events in the queue until
// it returns false.
// This blocks updates for the rest of the scene stack entirely.
export function appendUpdateBlockingCallback(state: GameState, updateCallback: (state: GameState, scene: ScriptScene) => boolean) {
    appendCallback(state, (state: GameState, scene: ScriptScene) => {
        prependScriptEvents(state, [{
            type: 'update',
            update: updateCallback,
        },{
            type: 'wait',
            waitingOnActiveEvents: true,
            blocksUpdates: true,
        }]);
        // Make sure these block field updates as soon as this is appended and not on the next frame.
        scene.blocksUpdates = true;
        // Make sure no other scripts are processed until this finishes.
        return true;
    });
}

// Append an event to the script queue that will run an update function blocking further script events in the queue until
// it returns false.
// This blocks inputs to the rest of the scene stack.
export function appendInputBlockingCallback(state: GameState, updateCallback: (state: GameState) => boolean) {
    appendCallback(state, (state: GameState, scene: ScriptScene) => {
        // These new events will be processed immediately this frame
        // but the 'wait' action will prevent any further events from being processed.
        prependScriptEvents(state, [{
            type: 'update',
            update: updateCallback,
        },{
            type: 'wait',
            waitingOnActiveEvents: true,
            blocksInput: true,
        }], scene);
        // Make sure these block player/field updates as soon as this is appended and not on the next frame.
        scene.blocksInput = true;
    });
}

export function appendResetAndWaitForCamera(state: GameState) {
    appendCallback(state, (state: GameState, scene: ScriptScene) => {
        // Reset the camera back to its default target.
        delete state.cutscene.cameraTarget;
    });
    // Wait to reset the camera speed until it has reached its default target again.
    appendWaitForCamera(state);
    appendCallback(state, (state) => {
        delete state.camera.speed;
    });
}

export function appendWaitForCamera(state: GameState) {
    appendCallback(state, (state: GameState, scene: ScriptScene) => {
        // Wait to reset the camera speed until it has reached its default target again.
        prependScriptEvents(state, [{
            type: 'update',
            update(state: GameState, scene: ScriptScene) {
                const cameraTarget = getCameraTarget(state);
                if (state.camera.x === cameraTarget.x && state.camera.y === cameraTarget.y) {
                    return false;
                }
                return true;
            },
        },{
            type: 'wait',
            waitingOnActiveEvents: true,
            blocksInput: true,
        }], scene);
    });
}

export function parseScriptText(state: GameState, text: TextScript, blocksUpdates = true): ShowTextBoxScriptEvent[] {
    const events: ShowTextBoxScriptEvent[] = [];
    const pages = parseMessage(state, text);
    if (pages.length) {
        events.push({
            type: 'showTextBox',
            textPages: pages,
            blocksUpdates,
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


// All events to the front of the stack. These events may still be blocked by any active events in the current script scene.
// Applies to the given script scene or appends a new script scene to the stack if none is provided.
export function prependScriptEvents(state: GameState, scriptEvents: ScriptEvent[], scriptScene?: ScriptScene): void {
    if (!scriptScene) {
        scriptScene = window.newScriptScene();
        state.sceneStack.push(scriptScene);
    }
    scriptScene.queue = [
        ...scriptEvents,
        ...scriptScene.queue,
    ];
    // console.log('prependScript', [...state.scriptEvents.queue]);
}

// Parses a script and schedules it for immediate execution in the given script scene by prepending the parsed events.
export function prependScript(state: GameState, script: TextScript, scriptScene?: ScriptScene): void {
    prependScriptEvents(state, parseScriptEvents(state, script), scriptScene);
}

// Parses a script and schedules it for executation after existing script events complete.
// If no script scene is provided, it will attempt to reuse any existing script scenes so that existing
// events on those scenes will take precedence over the newly appended script.
export function appendScriptEvents(state: GameState, scriptEvents: ScriptEvent[], scriptScene?: ScriptScene): void {
    if (!scriptScene) {
        const topStackItem = state.sceneStack[state.sceneStack.length - 1];
        if (topStackItem.sceneType === 'script') {
            scriptScene = topStackItem as ScriptScene;
        } else {
            scriptScene = window.newScriptScene();
            state.sceneStack.push(scriptScene);
        }
    }
    scriptScene.queue = [
        ...scriptScene.queue,
        ...scriptEvents,
    ];
    // console.log('appendScript', [...state.scriptEvents.queue]);
}

export function appendScript(state: GameState, script: TextScript, scriptScene?: ScriptScene): void {
    appendScriptEvents(state, parseScriptEvents(state, script), scriptScene);
}

export function appendCallback(state: GameState, callback: (state: GameState, scene?: ScriptScene) => void|boolean, scriptScene?: ScriptScene) {
    appendScriptEvents(state, [{
        type: 'callback',
        callback,
    }], scriptScene);
}

export function appendBlockInput(state: GameState, duration: number) {
    appendScriptEvents(state, [{
        type: 'wait',
        blocksInput: true,
        duration,
    }]);
}

export function followMessagePointer(state: GameState, pointer: string, scriptScene?: ScriptScene) {
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
    prependScript(state, script, scriptScene);
}




function appendWaitForInput(state: GameState, duration = 0, scene?: ScriptScene) {
    appendCallback(state, (state: GameState, scene: ScriptScene) => {
        scene.activeEvents.push({
            type: 'wait',
            time: duration,
            keys: [GAME_KEY.WEAPON, GAME_KEY.PASSIVE_TOOL, GAME_KEY.MENU],
            blocksInput: true,
        });
        return true;
    }, scene);
    /*appendCallback(state, (state) => {
        const waitScene = new WaitScene();
        waitScene.startTime = state.time;
        waitScene.duration = duration;
        waitScene.keys = [GAME_KEY.WEAPON, GAME_KEY.PASSIVE_TOOL, GAME_KEY.MENU];
        waitScene.blocksInput = true;
        return true;
    });*/
}

export function appendTextCueWithInput(state: GameState, text: string, duration?: number, scene?: ScriptScene) {
    appendScript(state, `{addCue:${text}}`, scene);
    appendWaitForInput(state, duration, scene);
    appendScript(state, `{removeCue}`, scene);
}
