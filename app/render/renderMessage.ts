import { flatten } from 'lodash';
import { getLootTypes } from 'app/development/objectEditor';
import { CANVAS_WIDTH, CANVAS_HEIGHT, GAME_KEY } from 'app/gameConstants';
import { renderStandardFieldStack } from 'app/render';
import { renderHUD } from 'app/renderHUD';
import { drawFrame } from 'app/utils/animations';
import { characterMap, keyboardMap, xboxMap } from 'app/utils/simpleWhiteFont';
import { fillRect, pad } from 'app/utils/index';

import { DialogueChoiceDefinition, DialogueLootDefinition, Frame, GameState, LootType } from 'app/types';

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

function getEscapedProgressFlag(state: GameState, escapedToken: string): string {
    const [tokenType, ...rest] = escapedToken.split(':');
    if (tokenType === 'flag') {
        return rest.join(':');
    }
    return null;
}
function getEscapedLoot(state: GameState, escapedToken: string): DialogueLootDefinition {
    const [tokenType, lootType, amountOrLevel] = escapedToken.split(':');
    if (tokenType !== 'item') {
        return null;
    }
    if (getLootTypes().includes(lootType as LootType)) {
        const number = parseInt(amountOrLevel, 10);
        return {
            type: 'dialogueLoot',
            lootType: lootType as LootType,
            lootLevel: isNaN(number) ? 0 : number,
            lootAmount: isNaN(number) ? 0 : number,
        };
    }
    throw new Error('Unknown loot type: ' + lootType);
}

function getEscapedFrames(state: GameState, escapedToken: string): Frame[] {
    const controllerMaps = getActiveControllerMaps(state);
    function getGameKeyFrames(key: number) {
        return flatten(controllerMaps.map(controllerMap => controllerMap[key]));
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
            return flatten([
                getGameKeyFrames(GAME_KEY.LEFT_TOOL),
                characterMap['/'],
                getGameKeyFrames(GAME_KEY.RIGHT_TOOL),
            ]);
        case 'B_PASSIVE':
            return getGameKeyFrames(GAME_KEY.PASSIVE_TOOL);
        case 'B_ROLL':
            return getGameKeyFrames(GAME_KEY.ROLL);
        case 'B_MEDITATE':
            return getGameKeyFrames(GAME_KEY.MEDITATE);
        case 'B_MENU':
            return getGameKeyFrames(GAME_KEY.MENU);
        case 'B_PREVIOUS_ELEMENT':
            return getGameKeyFrames(GAME_KEY.PREVIOUS_ELEMENT);
        case 'B_NEXT_ELEMENT':
            return getGameKeyFrames(GAME_KEY.NEXT_ELEMENT);
    }
    console.error('Unhandled escape sequence', escapedToken);
    debugger;
    return [];
}

export function showMessage(
    state: GameState,
    message: string,
    advanceTime: number = 0,
    continueUpdatingState: boolean = false
): void {
    if (!message){
        return;
    }
    state.messageState = {
        advanceTime,
        continueUpdatingState,
        pageIndex: 0,
        currentPageTime: state.time,
        pages: parseMessage(state, message),
    };
}

const messageBreak = '{|}';
export function parseMessage(state: GameState, message: string): (Frame[][] | DialogueLootDefinition | DialogueChoiceDefinition | string)[] {
    let pages: (Frame[][] | DialogueLootDefinition | DialogueChoiceDefinition | string)[] = [];
    let currentPage: Frame[][] = [];
    let row: Frame[] = [];
    let rowWidth = 0;
    const nextPage = () => {
        if (row.length) {
            currentPage.push(row);
        }
        if (currentPage.length) {
            pages.push(currentPage);
        }
        currentPage = [];
        row = [];
        rowWidth = 0;
    };
    const nextRow = () => {
        if (row.length) {
            currentPage.push(row);
            if (currentPage.length >= messageRows) {
                pages.push(currentPage);
                currentPage = [];
            }
            row = [];
            rowWidth = 0;
        }
    };
    const messagesAndChoices = message.split(/[\]\[]/);
    while (messagesAndChoices.length) {
        const nextMessage = messagesAndChoices.shift();
        const chunks = nextMessage.split(messageBreak);
        for (const chunk of chunks) {
            const spacedChunks = chunk.split(/[ \n]+/);
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
                            nextRow();
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
                        if (escapedToken === '-') {
                            nextRow();
                            continue;
                        }
                        if (escapedToken[0] === '@') {
                            nextPage();
                            pages.push(escapedToken);
                            continue;
                        }
                        if (escapedToken[0] === '!') {
                            nextPage();
                            pages.push(escapedToken);
                            continue;
                        }
                        const progressFlag = getEscapedProgressFlag(state, escapedToken);
                        if (progressFlag) {
                            nextPage();
                            pages.push(progressFlag);
                            continue;
                        }
                        const lootDefinition = getEscapedLoot(state, escapedToken);
                        if (lootDefinition) {
                            nextPage();
                            pages.push(lootDefinition);
                            continue;
                        }
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
                            nextRow();
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
        nextPage();
        const nextChoice = messagesAndChoices.shift();
        if (nextChoice) {
            const [prompt, ...optionStrings] = nextChoice.split('|');
            const options = optionStrings.map(o => {
                const [text, key] = o.split(':');
                return { text, key };
            })
            pages.push({
                prompt,
                options,
            });

        }
    }
    return pages;
}

export function renderTextRow(context: CanvasRenderingContext2D, text: string, {x, y}: {x: number, y: number}): void {
    for (const character of text) {
        const frame = characterMap[character];
        if (!frame) {
            x += characterWidth;
            continue;
        }
        drawFrame(context, frame, {
            x: x - (frame.content?.x || 0),
            y: y - (frame.content?.y || 0), w: frame.w, h: frame.h});
        x += frame.w;
    }
}

export function renderMessage(context: CanvasRenderingContext2D, state: GameState): void {
    renderStandardFieldStack(context, state);
    renderHUD(context, state);
    let h = messageRows * (16 + 2) + 6;
    let w = messageWidth + 8;
    let r = {
        x: (CANVAS_WIDTH - w) / 2,
        y: CANVAS_HEIGHT - h - 16,
        w,
        h,
    };
    const { pageIndex, pages, choice } = state.messageState;
    if (choice) {
        let choiceIndex = state.messageState.choiceIndex || 0;
        h = Math.max(h, (1 + choice.options.length) * (16 + 2) + 6);
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
        renderTextRow(context, choice.prompt, {x, y});
        y += 18;
        x += 20;
        for (let i = 0; i < choice.options.length; i++) {
            renderTextRow(context, choice.options[i].text, {x, y});
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
        return;
    }
    fillRect(context, pad(r, 2), 'white');
    fillRect(context, r, 'black');

    r = pad(r, -4);

    let x = r.x, y = r.y;
    const pageOrLootOrFlag = pages[pageIndex];
    if (typeof pageOrLootOrFlag === 'string' || pageOrLootOrFlag?.['type'] === 'dialogueLoot' || pageOrLootOrFlag?.['prompt']) {
        return;
    }
    // pages[pageIndex] can also be DialogueLootDefinition, but `pageIndex` should never
    // stop on a loot definition.
    for (const row of (pageOrLootOrFlag as Frame[][])) {
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
