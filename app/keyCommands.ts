/* global navigator */
import { exportZoneToClipboard } from 'app/development/exportZone';
import { toggleEditing } from 'app/development/tileEditor';
import { runTileRipper } from 'app/development/tileRipper';
import { FRAME_LENGTH } from 'app/gameConstants';
import { getState } from 'app/state';

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
    C: 'C'.charCodeAt(0),
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
    X: 'X'.charCodeAt(0),
    Z: 'Z'.charCodeAt(0),
};

export const GAME_KEY = {
    MENU: KEY.ENTER,
    LEFT_TOOL: KEY.C,
    RIGHT_TOOL: KEY.V,
    PASSIVE_TOOL: KEY.SHIFT,
    WEAPON: KEY.SPACE,
    PREVIOUS_ELEMENT: KEY.Z,
    NEXT_ELEMENT: KEY.X,
    UP: KEY.UP,
    DOWN: KEY.DOWN,
    LEFT: KEY.LEFT,
    RIGHT: KEY.RIGHT,
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
let lastButtonsPressed: {[key: string]: number} = {};
export function isKeyDown(keyCode: number, releaseThreshold: number = 0): number {
    const now = Date.now();
    if (keysDown[keyCode]) {
        if (releaseThreshold) {
            return (now - keysDown[keyCode]) <= FRAME_LENGTH ? 1 : 0;
        }
        return 1;
    }
    // If a mapping exists for the current key code to a gamepad button,
    // check if that gamepad button is pressed.
    const buttonIndex = GAME_PAD_MAPPINGS[keyCode], axisIndex = GAME_PAD_AXIS_MAPPINGS[keyCode];
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
                const wasLastPressed = lastButtonsPressed[keyCode] || 0;
                if (value > ANALOG_THRESHOLD) {
                    lastButtonsPressed[keyCode] = now;
                }
                if (!releaseThreshold || (now - wasLastPressed) > 2 * FRAME_LENGTH) {
                    return value;
                }
            }
        }
    }
    return 0;
};
export function updateKeysStillDown() {
    const now = Date.now();
    for (let keyCode in lastButtonsPressed) {
        const buttonIndex = GAME_PAD_MAPPINGS[keyCode], axisIndex = GAME_PAD_AXIS_MAPPINGS[keyCode];
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
                lastButtonsPressed[keyCode] = now;
            }
        }
    }
}

export function getMovementDeltas(): [number, number] {
    let dy = isKeyDown(GAME_KEY.DOWN) - isKeyDown(GAME_KEY.UP);
    if (Math.abs(dy) < ANALOG_THRESHOLD) dy = 0;
    let dx = isKeyDown(GAME_KEY.RIGHT) - isKeyDown(GAME_KEY.LEFT);
    if (Math.abs(dx) < ANALOG_THRESHOLD) dx = 0;
    return [dx, dy];
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
    if ((event.target as HTMLElement).closest('input')) {
        return;
    }
    const commandIsDown = (keysDown[KEY.CONTROL] || keysDown[KEY.COMMAND]);
    const keyCode: number = event.which;
    // Don't override the refresh page command.
    if (keyCode === KEY.R && commandIsDown) {
        return;
    }
    keysDown[keyCode] = Date.now();
    if (keyCode === KEY.C && commandIsDown) {
        exportZoneToClipboard(getState().zone);
    }
    if (keyCode === KEY.E) {
        toggleEditing();
    }
    if (keyCode === KEY.R && false) {
        // This needs a Frame to run correctly.
        runTileRipper(null, 8);
    }
});
}
