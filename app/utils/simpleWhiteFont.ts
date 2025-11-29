import { createCanvasAndContext, debugCanvas } from 'app/utils/canvas';
import { GAME_KEY } from 'app/gameConstants';
import { createAnimation, drawFrame } from 'app/utils/animations';
import { requireFrame } from 'app/utils/packedImages';


/*const font = requireFrame('gfx/simpleFontWhite.png');

const simpleFontString = ' !"#$%&\'()*+,-./0123456789'
    + ':;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_'
    + '`abcdefghijklmnopqrstuvwxyz{|}';*/

const fontSource = 'gfx/hud/whiteFont8x16.png';
const simpleFontString = ' !"#$%&\'()*+,-./0123456789'
    + ':;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_'
    + '`abcdefghijklmnopqrstuvwxyz{|}';


export const characterMap: {[key: string]: Frame} = {};
const baseHeight = 16;
const baseWidth = 8;
for (let i = 1; i < simpleFontString.length; i++) {
    characterMap[simpleFontString[i]] = requireFrame(fontSource, {x: baseWidth * i, y: 0, w: baseWidth, h: baseHeight});
}

export const blackCharacterMap: {[key: string]: Frame} = {};
export const outlinedCharacterMap: {[key: string]: Frame} = {};

const [blackCanvas, blackContext] = createCanvasAndContext(baseWidth * simpleFontString.length, baseHeight);
const [outlinedCanvas, outlinedContext] = createCanvasAndContext((baseWidth + 2) * simpleFontString.length, baseHeight + 2);
requireFrame(fontSource, {x: 0, y: 0, w: 752, h: 16}, frame => {
    // Make a copy of simpleWhiteFont that is solid black.
    blackContext.save();
        blackContext.fillStyle = '#000';
        blackContext.fillRect(0, 0, frame.w, frame.h);
        blackContext.globalCompositeOperation = 'destination-in';
        drawFrame(blackContext, frame, {x: 0, y: 0, w: frame.w, h: frame.h});
    blackContext.restore();
    for (let i = 1; i < simpleFontString.length; i++) {
        const character = simpleFontString[i];
        const blackFrame: Frame = {image: blackCanvas, x: baseWidth * i, y: 0, w: baseWidth, h: baseHeight};
        blackCharacterMap[character] = blackFrame;
        const whiteFrame = characterMap[character];
        // Left
        drawFrame(outlinedContext, blackFrame, {...blackFrame, x: (baseWidth + 2) * i, y: 1});
        // Right
        drawFrame(outlinedContext, blackFrame, {...blackFrame, x: (baseWidth + 2) * i + 2, y: 1});
        // Top
        drawFrame(outlinedContext, blackFrame, {...blackFrame, x: (baseWidth + 2) * i + 1, y: 0});
        // Bottom
        drawFrame(outlinedContext, blackFrame, {...blackFrame, x: (baseWidth + 2) * i + 1, y: 2});
        // Middle
        drawFrame(outlinedContext, whiteFrame, {...whiteFrame, x: (baseWidth + 2) * i + 1, y: 1});
        outlinedCharacterMap[character] = {image: outlinedCanvas, x: (baseWidth + 2) * i, y: 0, w: baseWidth + 2, h: baseHeight + 2};
    }
});

const [
    xbox_y, xbox_b, xbox_a, xbox_x,
    xbox_start, xbox_select, xbox_dpad,
    /*xbox_rightStick*/, xbox_leftStick,
    xbox_r1, xbox_l1, xbox_r2, xbox_l2,
    ps_dpad, ps_start,
    /*ps_rightStick*/, ps_leftStick,
    ps_x, ps_circle, ps_square, ps_triangle,
    ps_r1, ps_l1, ps_r2, ps_l2,
    keyboard_enter,
    /*keyboard_w*/, /*keyboard_d*/, /*keyboard_s*/, /*keyboard_a*/,
    keyboard_wasd,
    /*keyboard_right*/, /*keyboard_left*/, /*keyboard_up*/,  /*keyboard_down*/,
    /*keyboard_uldr*/,
    keyboard_c, keyboard_v, keyboard_z, keyboard_x,
    keyboard_space, /*keyboard_shift*/,
    keyboard_h,
    keyboard_j,
    keyboard_k,
    /*keyboard_l*/,
    keyboard_y,
    keyboard_u,
    keyboard_i,
    keyboard_o,
    keyboard_m,
] = createAnimation('gfx/hud/controllerbuttonswhite.png', {w: 26, h: 18, content: {x: 0, y: 1, w: 26, h: 16}}, {cols: 51}).frames;

