import {addTextCue, removeTextCue} from 'app/content/effects/textCue';
import {dialogueHash} from 'app/content/dialogue/dialogueHash';
import {getLoot} from 'app/content/objects/lootObject';
import {GAME_KEY} from 'app/gameConstants';
import {showChoiceScene} from 'app/scenes/choice/showChoiceScene';
import {hideMessagePage, showMessagePage, updateSkipCutscene} from 'app/scenes/message/messageScene';
import {parseScriptEvents} from 'app/scenes/script/parseScriptEvents';
import {isSceneTypeInStack} from 'app/scenes/sceneHash';
import {wasGameKeyPressed} from 'app/userInput';
import {enterLocation} from 'app/utils/enterLocation';
import {removeElementFromArray} from 'app/utils/index';
import {clearObjectFlag, setObjectFlag} from 'app/utils/objectFlags';
import {saveGame} from 'app/utils/saveGame';
import {playSound, playTrack} from 'app/utils/sounds';

/*class CallbackScene implements GameScene {
    callback: (state: GameState, scene: CallbackScene) => boolean
    update(state: GameState, interactive: boolean) {
        // This event will continue running until the update returns false.
        if (!this.callback(state, this)) {
            removeElementFromArray(state.sceneStack, this);

        }
    }
}*/

/*class WaitScene implements GameScene {
    blocksInput = false;
    blocksUpdates = false;
    duration: number = 0;
    startTime: number = 0;
    keys: number[] = [];
    onComplete: (state: GameState) => void
    removeScene(state: GameState) {
        removeElementFromArray(state.sceneStack, this);
        this.onComplete?.(state);
    }
    update(state: GameState, interactive: boolean) {
        // This event will continue running until the update returns false.
        if (this.duration && state.time - this.startTime >= this.duration) {
            return this.removeScene(state);
        }
        //if (event.waitingOnActiveEvents && !activeEventCountSinceLastWaitEvent) {
        //    return this.removeScene(state);
        //}
        //if (event.callback && !event.callback(state)) {
        //    break;
        //}
        for (const gameKey of (this.keys || [])) {
            if (wasGameKeyPressed(state, gameKey)) {
                // We always block input on the same frame input was handled by the script.
                // Note that this should still apply this frame even though the scene is removed
                // from the stack because it is already being processed this frame.
                this.blocksInput = true;
                return this.removeScene(state);
            }
        }
    }
    // TODO: Not sure what to do with this one yet, should review all examples that use this.
    // If this is true, this wait will be cleared once there are no active script events
    // between it and any other 'wait' events.
    // waitingOnActiveEvents?: boolean
    // TODO: Probably going to move this to CallbackScene instead
    // If defined, wait will end once this callback returns false.
    //callback?: (state: GameState) => boolean
}*/


