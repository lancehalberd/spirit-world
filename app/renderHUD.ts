import { getLootFrame } from 'app/content/lootObject';
import { CANVAS_WIDTH, LEFT_TOOL_COLOR, RIGHT_TOOL_COLOR } from 'app/gameConstants';
import { renderSpiritBar } from 'app/render/spiritBar';
import { createAnimation, drawFrame, drawFrameAt } from 'app/utils/animations';
import { fillRect, pad } from 'app/utils/index';
import { drawText } from 'app/utils/simpleWhiteFont';

import { GameState } from 'app/types';

const [emptyHeart, fullHeart, threeQuarters, halfHeart, quarterHeart] =
    createAnimation('gfx/hud/hearts.png', {w: 10, h: 10}, {cols: 5}).frames;

const [coin] =
    createAnimation('gfx/hud/money.png', {w: 16, h: 16}, {x: 9}).frames;

const [keyFrame, bigKeyFrame] = createAnimation('gfx/hud/icons.png',
    {w: 18, h: 18, content: {x: 1, y: 1, w: 16, h: 16}}, {x: 6, cols: 2}
).frames;

export function renderHUD(context: CanvasRenderingContext2D, state: GameState): void {
    let x = 26;
    for (let i = 0; i < state.hero.maxLife; i++) {
        drawFrame(context, emptyHeart, {...emptyHeart, x: x + i * 11, y: 5});
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
        drawFrame(context, frame, {...frame, x: x + i * 11, y: 5});
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
    let target = {...frame, x: CANVAS_WIDTH - 44, y: 4};
    fillRect(context, pad(target, 2), LEFT_TOOL_COLOR);
    if (state.hero.leftTool) {
        drawFrame(context, frame, target)
    } else {
        fillRect(context, target, 'black');
    }
    frame = getLootFrame({lootType: state.hero.rightTool, lootLevel: state.hero.activeTools[state.hero.rightTool]});
    target = {...frame, x: CANVAS_WIDTH - 20, y: 4};
    fillRect(context, pad(target, 2), RIGHT_TOOL_COLOR);
    if (state.hero.rightTool) {
        drawFrame(context, frame, target);
    } else {
        fillRect(context, target, 'black');
    }

    drawFrame(context, coin, {...coin, x: CANVAS_WIDTH - 110, y: 4});
    let moneyText = `${state.hero.money}`;
    while (moneyText.length < 4) moneyText = '0' + moneyText;
    drawText(context, moneyText, CANVAS_WIDTH - 90, 14, {
        textBaseline: 'middle',
        textAlign: 'left',
        size: 16,
    });
}
