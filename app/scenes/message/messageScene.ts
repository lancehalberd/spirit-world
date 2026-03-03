import {CANVAS_WIDTH, CANVAS_HEIGHT, FRAME_LENGTH, GAME_KEY} from 'app/gameConstants';
import {pushScene} from 'app/scenes/sceneHash';
import {updateSoundSettings} from 'app/utils/soundSettings';
import {wasGameKeyPressed, wasConfirmKeyPressed} from 'app/userInput';
import {drawFrame} from 'app/utils/animations';
import {fillRect, pad} from 'app/utils/index';

const characterWidth = 8;
const messageWidth = 160;
const messageRows = 4;


export class MessageScene implements GameScene {
    sceneType = 'message';
    lineIndex: number = 0;
    animationTime: number = 0;
    blocksInput = true;
    blocksUpdates = true;
    pages: TextPage[] = [];
    closeScene(state: GameState) {
        while (state.sceneStack.includes(this)) {
            state.sceneStack.pop();
        }
        updateSoundSettings(state);
    }
    nextPage(state: GameState) {
        this.lineIndex = 0;
        this.animationTime = 0;
        this.pages.pop();
        if (!this.pages.length) {
            state.sceneStack.pop();
            // Let the field update the frame the message closes so there isn't
            // a frame delay between consecutive messages.
            this.blocksUpdates = false;
        }
    }
    update(state: GameState, interactive: boolean) {
        const shouldSkipForward = wasConfirmKeyPressed(state) || wasGameKeyPressed(state, GAME_KEY.PASSIVE_TOOL);
        const page = this.pages[this.pages.length - 1];
        if (!page) {
            state.sceneStack.pop();
            return;
        }
        const {lineIndex, animationTime} = this;
        if (lineIndex === 0) {
            // Currently there is no initial animation for the first page of dialogue.
            const initialAnimationDuration = 0;
            if (animationTime < initialAnimationDuration) {
                if (shouldSkipForward) {
                    this.animationTime = initialAnimationDuration;
                }
            } else if (page.frames.length <= 4) {
                if (shouldSkipForward) {
                    this.nextPage(state);
                }
            } else {
                if (shouldSkipForward) {
                    //console.log('Going to next page', this.frames.length, lineIndex, ' -> ', lineIndex + 4);
                    this.lineIndex += 4;
                    this.animationTime = 0;
                }
            }
        } else {
            const pageDurationTime = FRAME_LENGTH * 5 * 4;
            if (animationTime < pageDurationTime) {
                if (shouldSkipForward) {
                    //console.log('Skip paging animation', pageDurationTime);
                    this.animationTime = pageDurationTime;
                }
            } else if (page.frames.length <= lineIndex + 4) {
                if (shouldSkipForward) {
                    this.nextPage(state);
                }
            } else {
                if (shouldSkipForward) {
                    //console.log('Going to next page', this.frames.length, lineIndex, ' -> ', lineIndex + 4);
                    this.lineIndex += 4;
                    this.animationTime = 0;
                }
            }
        }
        this.animationTime += FRAME_LENGTH;
    }
    render(context: CanvasRenderingContext2D, state: GameState): void {
        const page = this.pages[this.pages.length - 1];
        if (!page) {
            return;
        }
        let h = messageRows * (16 + 2) + 6;
        let w = messageWidth + 8;
        let r = {
            x: (CANVAS_WIDTH - w) / 2,
            y: CANVAS_HEIGHT - h - 16,
            w,
            h,
        };
        //const {section} = getAreaSize(state);
        if (state.hero.y - state.camera.y >= 128) {
            r.y = 32;
        }
        const rowDuration = 100;
        fillRect(context, pad(r, 2), 'white');
        fillRect(context, r, 'black');
        r = pad(r, -4);
        // pages[pageIndex] can also be DialogueLootDefinition, but `pageIndex` should never
        // stop on a loot definition.
        const startingRow = Math.max(this.lineIndex - messageRows, 0);
        const endingRow = Math.min(page.frames.length - 1, this.lineIndex + messageRows - 1);
        //console.log([this.lineIndex, this.frames.length], [startingRow, endingRow]);
        //let time = 0;
        for (let row = startingRow; row <= endingRow; row++) {
            let x = r.x;
            const y = (this.lineIndex === 0)
                ? r.y + (row - startingRow) * 18
                : r.y + (row - startingRow) * 18 - Math.round(18 * Math.max(0, Math.min(endingRow - startingRow - messageRows + 1, this.animationTime / rowDuration)));
            // console.log(this.animationTime, row, y - r.y);
            const frameRow = page.frames[row];
            // This will make one line appear in the first message page at a time every 80ms
            /*if (this.lineIndex === 0 && time >= this.animationTime) {
                break;
            }
            time += rowDuration;*/
            // This will smoothly fill in the first message page
            // const maxY = this.lineIndex === 0 ? r.y + Math.floor(18 * this.animationTime / rowDuration) : r.y + r.h;
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
                if (this.lineIndex === 0 && time > this.animationTime) {
                    break;
                }*/
            }
        }
    }
}

export function showMessagePage(state: GameState, textPages: TextPage[]) {
    const messageScene = new MessageScene();
    messageScene.pages = textPages;
    pushScene(state, messageScene)
}

export function hideMessagePage(state: GameState) {
    while (state.sceneStack[state.sceneStack.length - 1].sceneType === 'message') {
        state.sceneStack.pop();
    }
}
