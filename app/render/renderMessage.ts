import { CANVAS_WIDTH, CANVAS_HEIGHT, GAME_KEY } from 'app/gameConstants';
import { drawFrame } from 'app/utils/animations';
import { getAreaSize } from 'app/utils/getAreaSize';
import { fillRect, pad } from 'app/utils/index';
import { simpleWhiteFont, keyboardMap, xboxMap } from 'app/utils/simpleWhiteFont';

const font = simpleWhiteFont;

const characterWidth = 8;
const messageWidth = 160;
const messageRows = 4;
// This was used for animating characters every N ms.
//const charTime = 4;

function getActiveControllerMaps(state: GameState) {
    if (state.isUsingKeyboard) {
        return [keyboardMap];
    }
    if (state.isUsingXbox) {
        return [xboxMap];
    }
    return [xboxMap, keyboardMap];
}

function getEscapedFrames(state: GameState, escapedToken: string): Frame[] {
    const controllerMaps = getActiveControllerMaps(state);
    function getGameKeyFrames(key: number) {
        return controllerMaps.map(controllerMap => controllerMap[key]).flat().filter(f => f);
    }
    switch (escapedToken.toUpperCase()) {
        case 'B_DPAD':
            return getGameKeyFrames(GAME_KEY.UP);
        case 'B_UP':
            return getGameKeyFrames(GAME_KEY.UP);
        case 'B_DOWN':
            return getGameKeyFrames(GAME_KEY.DOWN);
        case 'B_LEFT':
            return getGameKeyFrames(GAME_KEY.LEFT);
        case 'B_RIGHT':
            return getGameKeyFrames(GAME_KEY.RIGHT);
        case 'B_WEAPON':
            return getGameKeyFrames(GAME_KEY.WEAPON);
        case 'B_TOOL':
            return [
                getGameKeyFrames(GAME_KEY.LEFT_TOOL),
                font.frameMap['/'],
                getGameKeyFrames(GAME_KEY.RIGHT_TOOL),
            ].flat();
        case 'B_LEFT_TOOL':
            return getGameKeyFrames(GAME_KEY.LEFT_TOOL);
        case 'B_RIGHT_TOOL':
            return getGameKeyFrames(GAME_KEY.RIGHT_TOOL);
        case 'B_PASSIVE':
            return getGameKeyFrames(GAME_KEY.PASSIVE_TOOL);
        case 'B_ROLL':
            return getGameKeyFrames(GAME_KEY.ROLL);
        case 'B_MEDITATE':
            return getGameKeyFrames(GAME_KEY.MEDITATE);
        case 'B_MENU':
            return getGameKeyFrames(GAME_KEY.MENU);
        case 'B_MAP':
            return getGameKeyFrames(GAME_KEY.MAP);
        case 'B_PREVIOUS_ELEMENT':
            return getGameKeyFrames(GAME_KEY.PREVIOUS_ELEMENT);
        case 'B_NEXT_ELEMENT':
            return getGameKeyFrames(GAME_KEY.NEXT_ELEMENT);
    }
    console.error('Unhandled escape sequence', escapedToken);
    debugger;
    return [];
}

export function textScriptToString(state: GameState, textScript: TextScript): string {
    if (typeof textScript === 'string') {
        return textScript;
    }
    return textScript(state)
}

