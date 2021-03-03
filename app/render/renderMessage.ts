import _ from 'lodash';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from 'app/gameConstants';
import { GAME_KEY } from 'app/keyCommands';
import { renderField } from 'app/render';
import { renderHUD } from 'app/renderHUD';
import { drawFrame } from 'app/utils/animations';
import { characterMap, keyboardMap, xboxMap } from 'app/utils/simpleWhiteFont';
import { fillRect, pad } from 'app/utils/index';

import { Frame, GameState } from 'app/types';

const characterWidth = 8;
const messageWidth = 160;
const messageRows = 4;

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
        return _.flatten(controllerMaps.map(controllerMap => controllerMap[key]));
    }
    switch (escapedToken.toUpperCase()) {
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
            return _.flatten([
                getGameKeyFrames(GAME_KEY.LEFT_TOOL),
                characterMap['/'],
                getGameKeyFrames(GAME_KEY.RIGHT_TOOL),
            ]);
        case 'B_PASSIVE':
            return getGameKeyFrames(GAME_KEY.PASSIVE_TOOL);
        case 'B_MENU':
            return getGameKeyFrames(GAME_KEY.MENU);
    }
    console.log('Unhandled escape sequence', escapedToken);
    debugger;
    return [];
}

const messageBreak = '{|}';
export function parseMessage(state: GameState, message: string): Frame[][][] {
    const chunks = message.split(messageBreak);
    let pages: Frame[][][] = [];
    let currentPage: Frame[][] = [];
    let row: Frame[] = [];
    let rowWidth = 0;
    for (const chunk of chunks) {
        const spacedChunks = chunk.split(' ');
        for (const spacedChunk of spacedChunks) {
            // This will split the spaced chunk into a sequence of elements like:
            // ['string', 'escapedToken', 'string', ...].
            // For example: ['Press', 'B_WEAPON', 'to']
            const escapedChunks = spacedChunk.split(/[{}]/);
            for (let i = 0; i < escapedChunks.length; i += 2) {
                const stringToken = escapedChunks[i];
                if (stringToken) {
                    // If this is the first word added from a spaced chunk, we add an additional space before it
                    // but only if it is not at the beginning of a row.
                    const addedWidth = stringToken.length * characterWidth + (i === 0 ? characterWidth : 0);
                    // Wrap to the next line if this string is too long to add to the end of this row.
                    if (row.length && rowWidth + addedWidth > messageWidth) {
                        currentPage.push(row);
                        if (currentPage.length >= messageRows) {
                            pages.push(currentPage);
                            currentPage = [];
                        }
                        row = [];
                        rowWidth = 0;
                    }
                    if (i === 0 && row.length) {
                        // Add a space before the next word if the row isn't empty.
                        row.push(null);
                        rowWidth += characterWidth;
                    }
                    for (const c of stringToken) {
                        row.push(characterMap[c]);
                        rowWidth += characterMap[c].w;
                    }
                }
                const escapedToken = escapedChunks[i + 1];
                if (escapedToken) {
                    const tokenFrames = getEscapedFrames(state, escapedToken);
                    if (!tokenFrames?.length) {
                        continue;
                    }
                    // Add the space if this is the fist escapedToken and there was no string token before it.
                    const shouldAddSpace = i === 0 && !stringToken;
                    let tokenWidth;
                    try {
                        tokenWidth = tokenFrames.reduce((sum, {w}) => sum + w, 0);
                    } catch (e) {
                        debugger;
                    }
                    if (shouldAddSpace) {
                        tokenWidth += characterWidth;
                    }
                    if (rowWidth + tokenWidth > messageWidth) {
                        currentPage.push(row);
                        if (currentPage.length >= messageRows) {
                            pages.push(currentPage);
                            currentPage = [];
                        }
                        row = [];
                        rowWidth = 0;
                    }
                    if (row.length && shouldAddSpace) {
                        // Add a space before the next word if the row isn't empty.
                        row.push(null);
                        rowWidth += characterWidth;
                    }
                    for (const frame of tokenFrames) {
                        row.push(frame);
                        rowWidth += frame.w;
                    }
                }
            }
        }
    }
    if (row) {
        currentPage.push(row);
    }
    if (currentPage.length) {
        pages.push(currentPage);
    }
    return pages;
}

export function renderMessage(context: CanvasRenderingContext2D, state: GameState): void {
    renderField(context, state);
    renderHUD(context, state);
    const h = messageRows * (16 + 2) + 6;
    const w = messageWidth + 8;
    let r = {
        x: (CANVAS_WIDTH - w) / 2,
        y: CANVAS_HEIGHT - h - 32,
        w,
        h,
    };
    fillRect(context, pad(r, 2), 'white');
    fillRect(context, r, 'black');

    r = pad(r, -4);

    let x = r.x, y = r.y;
    const { pageIndex, pages } = state.messageState;
    for (const row of pages[pageIndex]) {
        for (const frame of row) {
            if (!frame) {
                x += characterWidth;
                continue;
            }
            drawFrame(context, frame, {
                x: x - (frame.content?.x || 0),
                y: y - (frame.content?.y || 0), w: frame.w, h: frame.h});
            x += frame.w;
        }
        y += 18;
        x = r.x;
    }

}