const narrowFrames = [
    xbox_y, xbox_b, xbox_a, xbox_x, xbox_start, xbox_select,
    xbox_r2, xbox_l2,
    ps_x, ps_circle, ps_square, ps_triangle, ps_start,
];
for (const narrowFrame of narrowFrames) {
    narrowFrame.x += 5;
    narrowFrame.w -= 9;
}
const mediumFrames = [
    xbox_r1, xbox_l1, xbox_dpad, xbox_leftStick
];
for (const narrowFrame of mediumFrames) {
    narrowFrame.x += 3;
    narrowFrame.w -= 6;
}
const xboxButtons = [
    xbox_y, xbox_b, xbox_a, xbox_x,
]
for (const xboxButton of xboxButtons) {
    xboxButton.content = {...xboxButton.content, y: 2};
}
const singleKeys = [
    keyboard_c, keyboard_v, keyboard_z, keyboard_x,
    keyboard_h,
    keyboard_j,
    keyboard_k,
    keyboard_y,
    keyboard_u,
    keyboard_i,
    keyboard_o,
    keyboard_m,
]
for (const singleKey of singleKeys) {
    singleKey.x += 3;
    singleKey.w -= 6;
}

export const xboxMap = {
    [GAME_KEY.UP]: [xbox_dpad, characterMap['/'], xbox_leftStick],
    [GAME_KEY.DOWN]: [xbox_dpad, characterMap['/'], xbox_leftStick],
    [GAME_KEY.LEFT]: [xbox_dpad, characterMap['/'], xbox_leftStick],
    [GAME_KEY.RIGHT]: [xbox_dpad, characterMap['/'], xbox_leftStick],
    [GAME_KEY.MENU]: [xbox_start],
    [GAME_KEY.MAP]: [xbox_select],
    [GAME_KEY.WEAPON]: [xbox_a],
    [GAME_KEY.PASSIVE_TOOL]: [xbox_b],
    [GAME_KEY.LEFT_TOOL]: [xbox_x],
    [GAME_KEY.RIGHT_TOOL]: [xbox_y],
    [GAME_KEY.PREVIOUS_ELEMENT]: [xbox_l1],
    [GAME_KEY.NEXT_ELEMENT]: [xbox_r1],
    [GAME_KEY.ROLL]: [xbox_l2],
    [GAME_KEY.MEDITATE]: [xbox_r2],
};

export const psMap = {
    [GAME_KEY.UP]: [ps_dpad, characterMap['/'], ps_leftStick],
    [GAME_KEY.DOWN]: [ps_dpad, characterMap['/'], ps_leftStick],
    [GAME_KEY.LEFT]: [ps_dpad, characterMap['/'], ps_leftStick],
    [GAME_KEY.RIGHT]: [ps_dpad, characterMap['/'], ps_leftStick],
    [GAME_KEY.MENU]: [ps_start],
    [GAME_KEY.MAP]: [ps_start],
    [GAME_KEY.WEAPON]: [ps_x],
    [GAME_KEY.PASSIVE_TOOL]: [ps_circle],
    [GAME_KEY.LEFT_TOOL]: [ps_square],
    [GAME_KEY.RIGHT_TOOL]: [ps_triangle],
    [GAME_KEY.PREVIOUS_ELEMENT]: [ps_l1],
    [GAME_KEY.NEXT_ELEMENT]: [ps_r1],
    [GAME_KEY.ROLL]: [ps_l2],
    [GAME_KEY.MEDITATE]: [ps_r2],
};

export const keyboardMap = {
    [GAME_KEY.UP]: [keyboard_wasd],
    [GAME_KEY.DOWN]: [keyboard_wasd],
    [GAME_KEY.LEFT]: [keyboard_wasd],
    [GAME_KEY.RIGHT]: [keyboard_wasd],
    [GAME_KEY.MENU]: [keyboard_enter],
    [GAME_KEY.MAP]: [keyboard_m],
    [GAME_KEY.WEAPON]: [keyboard_h],
    [GAME_KEY.PASSIVE_TOOL]: [keyboard_space],
    [GAME_KEY.LEFT_TOOL]: [keyboard_y],
    [GAME_KEY.RIGHT_TOOL]: [keyboard_u],
    [GAME_KEY.PREVIOUS_ELEMENT]: [keyboard_i],
    [GAME_KEY.NEXT_ELEMENT]: [keyboard_o],
    [GAME_KEY.ROLL]: [keyboard_j],
    [GAME_KEY.MEDITATE]: [keyboard_k],
};

