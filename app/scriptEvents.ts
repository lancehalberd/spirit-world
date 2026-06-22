import {showMessagePage} from 'app/scenes/message/messageScene';
import {appendCallback, appendScriptEvents, prependScript} from 'app/scenes/script/scriptScene';
import {getCameraTarget} from 'app/utils/fixCamera';
import {parseMessage, textScriptToString} from 'app/utils/parseMessage';


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
    });
}

export function wait(state: GameState, duration: number) {
    appendScriptEvents(state, [{
        type: 'wait',
        duration: 500,
        blocksUpdates: true,
    }]);
}

export function runBlockingCallback(state: GameState, updateCallback: (state: GameState, scene: ScriptScene) => boolean) {
    appendCallback(state, (state: GameState, scene: ScriptScene) => {
        scene.activeEvents.push({
            type: 'update',
            update: updateCallback,
        });
        scene.activeEvents.push({
            type: 'wait',
            time: 0,
            waitingOnActiveEvents: true,
            blocksUpdates: true,
        });
        // Make sure these block field updates as soon as this is appended and not on the next frame.
        scene.blocksUpdates = true;
        // Make sure no other scripts are processed until this finishes.
        return true;
    });
}

export function runPlayerBlockingCallback(state: GameState, updateCallback: (state: GameState) => boolean) {
    appendCallback(state, (state: GameState, scene: ScriptScene) => {
        scene.activeEvents.push({
            type: 'update',
            update: updateCallback,
        });
        scene.activeEvents.push({
            type: 'wait',
            time: 0,
            waitingOnActiveEvents: true,
            blocksInput: true,
        });
        // Make sure these block player/field updates as soon as this is appended and not on the next frame.
        state.cutscene.blockPlayerUpdates = true;
        scene.blocksUpdates = true;
        // Make sure no other scripts are processed until this finishes.
        return true;
    });
}

export function resetCamera(state: GameState) {
    appendCallback(state, (state: GameState, scene: ScriptScene) => {
        // Reset the camera back to its default target.
        delete state.cutscene.cameraTarget;
        // Wait to reset the camera speed until it has reached its default target again.
        waitForCamera(state);
        appendCallback(state, (state) => {
            delete state.camera.speed;
        });
        return true;
    });
}

export function waitForCamera(state: GameState) {
    appendCallback(state, (state: GameState, scene: ScriptScene) => {
        // Wait to reset the camera speed until it has reached its default target again.
        scene.activeEvents.push({
            type: 'update',
            update(state: GameState, scene: ScriptScene) {
                scene.blocksInput = true;
                const cameraTarget = getCameraTarget(state);
                if (state.camera.x === cameraTarget.x && state.camera.y === cameraTarget.y) {
                    return false;
                }
                return true;
            },
        });
        scene.activeEvents.push({
            type: 'wait',
            time: 0,
            waitingOnActiveEvents: true,
            blocksInput: true,
        });
        // Make sure this blocks player/field updates as soon as this is appended and not on the next frame.
        scene.blocksInput = true;
        return true;
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
