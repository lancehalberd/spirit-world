import {CANVAS_HEIGHT, CANVAS_WIDTH} from 'app/gameConstants';
import {bossRushConditions, getBossRushOptions} from 'app/scenes/bossRush/bossRushOptions';
import {getSavedBossRushData} from 'app/scenes/bossRush/showBossRushScene';
import {BossRushScene} from 'app/scenes/bossRush/bossRushScene';
import {formatMinutesAndSeconds} from 'app/utils/formatters';
import {fillRect, pad} from 'app/utils/index';
import {drawText} from 'app/utils/simpleWhiteFont';


const ROW_HEIGHT = 20;

const textOptions = <const>{
    textBaseline: 'middle',
    textAlign: 'left',
    size: 16,
};

const MARGIN = 5;
export function renderConditionsMenu(context: CanvasRenderingContext2D, state: GameState, scene: BossRushScene): void {
    const h = ROW_HEIGHT * bossRushConditions.length + 8;
    let r = {
        x: MARGIN,
        y: CANVAS_HEIGHT - MARGIN - h,
        w: 145,
        h,
    };
    fillRect(context, r, 'white');
    fillRect(context, pad(r, -2), 'black');

    r = pad(r, -4);

    let x = r.x + 12, y = r.y + ROW_HEIGHT / 2;
    let totalMultiplier = 1;
    for (let index = 0; index < bossRushConditions.length; index++) {
        const condition = bossRushConditions[index]
        context.fillStyle = 'white';
        drawText(context, condition.label, x, y, textOptions);

        // Draw Checkbox
        const s = 12;
        const checkRect = {x: x + 90, y: y - s / 2, w: s, h: s};
        fillRect(context, checkRect, 'white');
        fillRect(context, pad(checkRect, -1), 'black');
        if (scene.activeConditions.has(condition)) {
            fillRect(context, pad(checkRect, -1), '#0F0');
            totalMultiplier += condition.modifier;
        }

        drawText(context, `${condition.modifier}x`, x + 105, y, textOptions);
        // Draw cursor
        if (scene.conditionsIndex === index) {
            context.fillStyle = 'white';
            context.beginPath();
            context.moveTo(x - 10, y - 8);
            context.lineTo(x - 2, y);
            context.lineTo(x - 10, y + 8);
            context.fill();
        }

        y += ROW_HEIGHT;
    }

    const boxWidth = 90, boxHeight = 30;
    drawTextBox(context, {
        x: CANVAS_WIDTH - boxWidth - MARGIN,
        y: CANVAS_HEIGHT - boxHeight - MARGIN, // Position above the high score box
        w: boxWidth,
        h: boxHeight,
    }, `${Math.min(10, totalMultiplier)}x Karma`);
}

const MAX_VISIBLE = 4;
export function renderBossRushMenu(context: CanvasRenderingContext2D, state: GameState, scene: BossRushScene): void {
    const options = getBossRushOptions(state);
    
    // Calculate visible window
    const startIndex = Math.max(0, Math.min(
        scene.bossRushIndex - 1,
        options.length - MAX_VISIBLE
    ));
    const endIndex = Math.min(startIndex + MAX_VISIBLE, options.length);
    const visibleOptions = options.slice(startIndex, endIndex);
    
    const h = ROW_HEIGHT * visibleOptions.length + 8 + 16;
    let r = {
        x: MARGIN,
        y: CANVAS_HEIGHT - MARGIN - h,
        w: 120,
        h,
    };
    fillRect(context, r, 'white');
    fillRect(context, pad(r, -2), 'black');

    r = pad(r, -4);

    context.fillStyle = 'white';
    let x = r.x + 12, y = r.y + ROW_HEIGHT / 2 + 8;

    // Render small arrow pointing right to indicate presence of conditions menu.
    context.fillStyle = 'white';
    const rightX = r.x + r.w - 8;
    context.beginPath();
    context.moveTo(rightX, r.y + r.h / 2 - 4);
    context.lineTo(rightX + 4, r.y + r.h / 2);
    context.lineTo(rightX, r.y + r.h / 2 + 4);
    context.fill();
    
    for (let i = 0; i < visibleOptions.length; i++) {
        const actualIndex = startIndex + i;
        let text = visibleOptions[i].label.slice(0, 13).toUpperCase();
        drawText(context, text, x, y, textOptions);
        
        if (scene.bossRushIndex === actualIndex) {
            context.beginPath();
            context.moveTo(x - 10, y - 8);
            context.lineTo(x - 2, y);
            context.lineTo(x - 10, y + 8);
            context.fill();
        }
        y += ROW_HEIGHT;
    }
    
    if (startIndex > 0) {
        context.fillStyle = 'white';
        const upY = r.y + 4;
        context.beginPath();
        context.moveTo(r.x + r.w / 2 - 4, upY);
        context.lineTo(r.x + r.w / 2, upY - 4);
        context.lineTo(r.x + r.w / 2 + 4, upY);
        context.fill();
    }
    
    if (endIndex < options.length) {
        context.fillStyle = 'white';
        const downY = r.y + r.h - 8;
        context.beginPath();
        context.moveTo(r.x + r.w / 2 - 4, downY);
        context.lineTo(r.x + r.w / 2, downY + 4);
        context.lineTo(r.x + r.w / 2 + 4, downY);
        context.fill();
    }
    // High Score Display
    const bossRushOption = options[scene.bossRushIndex];
    const {bestTime, highScore} = getSavedBossRushData(state, bossRushOption.key);

    const scoreBoxWidth = 120;
    const scoreBoxHeight = 30;

    if (highScore > 0) {
        const karmaValue = highScore > bossRushOption.karma * 10 ? `${10 * bossRushOption.karma}(${highScore})` : highScore;
        drawTextBox(context, {
            x: CANVAS_WIDTH - scoreBoxWidth - MARGIN,
            y: CANVAS_HEIGHT - 3 * (scoreBoxHeight + MARGIN),
            w: scoreBoxWidth,
            h: scoreBoxHeight,
        }, `Karma ${karmaValue}`);
    }
    if (bestTime > 0) {
        drawTextBox(context, {
            x: CANVAS_WIDTH - scoreBoxWidth - MARGIN,
            y: CANVAS_HEIGHT - 2 * (scoreBoxHeight + MARGIN), // Position above the high score box
            w: scoreBoxWidth,
            h: scoreBoxHeight,
        }, `Best ${formatMinutesAndSeconds(bestTime)}`);

    }
    const targetTime = formatMinutesAndSeconds(bossRushOption.targetTime);
    drawTextBox(context, {
        x: CANVAS_WIDTH - scoreBoxWidth - MARGIN,
        y: CANVAS_HEIGHT - 1 * (scoreBoxHeight + MARGIN), // Position above the high score box
        w: scoreBoxWidth,
        h: scoreBoxHeight,
    }, `Goal ${targetTime}`);
}

function drawTextBox(context: CanvasRenderingContext2D, rect: Rect, text: string) {
    fillRect(context, rect, 'white');
    fillRect(context, pad(rect, -2), 'black');

    context.fillStyle = 'white';
    drawText(context, text,
        rect.x + rect.w / 2,
        rect.y + rect.h / 2,
        { ...textOptions, textAlign: 'center' }
    );

}
