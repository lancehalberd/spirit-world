import { getLootFrame } from 'app/content/lootObject';
import { CANVAS_HEIGHT, CANVAS_WIDTH } from 'app/gameConstants';
import { renderSpiritBar } from 'app/render/spiritBar';
import { createAnimation, drawFrame, drawFrameAt, drawFrameCenteredAt } from 'app/utils/animations';
import { drawText } from 'app/utils/simpleWhiteFont';

import { Enemy, GameState } from 'app/types';

const [emptyHeart, fullHeart, threeQuarters, halfHeart, quarterHeart] =
    createAnimation('gfx/hud/hearts.png', {w: 10, h: 10}, {cols: 5}).frames;

const [coin] =
    createAnimation('gfx/hud/money.png', {w: 16, h: 16}, {x: 9}).frames;

const [keyFrame, bigKeyFrame] = createAnimation('gfx/hud/icons.png',
    {w: 18, h: 18, content: {x: 1, y: 1, w: 16, h: 16}}, {x: 8, cols: 2}
).frames;

const yellowFrame = createAnimation('gfx/hud/toprighttemp1.png', {w: 22, h: 22}).frames[0];
const blueFrame = createAnimation('gfx/hud/toprighttemp2.png', {w: 22, h: 22}).frames[0];

export function renderHUD(context: CanvasRenderingContext2D, state: GameState): void {
    let x = 26;
    let y = 5;
    for (let i = 0; i < state.hero.maxLife; i++) {
        if (i === 10) {
            y += 11;
            x = 26;
        }
        drawFrame(context, emptyHeart, {...emptyHeart, x, y});
        let frame = fullHeart;
        if (i >= state.hero.life) {
            frame = emptyHeart;
        } else if (i >= state.hero.life - 0.25) {
            frame = quarterHeart;
        } else if (i >= state.hero.life - 0.5) {
            frame = halfHeart;
        } else if (i >= state.hero.life - 0.75) {
            frame = threeQuarters;
        }
        drawFrame(context, frame, {...frame, x, y});
        x += 11;
    }
    const dungeonInventory = state.savedState.dungeonInventories[state.location.zoneKey];
    if (dungeonInventory?.bigKey) {
        drawFrameAt(context, bigKeyFrame, {x: CANVAS_WIDTH - 21, y: 24});
    }
    for (let i = 0; i < dungeonInventory?.smallKeys; i++) {
        drawFrameAt(context, keyFrame, {x: CANVAS_WIDTH - 14 - 4 * i, y: 28});
    }
    renderSpiritBar(context, state);

    let frame = getLootFrame({lootType: state.hero.leftTool, lootLevel: state.hero.activeTools[state.hero.leftTool]});
    let target = {w: 22, h: 22, x: CANVAS_WIDTH - 48, y: 4};
    //fillRect(context, pad(target, 2), LEFT_TOOL_COLOR);
    //fillRect(context, target, 'black');
    drawFrameAt(context, blueFrame, target);
    if (state.hero.leftTool) {
        drawFrameCenteredAt(context, frame, target)
    }
    frame = getLootFrame({lootType: state.hero.rightTool, lootLevel: state.hero.activeTools[state.hero.rightTool]});
    target = {w: 22, h: 22, x: CANVAS_WIDTH - 24, y: 4};
    //fillRect(context, pad(target, 2), RIGHT_TOOL_COLOR);
    //fillRect(context, target, 'black');
    drawFrameAt(context, yellowFrame, target);
    if (state.hero.rightTool) {
        drawFrameCenteredAt(context, frame, target);
    }

    drawFrame(context, coin, {...coin, x: CANVAS_WIDTH - 110, y: 4});
    let moneyText = `${state.hero.money}`;
    while (moneyText.length < 4) moneyText = '0' + moneyText;
    drawText(context, moneyText, CANVAS_WIDTH - 90, 14, {
        textBaseline: 'middle',
        textAlign: 'left',
        size: 16,
    });

    const bosses = state.areaInstance.enemyTargets.filter(e => e instanceof Enemy && e.definition.type === 'boss') as Enemy[];
    if (bosses.length) {
        const totalSpace = CANVAS_WIDTH - 32 - bosses.length * 4 + 4;
        const barHeight = 6;
        const barWidth = (totalSpace / bosses.length) | 0;
        y = CANVAS_HEIGHT - 16 - 6;
        x = 16;
        for (const boss of bosses) {
            context.fillStyle = 'black';
            context.fillRect(x, y, barWidth, barHeight);
            const healthWidth = barWidth * boss.getHealthPercent(state) | 0;
            if (healthWidth > 0) {
                context.fillStyle = 'red';
                context.fillRect(x, y, healthWidth, barHeight);
            }
            const shieldWidth = barWidth * boss.getShieldPercent(state) | 0;
            if (shieldWidth > 0) {
                context.fillStyle = 'white';
                context.fillRect(x, y, shieldWidth, 2);
                context.fillRect(x, y + barHeight - 2, shieldWidth, 2);
            }
            x += barWidth + 4;
        }
    }
}
