import {GAME_KEY} from 'app/gameConstants';
import {simpleWhiteFont, keyboardMap, xboxMap} from 'app/utils/simpleWhiteFont';

const font = simpleWhiteFont;

const characterWidth = 8;
const messageWidth = 160;
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
    const nextRow = (force = false) => {
        if (rowText.length || force) {
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
        // For example: ['Press', 'B_WEAPON', 'to']
        const stringAndIconTokens = spacedChunk.split(/[\[\]]/);
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
                // Force adding a line break.
                if (iconToken === '-') {
                    nextRow(true);
                    continue;
                }
                // Force adding a space to the current line.
                if (iconToken === '_') {
                    rowFrames.push(null);
                    rowText += ' ';
                    rowWidth += characterWidth;
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