export function appendWaitForInput(state: GameState, duration = 0, scene?: ScriptScene) {
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

export class ScriptScene implements GameScene {
    sceneType = 'script';
    paused = false;
    blocksInput = false;
    blocksUpdates = false;
    activeEvents: ActiveScriptEvent[] = [];
    queue: ScriptEvent[] = [];
    overrideMusic?: TrackKey;
    removeScene(state: GameState) {
        removeElementFromArray(state.sceneStack, this);
    }
    update(state: GameState, interactive: boolean) {
        this.blocksInput = false;
        this.blocksUpdates = false;
        const currentActiveEvents = this.activeEvents;
        this.activeEvents = [];
        let activeEventCountSinceLastWaitEvent = 0;
        let blockEventQueue = false;
        updateSkipCutscene(state, this);
        for (const event of currentActiveEvents) {
            switch (event.type) {
                case 'update': {
                    // This event will continue running until the update returns false.
                    if (event.update(state, this)) {
                        this.activeEvents.push(event);
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
                    if (event.callback && !event.callback(state, state.time - event.time)) {
                        break;
                    }
                    let finished = false;
                    for (const gameKey of (event.keys || [])) {
                        if (wasGameKeyPressed(state, gameKey)) {
                            finished = true;
                            // We always block input on the same frame input was handled by the script.
                            this.blocksInput = true;
                            break;
                        }
                    }
                    if (event.blocksInput) {
                        this.blocksInput = true;
                    }
                    if (event.blocksUpdates) {
                        this.blocksUpdates = true;
                    }
                    if (!finished) {
                        blockEventQueue = true;
                        this.activeEvents.push(event);
                    }
                    break;
                }
            }
            if (event.type !== 'wait') {
                activeEventCountSinceLastWaitEvent++;
            } else {
                activeEventCountSinceLastWaitEvent = 0;
            }
        }
        // Do not process the event queue if there is an active blocking event.
        while (!blockEventQueue && this.queue.length) {
            const event = this.queue.shift();
            //console.log('Running event', event.type, event);
            switch (event.type) {
                case 'callback':
                    if (event.callback(state)) {
                        // Don't process the rest of the queue as long as callback
                        // returns a truthy value.
                        return;
                    }
                    break;
                case 'update':
                    this.activeEvents.push({
                        ...event,
                        time: state.time,
                    });
                    break;
                case 'wait':
                    this.activeEvents.push({
                        ...event,
                        time: state.time,
                    });
                    if (event.blocksUpdates) {
                        this.blocksUpdates = true;
                    }
                    if (event.blocksInput) {
                        this.blocksInput = true;
                    }
                    return;
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
                    const textCue = addTextCue(state, event.text, 0, 0);
                    if (event.isMapCue) {
                        textCue.isMapCue = true;
                    }
                    break;
                }
                case 'removeTextCue': {
                    removeTextCue(state);
                    break;
                }
                case 'showChoiceBox':
                    // Text cues and text choice cannot be displayed together, so dismiss any text cues.
                    removeTextCue(state);
                    showChoiceScene(state, event.prompt, event.choices);
                    this.blocksUpdates = true;
                    return;
                case 'showTextBox':
                    // Text cues and text box cannot be displayed together, so dismiss any text cues.
                    removeTextCue(state);
                    showMessagePage(state, event.textPages, event.blocksUpdates);
                    // This blocks additional events+field updates from happening this frame.
                    this.blocksUpdates = true;
                    return;
                case 'clearTextBox':
                    hideMessagePage(state)
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
                    return;
                case 'playSound':
                    playSound(event.sound);
                    break;
                case 'playTrack':
                    this.overrideMusic = event.track;
                    break;
                // This doesn't stop the BGM, it reverts back to the default BGM.
                case 'stopTrack':
                    delete this.overrideMusic;
                    break;
                case 'runDialogueScript':
                    const dialogueSet = dialogueHash[event.npcKey];
                    if (!dialogueSet) {
                        console.error('Missing dialogue set', event.npcKey, dialogueSet);
                        return;
                    }
                    // Use the updated script for the randomizer, if one exists.
                    const randomizedScript = state.randomizerState?.items?.dialogueReplacements?.[event.npcKey]?.[event.scriptKey];
                    const script = randomizedScript ?? dialogueSet.mappedOptions[event.scriptKey];
                    prependScript(state, script, this);
                    // Block the player input so that the player doesn't move during the frame the event queue is blocked.
                    this.blocksInput = true;
                    return;
                case 'attemptPurchase':
                    if (event.cost <= state.hero.savedData.money) {
                        state.hero.savedData.money -= event.cost;
                        followMessagePointer(state, event.successScript, this);
                    } else {
                        followMessagePointer(state, event.failScript, this);
                    }
                    // Since this overwrites remaining events, don't continue processing events this frame.
                    return;
                case 'rest':
                    state.transitionState = {
                        callback() {
                            state.hero.life = state.hero.savedData.maxLife;
                        },
                        nextLocation: state.location,
                        time: 0,
                        type: 'fade',
                    };
                    return;
                case 'enterLocation':
                    enterLocation(state, event.location);
                    this.blocksInput = true;
                    return;
            }
        }
        // Remove the script scene wants it is finished.
        if (!this.activeEvents.length && !this.queue.length) {
            this.removeScene(state);
        }
    }
    updateMusic(state: GameState) {
        if (this.overrideMusic) {
            playTrack(this.overrideMusic, 0);
            return true;
        }
    }
    render(context: CanvasRenderingContext2D, state: GameState): void {
    }
}

// All events to the front of the stack. These events may still be blocked by any active events in the current script scene.
// Applies to the given script scene or appends a new script scene to the stack if none is provided.
export function prependScriptEvents(state: GameState, scriptEvents: ScriptEvent[], scriptScene?: ScriptScene): void {
    if (!scriptScene) {
        scriptScene = new ScriptScene();
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
        if (topStackItem instanceof ScriptScene) {
            scriptScene = topStackItem;
        } else {
            scriptScene = new ScriptScene();
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


export function isScriptSceneInStack(state: GameState) {
    return isSceneTypeInStack(state, 'script');
}

// Removes everything from the scene stack starting with the first script scene found.
export function clearScriptScenes(state: GameState) {
    const sceneStack: GameScene[] = [];
    for (const scene of state.sceneStack) {
        if (scene.sceneType === 'script') {
            break;
        }
        sceneStack.push(scene);
    }
    state.sceneStack = sceneStack;
}

class _ScriptScene extends ScriptScene {}
declare global {
    export interface ScriptScene extends _ScriptScene {}
}