export function parseMessage(state: GameState, message: TextScript, maxWidth = messageWidth): TextPage[] {
    let pages: TextPage[] = [];
    let currentPage: TextPage = {
        textRows: [],
        frames: [],
    };
    let rowText: string = ''
    let rowFrames: Frame[] = [];
    let rowWidth = 0;
    let rowNeedsSpace = false;
    const nextRow = () => {
        if (rowText.length) {
            currentPage.textRows.push(rowText);
            currentPage.frames.push(rowFrames);
            // Pages can now be any number of lines long as we scroll through them.
            /*if (currentPage.frames.length >= messageRows) {
                pages.push(currentPage);
                currentPage = {
                    textRows: [],
                    frames: [],
                };
            }*/
            rowFrames = [];
            rowText = '';
            rowWidth = 0;
        }
        rowNeedsSpace = false;
    };
    const spacedChunks = textScriptToString(state, message).split(/[ \n]+/);
    for (const spacedChunk of spacedChunks) {
        // This will split the spaced chunk into a sequence of elements like:
        // ['string', 'escapedToken', 'string', ...].
        // For example: ['Press', '[B_WEAPON', 'to']
        const stringAndIconTokens = spacedChunk.split(/[\[\]]+/);
        while (stringAndIconTokens.length) {
            const stringToken = stringAndIconTokens.shift();
            if (stringToken) {
                // Extra character is included here for the space before this word.
                const addedWidth = stringToken.length * characterWidth + characterWidth;
                // Wrap to the next line if this string is too long to add to the end of this row.
                if (rowFrames.length && rowWidth + addedWidth > maxWidth) {
                    nextRow();
                }
                // Add a space before the next word if the row isn't empty.
                if (rowFrames.length) {
                    rowFrames.push(null);
                    rowText += ' ';
                    rowWidth += characterWidth;
                }
                for (const c of stringToken) {
                    rowFrames.push(font.frameMap[c]);
                    rowText += c;
                    rowWidth += font.frameMap[c].w * (font.frameMap[c].s || 1);
                }
                rowNeedsSpace = true;
            }
            const iconToken = stringAndIconTokens.shift();
            if (iconToken) {
                if (iconToken === '-') {
                    nextRow();
                    continue;
                }
                const tokenFrames = getEscapedFrames(state, iconToken);
                if (!tokenFrames?.length) {
                    continue;
                }
                let tokenWidth;
                try {
                    tokenWidth = tokenFrames.reduce((sum, {w}) => sum + w, 0);
                } catch (e) {
                    debugger;
                }
                if (rowNeedsSpace) {
                    tokenWidth += characterWidth;
                }
                if (rowWidth + tokenWidth > maxWidth) {
                    nextRow();
                }
                if (rowFrames.length && rowNeedsSpace) {
                    // Add a space before the next word if the row isn't empty.
                    rowFrames.push(null);
                    rowText += ' ';
                    rowWidth += characterWidth;
                }
                for (const frame of tokenFrames) {
                    rowFrames.push(frame);
                    rowText += iconToken;
                    rowWidth += frame.w;
                }
                // We don't need a space between icons.
                rowNeedsSpace = false;
            }
        }
    }
    nextRow();
    if (currentPage.frames.length) {
        pages.push(currentPage);
    }
    return pages;
}

export function renderTextRow(context: CanvasRenderingContext2D, text: string, {x, y}: {x: number, y: number}): void {
    for (const character of text) {
        const frame = font.frameMap[character];
        if (!frame) {
            x += characterWidth;
            continue;
        }
        drawFrame(context, frame, {
            x: x - (frame.content?.x || 0) * (frame.s || 1),
            y: y - (frame.content?.y || 0) * (frame.s || 1),
            w: frame.w * (frame.s || 1),
            h: frame.h * (frame.s || 1),
        });
        x += frame.w;
    }
}

