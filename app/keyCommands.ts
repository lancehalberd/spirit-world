/* global navigator */
import { enterLocation } from 'app/content/areas';
import { exportZoneToClipboard } from 'app/development/exportZone';
import { selectSection, toggleEditing } from 'app/development/tileEditor';
import { GAME_KEY } from 'app/gameConstants';
import { getState } from 'app/state';

import { GameState, Hero } from 'app/types'

export const KEY = {
    ESCAPE: 27,
    LEFT: 37,
    RIGHT: 39,
    UP: 38,
    DOWN: 40,
    SPACE: 32,
    SHIFT: 16,
    ENTER: 13,
    BACK_SPACE: 8,
    COMMAND: 91,
    CONTROL: 17,
    A: 'A'.charCodeAt(0),
    C: 'C'.charCodeAt(0),
    D: 'D'.charCodeAt(0),
    E: 'E'.charCodeAt(0),
    F: 'F'.charCodeAt(0),
    G: 'G'.charCodeAt(0),
    I: 'I'.charCodeAt(0),
    J: 'J'.charCodeAt(0),
    L: 'L'.charCodeAt(0),
    M: 'M'.charCodeAt(0),
    R: 'R'.charCodeAt(0),
    S: 'S'.charCodeAt(0),
    T: 'T'.charCodeAt(0),
    V: 'V'.charCodeAt(0),
    W: 'W'.charCodeAt(0),
    X: 'X'.charCodeAt(0),
    Z: 'Z'.charCodeAt(0),
};

const KEYBOARD_MAPPINGS = {
    [GAME_KEY.WEAPON]: [KEY.SPACE], // A (bottom button)
    [GAME_KEY.PASSIVE_TOOL]: [KEY.SHIFT], // B (right button)
    [GAME_KEY.LEFT_TOOL]: [KEY.C], // X (left button)
    [GAME_KEY.RIGHT_TOOL]: [KEY.V], // Y (top button)
    [GAME_KEY.MENU]: [KEY.ENTER], // START
    [GAME_KEY.UP]: [KEY.UP, KEY.W],
    [GAME_KEY.DOWN]: [KEY.DOWN, KEY.S],
    [GAME_KEY.LEFT]: [KEY.LEFT, KEY.A],
    [GAME_KEY.RIGHT]: [KEY.RIGHT, KEY.D],
    [GAME_KEY.PREVIOUS_ELEMENT]: [KEY.Z], // L Front Bumper
    [GAME_KEY.NEXT_ELEMENT]: [KEY.X],  // R Front bumper
}

// Under this threshold, the analog buttons are considered "released" for the sake of
// actions that are only taken once per button push (like moving a menu cursor).
export const ANALOG_THRESHOLD = 0.3;

// This mapping assumes a canonical gamepad setup as seen in:
// https://w3c.github.io/gamepad/#remapping
// Which seems to work well with my xbox 360 controller.
// I based this code on examples from:
// https://developer.mozilla.org/en-US/docs/Web/API/Gamepad_API/Using_the_Gamepad_API
// Easy to find mappings at: http://html5gamepad.com/
const GAME_PAD_MAPPINGS = {
    [GAME_KEY.WEAPON]: 0, // A (bottom button)
    [GAME_KEY.PASSIVE_TOOL]: 1, // B (right button)
    [GAME_KEY.LEFT_TOOL]: 2, // X (left button)
    [GAME_KEY.RIGHT_TOOL]: 3, // Y (top button)
    [GAME_KEY.MENU]: 9, // START
    [GAME_KEY.UP]: 12,
    [GAME_KEY.DOWN]: 13,
    [GAME_KEY.LEFT]: 14,
    [GAME_KEY.RIGHT]: 15,
    [GAME_KEY.PREVIOUS_ELEMENT]: 4, // L Front Bumper
    [GAME_KEY.NEXT_ELEMENT]: 5,  // R Front bumper
};

