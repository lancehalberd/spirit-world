import { requireImage } from 'app/utils/images';

const font = requireImage('gfx/simpleFontWhite.png');

const simpleFontString = ' !"#$%&\'()*+,-./0123456789'
    + ':;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_'
    + '`abcdefghijklmnopqrstuvwxyz{|}';

const characterMap = {};
for (let i = 1; i < simpleFontString.length; i++) {
    characterMap[simpleFontString[i]] = {x: 6 * i, y: 0, w: 6, h: 8};
}

const baseHeight = 8;

export function drawText(context, text, x, y,
    {maxWidth = 100, textAlign = 'left', textBaseline = 'bottom', size = baseHeight}
) {
    text = `${text}`;
    x = x | 0;
    y = y | 0;
    size = Math.round(size / baseHeight) * baseHeight;

    const scale = size / baseHeight;
    let textWidth = text.length * 6;

    if (textBaseline === 'middle') y = Math.round(y - 5 * scale / 2);
    else if (textBaseline === 'bottom') y = Math.round(y - 5 * scale);

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
            x += 6;
        }
    }
    return textWidth;
}