export function renderMessage(context: CanvasRenderingContext2D, state: GameState): void {
    let h = messageRows * (16 + 2) + 6;
    let w = messageWidth + 8;
    let r = {
        x: (CANVAS_WIDTH - w) / 2,
        y: CANVAS_HEIGHT - h - 16,
        w,
        h,
    };
    const {section} = getAreaSize(state);
    if (state.hero.y - section.y >= 128) {
        r.y = 32;
    }
    if (state.messagePage) {
        const rowDuration = 100;
        fillRect(context, pad(r, 2), 'white');
        fillRect(context, r, 'black');
        r = pad(r, -4);
        // pages[pageIndex] can also be DialogueLootDefinition, but `pageIndex` should never
        // stop on a loot definition.
        const startingRow = Math.max(state.messagePage.lineIndex - messageRows, 0);
        const endingRow = Math.min(state.messagePage.frames.length - 1, state.messagePage.lineIndex + messageRows - 1);
        //console.log([state.messagePage.lineIndex, state.messagePage.frames.length], [startingRow, endingRow]);
        //let time = 0;
        for (let row = startingRow; row <= endingRow; row++) {
            let x = r.x;
            const y = (state.messagePage.lineIndex === 0)
                ? r.y + (row - startingRow) * 18
                : r.y + (row - startingRow) * 18 - Math.round(18 * Math.max(0, Math.min(endingRow - startingRow - messageRows + 1, state.messagePage.animationTime / rowDuration)));
            // console.log(state.messagePage.animationTime, row, y - r.y);
            const frameRow = state.messagePage.frames[row];
            // This will make one line appear in the first message page at a time every 80ms
            /*if (state.messagePage.lineIndex === 0 && time >= state.messagePage.animationTime) {
                break;
            }
            time += rowDuration;*/
            // This will smoothly fill in the first message page
            // const maxY = state.messagePage.lineIndex === 0 ? r.y + Math.floor(18 * state.messagePage.animationTime / rowDuration) : r.y + r.h;
            const maxY = r.y + r.h;
            for (const frame of frameRow) {
                if (!frame) {
                    x += characterWidth;
                    continue;
                }
                // Skip lines that are entirely outside of the message box area.
                if (y + frame.h <= r.y || y >= maxY) {
                    break;
                }
                if (y < r.y) {
                    const h = r.y - y;
                    // Only draw the bottom of frames that are scrolling off the top of the message box.
                    drawFrame(context, {
                        ...frame,
                        y: frame.y + h,
                        h: frame.h - h,
                    }, {
                        x: x - (frame.content?.x || 0) * (frame.s || 1),
                        y: y - (frame.content?.y || 0) * (frame.s || 1) + h,
                        w: frame.w * (frame.s || 1),
                        h: frame.h * (frame.s || 1) - h,
                    });
                } else if (y + frame.h > maxY) {
                    const h = (y + frame.h) - maxY;
                    // Only draw the top of frames that are scrolling off the top of the message box.
                    drawFrame(context, {
                        ...frame,
                        h: frame.h - h,
                    }, {
                        x: x - (frame.content?.x || 0) * (frame.s || 1),
                        y: y - (frame.content?.y || 0) * (frame.s || 1),
                        w: frame.w * (frame.s || 1),
                        h: frame.h * (frame.s || 1) - h,
                    });
                } else {
                    drawFrame(context, frame, {
                        x: x - (frame.content?.x || 0) * (frame.s || 1),
                        y: y - (frame.content?.y || 0) * (frame.s || 1),
                        w: frame.w * (frame.s || 1),
                        h: frame.h * (frame.s || 1),
                    });
                }
                x += frame.w * (frame.s || 1);
                /*time += charTime;
                if (state.messagePage.lineIndex === 0 && time > state.messagePage.animationTime) {
                    break;
                }*/
            }
            /*if (state.messagePage.lineIndex === 0 && time > state.messagePage.animationTime) {
                break;
            }*/
        }
    }
    const choice = state.scriptEvents.activeEvents.find(event => event.type === 'showChoiceBox') as ShowChoiceBoxActiveScriptEvent;
    if (choice) {
        let choiceIndex = choice.choiceIndex || 0;
        h = Math.max(h, (1 + choice.choices.length) * (16 + 2) + 6);
        let r = {
            x: (CANVAS_WIDTH - w) / 2,
            y: CANVAS_HEIGHT - h - 16,
            w,
            h,
        };
        fillRect(context, pad(r, 2), 'white');
        fillRect(context, r, 'black');
        r = pad(r, -4);
        let y = r.y, x = r.x;
        if (choice.prompt) {
            renderTextRow(context, choice.prompt, {x, y});
            y += 18;
        }
        x += 20;
        for (let i = 0; i < choice.choices.length; i++) {
            renderTextRow(context, choice.choices[i].text, {x, y});
            if (choiceIndex === i) {
                // Draw an arrow next to the selected option.
                context.fillStyle = 'white';
                context.beginPath();
                context.moveTo(r.x + 8, y);
                context.lineTo(r.x + 16, y + 8);
                context.lineTo(r.x + 8, y + 16);
                context.fill();
            }
            y += 18;
        }
    }
}
