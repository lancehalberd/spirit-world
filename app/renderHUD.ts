import { getLootFrame } from 'app/content/lootObject';
import { CANVAS_HEIGHT, CANVAS_WIDTH } from 'app/gameConstants';
import { getCheckInfo } from 'app/randomizer/checks';
import { renderTextRow } from 'app/render/renderMessage';
import { renderSpiritBar } from 'app/render/spiritBar';
import { createAnimation, drawFrame, drawFrameAt, drawFrameCenteredAt } from 'app/utils/animations';
import { readGetParameter } from 'app/utils/index';
import { drawText } from 'app/utils/simpleWhiteFont';

import { Enemy, GameState } from 'app/types';

const [emptyHeart, fullHeart, threeQuarters, halfHeart, quarterHeart] =
    createAnimation('gfx/hud/hearts.png', {w: 10, h: 10}, {cols: 5}).frames;

const [coin] =
    createAnimation('gfx/hud/money.png', {w: 16, h: 16}, {x: 9}).frames;

const [keyFrame, bigKeyFrame] = createAnimation('gfx/hud/icons.png',
    {w: 18, h: 18, content: {x: 1, y: 1, w: 16, h: 16}}, {x: 2, cols: 2}
).frames;

const frameSize = 24;

const yellowFrame = createAnimation('gfx/hud/toprighttemp1.png', {w: frameSize, h: frameSize}).frames[0];
const blueFrame = createAnimation('gfx/hud/toprighttemp2.png', {w: frameSize, h: frameSize}).frames[0];

const isRandomizer = !!readGetParameter('seed');

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
        drawFrameAt(context, bigKeyFrame, {x: CANVAS_WIDTH - 21, y: 28});
    }
    for (let i = 0; i < dungeonInventory?.smallKeys; i++) {
        drawFrameAt(context, keyFrame, {x: CANVAS_WIDTH - 14 - 4 * i, y: 32});
    }
    renderSpiritBar(context, state);

    let frame = getLootFrame(state, {lootType: state.hero.leftTool, lootLevel: state.hero.activeTools[state.hero.leftTool]});
    let target = {w: frameSize, h: frameSize, x: CANVAS_WIDTH - 50, y: 4};
    //fillRect(context, pad(target, 2), LEFT_TOOL_COLOR);
    //fillRect(context, target, 'black');
    drawFrameAt(context, blueFrame, target);
    if (state.hero.leftTool) {
        drawFrameCenteredAt(context, frame, target)
    }
    frame = getLootFrame(state, {lootType: state.hero.rightTool, lootLevel: state.hero.activeTools[state.hero.rightTool]});
    target = {w: frameSize, h: frameSize, x: CANVAS_WIDTH - 25, y: 4};
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

    // Show boss health bars from both realms.
    const bosses = [...state.areaInstance.enemies, ...state.alternateAreaInstance.enemies].filter(
        e => e.status !== 'gone' && e.definition.type === 'boss' && e.isFromCurrentSection(state)
    ) as Enemy[];
    if (bosses.length) {
        const totalSpace = CANVAS_WIDTH - 32 - bosses.length * 4 + 4;
        const barHeight = 6;
        const barWidth = (totalSpace / bosses.length) | 0;
        y = CANVAS_HEIGHT - 16;
        x = 16;
        for (const boss of bosses) {
            const animatedWidth = barWidth * Math.min(1, boss.healthBarTime / 1000);
            context.fillStyle = 'black';
            context.fillRect(x, y, animatedWidth, barHeight);
            const healthWidth = animatedWidth * boss.getHealthPercent(state) | 0;
            if (healthWidth > 0) {
                context.fillStyle = 'red';
                context.fillRect(x, y, healthWidth, barHeight);
            }
            const shieldWidth = animatedWidth * boss.getShieldPercent(state) | 0;
            if (shieldWidth > 0) {
                context.fillStyle = 'white';
                context.fillRect(x, y, shieldWidth, 2);
                context.fillRect(x, y + barHeight - 2, shieldWidth, 2);
            }
            x += barWidth + 4;
        }
    }
    if (isRandomizer) {
        const info = getCheckInfo(state);
        drawText(context, `${info.zoneChecksCompleted}/${info.totalZoneChecks}`, CANVAS_WIDTH - 2, CANVAS_HEIGHT - 8 - 16, {
            textBaseline: 'middle',
            textAlign: 'right',
            size: 16,
        });
        drawText(context, `${info.checksCompleted}/${info.totalChecks}`, CANVAS_WIDTH - 2, CANVAS_HEIGHT - 8, {
            textBaseline: 'middle',
            textAlign: 'right',
            size: 16,
        });
    }
    for (const effects of (state.areaInstance?.effects || [])) {
        if (effects.drawPriority === 'hud') {
            effects.render(context, state);
        }
    }
    if (state.paused && !state.defeatState.defeated && !state.areaInstance?.priorityObjects?.length
        && (state.transitionState || state.nextAreaInstance || state.nextAreaSection)
    ) {
        renderTextRow(context, 'PAUSED', {x: 8, y: CANVAS_HEIGHT - 22});
    }
}
