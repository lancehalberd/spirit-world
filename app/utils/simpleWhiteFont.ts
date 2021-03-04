import { GAME_KEY } from 'app/gameConstants';
import { createAnimation } from 'app/utils/animations';
import { requireImage } from 'app/utils/images';

import { Frame } from 'app/types';

/*const font = requireImage('gfx/simpleFontWhite.png');

const simpleFontString = ' !"#$%&\'()*+,-./0123456789'
    + ':;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_'
    + '`abcdefghijklmnopqrstuvwxyz{|}';*/

const font = requireImage('gfx/hud/whiteFont8x16.png');
const simpleFontString = ' !"#$%&\'()*+,-./0123456789'
    + ':;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_'
    + '`abcdefghijklmnopqrstuvwxyz{|}';

export const characterMap: {[key: string]: Frame} = {};
const baseHeight = 16;
const baseWidth = 8;
for (let i = 1; i < simpleFontString.length; i++) {
    characterMap[simpleFontString[i]] = {image: font, x: baseWidth * i, y: 0, w: baseWidth, h: baseHeight};
}

const [
    xbox_y, xbox_b, xbox_a, xbox_x,
    xbox_start, /*xbox_select*/, xbox_dpad,
    /*xbox_rightStick*/, xbox_leftStick,
    xbox_r1, xbox_l1, /*xbox_r2*/, /*xbox_l2*/,
    ps_dpad, ps_start,
    /*ps_rightStick*/, ps_leftStick,
    ps_x, ps_circle, ps_square, ps_triangle,
    ps_r1, ps_l1, /*ps_r2*/, /*ps_l2*/,
    keyboard_enter,
    /*keyboard_w*/, /*keyboard_d*/, /*keyboard_s*/, /*keyboard_a*/,
    keyboard_wasd,
    /*keyboard_left*/, /*keyboard_right*/, /*keyboard_up*/,
    keyboard_c, keyboard_v, keyboard_z, keyboard_x,
    keyboard_space, keyboard_shift,
] = createAnimation('gfx/hud/controllerbuttonswhite.png', {w: 26, h: 18, content: {x: 0, y: 1, w: 26, h: 16}}, {cols: 40}).frames;

const smallKeys = [
    xbox_y, xbox_b, xbox_a, xbox_x, xbox_start,
    ps_x, ps_circle, ps_square, ps_triangle, ps_start,
    keyboard_c, keyboard_v, keyboard_z, keyboard_x,
]
for (const smallKey of smallKeys) {
    smallKey.x += 5;
    smallKey.w -= 9;
}

export const xboxMap = {
    [GAME_KEY.UP]: [xbox_dpad, xbox_leftStick],
    [GAME_KEY.DOWN]: [xbox_dpad, xbox_leftStick],
    [GAME_KEY.LEFT]: [xbox_dpad, xbox_leftStick],
    [GAME_KEY.RIGHT]: [xbox_dpad, xbox_leftStick],
    [GAME_KEY.MENU]: [xbox_start],
    [GAME_KEY.WEAPON]: [xbox_a],
    [GAME_KEY.PASSIVE_TOOL]: [xbox_b],
    [GAME_KEY.LEFT_TOOL]: [xbox_y],
    [GAME_KEY.RIGHT_TOOL]: [xbox_x],
    [GAME_KEY.PREVIOUS_ELEMENT]: [xbox_l1],
    [GAME_KEY.NEXT_ELEMENT]: [xbox_r1],
};

export const psMap = {
    [GAME_KEY.UP]: [ps_dpad, ps_leftStick],
    [GAME_KEY.DOWN]: [ps_dpad, ps_leftStick],
    [GAME_KEY.LEFT]: [ps_dpad, ps_leftStick],
    [GAME_KEY.RIGHT]: [ps_dpad, ps_leftStick],
    [GAME_KEY.MENU]: [ps_start],
    [GAME_KEY.WEAPON]: [ps_x],
    [GAME_KEY.PASSIVE_TOOL]: [ps_circle],
    [GAME_KEY.LEFT_TOOL]: [ps_square],
    [GAME_KEY.RIGHT_TOOL]: [ps_triangle],
    [GAME_KEY.PREVIOUS_ELEMENT]: [ps_l1],
    [GAME_KEY.NEXT_ELEMENT]: [ps_r1],
};

export const keyboardMap = {
    [GAME_KEY.UP]: [keyboard_wasd],
    [GAME_KEY.DOWN]: [keyboard_wasd],
    [GAME_KEY.LEFT]: [keyboard_wasd],
    [GAME_KEY.RIGHT]: [keyboard_wasd],
    [GAME_KEY.MENU]: [keyboard_enter],
    [GAME_KEY.WEAPON]: [keyboard_space],
    [GAME_KEY.PASSIVE_TOOL]: [keyboard_shift],
    [GAME_KEY.LEFT_TOOL]: [keyboard_c],
    [GAME_KEY.RIGHT_TOOL]: [keyboard_v],
    [GAME_KEY.PREVIOUS_ELEMENT]: [keyboard_z],
    [GAME_KEY.NEXT_ELEMENT]: [keyboard_x],
};

export function drawText(context: CanvasRenderingContext2D, text: string, x: number, y: number,
    {maxWidth = 100, textAlign = 'left', textBaseline = 'bottom', size = baseHeight}
) {
    text = `${text}`;
    x = x | 0;
    y = y | 0;
    size = Math.round(size / baseHeight) * baseHeight;

    const scale = size / baseHeight;
    let textWidth = text.length * baseWidth;

    if (textBaseline === 'middle') y = Math.round(y - baseHeight * scale / 2);
    else if (textBaseline === 'bottom') y = Math.round(y - baseHeight * scale);

    if (textAlign === 'center') x = Math.round(x - textWidth / 2);
    else if (textAlign === 'right') x = Math.round(x - textWidth);


    for (const c of text) {
        const r = characterMap[c];
        if (r) {
            context.drawImage(font,
                r.x, r.y, r.w, r.h,
                x, y, r.w * scale, r.h * scale,
            );
            x += r.w * scale;
        } else {
            x += baseWidth * scale;
        }
    }
    return textWidth;
}