const LEFT_ANALOG_Y_AXIS = 1;
const LEFT_ANALOG_X_AXIS = 0;
// These two are currently unused, but would be used for aiming instead of the mouse.
//const RIGHT_ANALOG_Y_AXIS = 3; // eslint-disable-line no-unused-vars
//const RIGHT_ANALOG_X_AXIS = 2; // eslint-disable-line no-unused-vars
const GAME_PAD_AXIS_MAPPINGS = {
    // Map the negative y axis of the left stick to the up key.
    [KEY.UP]: [LEFT_ANALOG_Y_AXIS, -1],
    // Map the positive y axis of the left stick to the down key.
    [KEY.DOWN]: [LEFT_ANALOG_Y_AXIS, 1],
    // Map the negative x axis of the left stick to the up key.
    [KEY.LEFT]: [LEFT_ANALOG_X_AXIS, -1],
    // Map the positive x axis of the left stick to the down key.
    [KEY.RIGHT]: [LEFT_ANALOG_X_AXIS, 1],
};

// Apparently, depending on the button type, either button.pressed or button == 1.0 indicates the button is pressed.
function buttonIsPressed(button) {
  if (typeof(button) == "object") return button.pressed;
  return button == 1.0;
}

const keysDown = {};
let lastInput: 'keyboard' | 'gamepad' = null;
export function isKeyboardKeyDown(keyCode: number) {
    if (keysDown[keyCode]) {
        lastInput = 'keyboard';
        return 1;
    }
    return 0;
}
function isGamepadGamekeyPressed(gameKey: number) {
    // If a mapping exists for the current key code to a gamepad button,
    // check if that gamepad button is pressed.
    const buttonIndex = GAME_PAD_MAPPINGS[gameKey], axisIndex = GAME_PAD_AXIS_MAPPINGS[gameKey];
    if (typeof(buttonIndex) !== 'undefined' || typeof(axisIndex) !== 'undefined') {
        // There can be multiple game pads connected. For now, let's just check all of them for the button.
        const gamepads = navigator.getGamepads();
        for (const gamepad of gamepads) {
            if (!gamepad) continue;
            let value = 0;
            if (typeof(buttonIndex) !== 'undefined' && buttonIsPressed(gamepad.buttons[buttonIndex])) {
                value = 1;
            } else if (typeof(axisIndex) !== 'undefined' && gamepad.axes[axisIndex[0]] * axisIndex[1] > 0) {
                value = gamepad.axes[axisIndex[0]] * axisIndex[1];
            }
            if (value) {
                lastInput = 'gamepad';
                return value;
            }
        }
    }
    return 0;
}

export function addKeyCommands() {
    document.addEventListener('keyup', function(event) {
        const keyCode: number = event.which;
        keysDown[keyCode] = null;
    });
    document.addEventListener('keydown', function(event: KeyboardEvent) {
        if (event.repeat) {
            return;
        }
        // Don't process keys if an input is targeted, otherwise we prevent typing in
        // the input.
        if ((event.target as HTMLElement).closest('input') ||
            (event.target as HTMLElement).closest('textarea')
        ) {
            return;
        }
        const commandIsDown = (keysDown[KEY.CONTROL] || keysDown[KEY.COMMAND]);
        const keyCode: number = event.which;
        // Don't override the refresh page command.
        if (keyCode === KEY.R && commandIsDown) {
            return;
        }
        keysDown[keyCode] = 1;
        if (keyCode === KEY.C && commandIsDown) {
            exportZoneToClipboard(getState().zone);
            event.preventDefault();
        }
        if (event.which === KEY.A && commandIsDown) {
            selectSection();
            event.preventDefault();
        }
        if (keyCode === KEY.E) {
            toggleEditing();
        }
        if (keyCode === KEY.R) {
            const state = getState();
            // Reset the entire zone if SHIFT is held.
            if (keysDown[KEY.SHIFT]) {
                for (const floor of state.zone.floors) {
                    for (const grid of [floor.grid, floor.spiritGrid]) {
                        for (const row of grid) {
                            for (const areaDefinition of row) {
                                for (const object of areaDefinition?.objects ?? []) {
                                    delete state.savedState.objectFlags[object.id];
                                }
                            }
                        }
                    }
                }
                delete state.savedState.dungeonInventories[state.zone.key];
            }
            state.location.x = state.hero.x;
            state.location.y = state.hero.y;
            // Calling this will instantiate the area again and place the player back in their current location.
            enterLocation(state, state.location);
        }
    });
}

