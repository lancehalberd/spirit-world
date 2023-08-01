import { requireFrame } from 'app/utils/packedImages';

const cachedFonts = {};

const fontSource = 'gfx/whiteFont.png';
const aCode = 'a'.charCodeAt(0);
const characterMap = {};
for (let i = 0; i < 26; i++) {
    const row = Math.floor(i / 5);
    const col = i % 5;
    let w = 4;
    let c = String.fromCharCode(aCode + i);
    if (c === 'm' || c === 't' || c === 'w' || c === 'x' || c === 'y') {
        w++;
    }
    characterMap[c] = requireFrame(fontSource, {x: col * 5, y: row * 6, w, h: 6});
}

export function drawSpecialFontText(context, text, x, y,
    {fillStyle = 'black', maxWidth = 100, strokeStyle = null, lineWidth = 1, textAlign = 'left', textBaseline = 'bottom', size = 20}
) {
    text = `${text}`;
    x = Math.round(x / 2) * 2;
    y = Math.round(y / 2) * 2;
    size = Math.round(size / 5) * 5;

    const scale = size / 5;
    let textWidth = 0;
    for (const c of text.toLowerCase()) {
        textWidth += ((c === 'w') ? 6 : 5) * scale;
    }

    if (textBaseline === 'middle') y = Math.round(y - 5 * scale / 2);
    else if (textBaseline === 'bottom') y = Math.round(y - 5 * scale);

    if (textAlign === 'center') x = Math.round(x - textWidth / 2);
    else if (textAlign === 'right') x = Math.round(x - textWidth);


    for (const c of text.toLowerCase()) {
        const r = characterMap[c];
        if (r) {
            context.drawImage(r.image,
                r.x, r.y, r.w, r.h,
                x, y, r.w * scale, r.h * scale,
            );
            x += (r.w + 1) * scale;
        } else {
            x += 4;
        }
    }
    return textWidth;
}

export function areFontsLoaded(): boolean {
    return true;
    // return [...document['fonts'].keys()].filter(fontFace => fontFace.status === 'loaded').length >= 1;
}
export function drawText(context, text, x, y,
    {fillStyle = 'black', maxWidth = 100, strokeStyle = null, lineWidth = 1, textAlign = 'left', textBaseline = 'bottom', size = 20}
) {
    text = `${text}`;
    x = Math.round(x / 2) * 2;
    y = Math.round(y / 2) * 2;
    size = Math.round(size / 2) * 2;

    // Drawing text performs poorly in firefox. Since we tend to show only a small subset of characters
    // in different fonts, just cache each character as an image.
    const key = `${fillStyle}-${strokeStyle}-${lineWidth}-${size}`;
    const cachedFont = cachedFonts[key] = cachedFonts[key] || {};
    let textWidth = 0;
    for (const c of text) {
        let cachedLetter = cachedFont[c];
        if (!cachedLetter) {
            cachedLetter = document.createElement('canvas');
            const cachedLetterContext = cachedLetter.getContext('2d');
            cachedLetterContext.imageSmoothingEnabled = false;
            // This size + 4 is just eyeballed to make the font fill the whole line
            // and is probably only good for this font size. It seemed to work for both
            // size = 16 and size = 20 though.
            cachedLetterContext.font = `${size + 4}px VT323`;
            const w = cachedLetterContext.measureText(c).width;
            cachedLetter.width = w;
            cachedLetter.height = size;
            cachedLetterContext.font = `${size + 4}px VT323`;
            cachedLetterContext.textBaseline = 'bottom';
            cachedLetterContext.textAlign = 'left';
            if (fillStyle) {
                cachedLetterContext.fillStyle = fillStyle;
                cachedLetterContext.fillText(c, 0.5, size);
            }
            if (strokeStyle) {
                cachedLetterContext.strokeStyle = strokeStyle;
                cachedLetterContext.lineWidth = lineWidth;
                cachedLetterContext.strokeText(c, 0.5, size);
            }
            cachedFont[c] = cachedLetter;
            document.body.append(cachedLetter);
        }
        textWidth += cachedLetter.width;
    }

    if (textBaseline === 'middle') y = Math.round(y - size / 2);
    else if (textBaseline === 'bottom') y = Math.round(y - size);

    if (textAlign === 'center') x = Math.round(x - textWidth / 2);
    else if (textAlign === 'right') x = Math.round(x - textWidth);

    for (const c of text) {
        let cachedLetter = cachedFont[c];
        context.drawImage(cachedLetter,
            0, 0, cachedLetter.width, cachedLetter.height,
            x, y, cachedLetter.width, cachedLetter.height,
        );
        x += cachedLetter.width;
    }
    return textWidth;
}
export function measureText(context, text, props) {
    return drawText(context, text, 0, 0, {...props, fillStyle: false, strokeStyle: false});
}
