import {CANVAS_WIDTH, CANVAS_HEIGHT, GAME_KEY} from 'app/gameConstants';
import {sceneHash} from 'app/scenes/sceneHash';
import {followMessagePointer} from 'app/scriptEvents';
import {wasGameKeyPressed, wasConfirmKeyPressed} from 'app/userInput';
import {drawFrame} from 'app/utils/animations';
import {fillRect, pad} from 'app/utils/index';
import {simpleWhiteFont} from 'app/utils/simpleWhiteFont';

const font = simpleWhiteFont;

const characterWidth = 8;
const messageWidth = 160;
const messageRows = 4;

function renderTextRow(context: CanvasRenderingContext2D, text: string, {x, y}: {x: number, y: number}): void {
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

export class ChoiceScene implements GameScene {
    sceneType = 'choice';
    lineIndex: number = 0;
    animationTime: number = 0;
    blocksInput = true;
    blocksUpdates = true;
    prompt: TextPage;
    choices: {
        text: string
        key: string
    }[] = [];
    cursorIndex: number = 0;
    closeScene(state: GameState) {
        while (state.sceneStack.includes(this)) {
            state.sceneStack.pop();
        }
    }
    update(state: GameState, interactive: boolean) {
        if (wasConfirmKeyPressed(state)) {
            const option = this.choices[this.cursorIndex];
            followMessagePointer(state, option.key);
            state.scriptEvents.handledInput = true;
            this.closeScene(state);
            return;
        }
        const optionCount = this.choices.length;
        if (wasGameKeyPressed(state, GAME_KEY.UP)) {
            this.cursorIndex = (this.cursorIndex + optionCount - 1) % optionCount;
        } else if (wasGameKeyPressed(state, GAME_KEY.DOWN)) {
            this.cursorIndex = (this.cursorIndex + 1) % optionCount;
        }
    }
    render(context: CanvasRenderingContext2D, state: GameState): void {
        const h = Math.max(messageRows, this.prompt.textRows.length + this.choices.length) * (16 + 2) + 6;
        const w = messageWidth + 8;
        let r = {
            x: (CANVAS_WIDTH - w) / 2,
            y: CANVAS_HEIGHT - h - 16,
            w,
            h,
        };
        if (state.hero.y - state.camera.y >= 128) {
            r.y = 32;
        }
        fillRect(context, pad(r, 2), 'white');
        fillRect(context, r, 'black');
        r = pad(r, -4);
        let y = r.y, x = r.x;
        if (this.prompt) {
            renderTextePage(context, this.prompt, r);
            y += this.prompt.textRows.length * 18;
        }
        x += 20;
        for (let i = 0; i < this.choices.length; i++) {
            renderTextRow(context, this.choices[i].text, {x, y});
            if (this.cursorIndex === i) {
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

function renderTextePage(context: CanvasRenderingContext2D, page: TextPage, r: Rect) {
    for (let row = 0; row < page.textRows.length; row++) {
        let x = r.x;
        const y = r.y + row * 18;
        const frameRow = page.frames[row];
        for (const frame of frameRow) {
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
            x += frame.w * (frame.s || 1);
        }
    }
}

sceneHash.choice = new ChoiceScene();