export function updateKeyboardState(state: GameState) {
    const previousGameKeysDown = state.keyboard.gameKeysDown;
    // This set is persisted until a new set of keys is pressed.
    let mostRecentKeysPressed: Set<number> = state.keyboard.mostRecentKeysPressed;
    const gameKeyValues: number[] = [];
    const gameKeysDown: Set<number> = new Set();
    const gameKeysPressed: Set<number> = new Set();
    const gameKeysReleased: Set<number> = new Set();
    for (let gameKey of Object.values(GAME_KEY)) {
        gameKeyValues[gameKey] = 0;
        for (const keyboardCode of KEYBOARD_MAPPINGS[gameKey]) {
            gameKeyValues[gameKey] = isKeyboardKeyDown(keyboardCode);
            if (gameKeyValues[gameKey]) {
                break;
            }
        }
        if (!gameKeyValues[gameKey]) {
            gameKeyValues[gameKey] = isGamepadGamekeyPressed(gameKey);
        }
        if (gameKeyValues[gameKey] >= ANALOG_THRESHOLD) {
            gameKeysDown.add(gameKey);
        }
    }
    for (const oldKeyDown of [...previousGameKeysDown]) {
        if (!gameKeysDown.has(oldKeyDown)) {
            gameKeysReleased.add(oldKeyDown);
        }
    }
    for (const newKeyDown of [...gameKeysDown]) {
        if (!previousGameKeysDown.has(newKeyDown)) {
            gameKeysPressed.add(newKeyDown);
        }
    }
    if (gameKeysPressed.size > 0) {
        mostRecentKeysPressed = gameKeysPressed;
    }
    state.keyboard = { gameKeyValues, gameKeysDown, gameKeysPressed, gameKeysReleased, mostRecentKeysPressed };
    if (lastInput === 'gamepad') {
        state.isUsingKeyboard = false;
        state.isUsingXbox = true;
    } else if (lastInput === 'keyboard') {
        state.isUsingKeyboard = true;
        state.isUsingXbox = false;
    }
}

export function wasGameKeyPressed(state: GameState, keyCode: number): boolean {
    return state.keyboard.gameKeysPressed.has(keyCode);
}

// Only returns true if a key was pressed and released without any other keys having been pressed in between.
// Specifically this is used to determined whether to switch clones, which should only happen if the user presses
// the clone tool button without pressing any other buttons before releasing it. Note that it is okay if they
// continue holding buttons that were already down when pressing the clone button.
export function wasGameKeyPressedAndReleased(state: GameState, keyCode: number): boolean {
    return state.keyboard.mostRecentKeysPressed.has(keyCode) && state.keyboard.gameKeysReleased.has(keyCode);
}

export function isGameKeyDown(state: GameState, keyCode: number): boolean {
    return state.keyboard.gameKeysDown.has(keyCode);
}

export function getMovementDeltas(state: GameState): [number, number] {
    const { gameKeyValues } = state.keyboard;
    let dy = gameKeyValues[GAME_KEY.DOWN] - gameKeyValues[GAME_KEY.UP];
    if (Math.abs(dy) < ANALOG_THRESHOLD) dy = 0;
    let dx = gameKeyValues[GAME_KEY.RIGHT] - gameKeyValues[GAME_KEY.LEFT];
    if (Math.abs(dx) < ANALOG_THRESHOLD) dx = 0;
    return [dx, dy];
}

export function getCloneMovementDeltas(state: GameState, hero: Hero): [number, number] {
    const [dx, dy] = getMovementDeltas(state);
    const activeClone = state.hero.activeClone || state.hero;
    if (activeClone.d === hero.d) {
        return [dx, dy];
    }
    if ((activeClone.d === 'left' && hero.d === 'up') || (activeClone.d === 'up' && hero.d === 'right') ||
        (activeClone.d === 'right' && hero.d === 'down') || (activeClone.d === 'down' && hero.d === 'left')) {
        return [-dy, dx];
    }
    if ((activeClone.d === 'left' && hero.d === 'down') || (activeClone.d === 'up' && hero.d === 'left') ||
        (activeClone.d === 'right' && hero.d === 'up') || (activeClone.d === 'down' && hero.d === 'right')) {
        return [dy, -dx];
    }
    return [-dx, -dy];
}