interface TextOptions {
    maxWidth: number
    textAlign: 'left' | 'center' | 'right'
    textBaseline: 'top' | 'middle' | 'bottom'
    size: number
    // In some supported contexts this will adjust horizontal spacing between letters.
    spacing: number
}

export function drawText(context: CanvasRenderingContext2D, text: string, x: number, y: number,
    {maxWidth = 100, textAlign = 'left', textBaseline = 'bottom', size = baseHeight}: Partial<TextOptions>
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
        const frame = characterMap[c];
        if (frame) {
            context.drawImage(frame.image,
                frame.x, frame.y, frame.w, frame.h,
                x, y, frame.w * scale, frame.h * scale,
            );
            x += frame.w * scale;
        } else {
            x += baseWidth * scale;
        }
    }
    return textWidth;
}

export function drawOutlinedText(context: CanvasRenderingContext2D, text: string, x: number, y: number,
    {maxWidth = 100, textAlign = 'left', textBaseline = 'bottom', size = baseHeight, spacing = 0}: Partial<TextOptions>
) {
    const letterWidth = baseWidth + 2 + spacing;
    text = `${text}`;
    x = x | 0;
    y = y | 0;
    size = Math.round(size / baseHeight) * baseHeight;

    const scale = size / baseHeight;
    let textWidth = text.length * letterWidth;

    if (textBaseline === 'middle') y = Math.round(y - baseHeight * scale / 2);
    else if (textBaseline === 'bottom') y = Math.round(y - baseHeight * scale);

    if (textAlign === 'center') x = Math.round(x - textWidth / 2);
    else if (textAlign === 'right') x = Math.round(x - textWidth);

    for (const c of text) {
        const frame = outlinedCharacterMap[c];
        if (frame) {
            context.drawImage(frame.image,
                frame.x, frame.y, frame.w, frame.h,
                x, y, frame.w * scale, frame.h * scale,
            );
            x += (frame.w + spacing) * scale;
        } else {
            x += letterWidth * scale;
        }
    }
    return textWidth;
}

function generateFontImage(font: string, size: number) {
    const [canvas, context] = createCanvasAndContext(simpleFontString.length * size, 2 * size);
    context.textBaseline = 'top';
    context.textAlign = 'left';
    context.font = `${size}px ${font}`;
    const widths: number[] = [];
    let x = 0;
    for (let character of simpleFontString) {
        const w = Math.ceil(context.measureText(character).width);
        context.fillText(character, x, 0);
        widths.push(w);
        x += w;
        //x += size / 2
        //x = Math.ceil((x + context.measureText(character).width + 2) / 2) * 2;
    }
    console.log(widths);
    debugCanvas(canvas, 10);
}
window['generateFontImage'] = generateFontImage;

export const simpleWhiteFont = {
    fontSource,
    characters: simpleFontString,
    height: 16,
    frameMap: characterMap,
    scale: 1,
};

/*
export const habboFont = {
    // This image is generated by calling generateFontImage('Habbo', 16), saving the resulting image and character widths
    // then editing the image to change the font to white pixels with no anti-aliasing.
    fontSource: 'gfx/hud/habbo16.png',
    characters: ' !"#$%&\'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}',
    height: 10,
    widths: [5, 2, 4, 7, 8, 8, 7, 2, 4, 4, 6, 6, 3, 5, 3, 8, 6, 3, 6, 6, 6, 6, 6, 6, 6, 6, 3, 3, 5, 6, 5, 6, 8, 6, 6, 6, 6, 6, 6, 6, 6, 4, 6, 6, 6, 7, 6, 6, 6, 7, 6, 6, 6, 6, 6, 8, 6, 6, 6, 4, 8, 4, 4, 6, 3, 6, 6, 6, 6, 6, 5, 6, 6, 2, 3, 5, 2, 8, 6, 6, 6, 6, 5, 6, 5, 6, 6, 8, 6, 6, 6, 5, 5, 5],
    frameMap: {} as {[key: string]: Frame},
    scale: 1,
};

let x = 0;
for (let i = 0; i < habboFont.characters.length; i++) {
    const w = habboFont.widths[i];
    habboFont.frameMap[habboFont.characters[i]] = requireFrame(habboFont.fontSource, {x, y: 0, w, h: habboFont.height, s: habboFont.scale});
    x += w;
}*/
