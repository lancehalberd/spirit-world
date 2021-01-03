/* global navigator */
import { exportAreaGridToClipboard } from 'app/development/exportAreaGrid';
import { toggleEditing } from 'app/development/tileEditor';
import { runTileRipper } from 'app/development/tileRipper';
import { getState } from 'app/state';
import { requireImage } from 'app/utils/images';

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
};

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
    [KEY.SPACE]: 0, // A (bottom button)
    [KEY.SHIFT]: 1, // B (right button)
    [KEY.V]: 2, // X (left button)
    [KEY.F]: 3, // Y (top button)
    [KEY.ENTER]: 9, // START
    [KEY.UP]: 12,
    [KEY.DOWN]: 13,
    [KEY.LEFT]: 14,
    [KEY.RIGHT]: 15,
    [KEY.X]: 4, // L Front Bumper
    [KEY.C]: 5,  // R Front bumper
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
    if (keysDown[keyCode]) {
        if (releaseThreshold) {
            return Date.now() - keysDown[keyCode] < releaseThreshold ? 1 : 0;
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
                const now = Date.now();
                if (value > ANALOG_THRESHOLD) {
                    lastButtonsPressed[keyCode] = now;
                }
                if (!releaseThreshold || (now - wasLastPressed) >= releaseThreshold) {
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

export function addKeyCommands() {
document.addEventListener('keyup', function(event) {
    const keyCode: number = event.which;
    keysDown[keyCode] = null;
});
const easternPalaceFrame = {image: requireImage('gfx/easternPalace/client.png'), x: 512, y: 0, w: 512, h: 512};
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
        exportAreaGridToClipboard(getState().areaGrid);
    }
    if (keyCode === KEY.E) {
        toggleEditing();
    }
    if (keyCode === KEY.R && false) {
        runTileRipper(easternPalaceFrame, 8);
    }
});
}
