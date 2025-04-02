import { getLootFrame } from 'app/content/loot';
import { editingState } from 'app/development/editingState';
import { CANVAS_HEIGHT, CANVAS_WIDTH, isRandomizer, randomizerGoalType } from 'app/gameConstants';
import { getCheckInfo } from 'app/randomizer/checks';
//import { renderTextRow } from 'app/render/renderMessage';
import { renderSpiritBar } from 'app/render/spiritBar';
import { shouldHideMenu } from 'app/state';
import { createAnimation, drawFrame, drawFrameAt, drawFrameCenteredAt } from 'app/utils/animations';
import { requireFrame } from 'app/utils/packedImages';
import { drawText } from 'app/utils/simpleWhiteFont';
import { createCanvasAndContext } from 'app/utils/canvas';
import { getAreaMousePosition } from 'app/development/getAreaMousePosition';
import { KEY, isKeyboardKeyDown } from 'app/userInput';

const [emptyHeart, fullHeart, threeQuarters, halfHeart, quarterHeart] =
    createAnimation('gfx/hud/hearts.png', {w: 10, h: 10}, {cols: 5}).frames;

const [, fullGreyHeart, threeGreyQuarters, halfGreyHeart, quarterGreyHeart] =
    createAnimation('gfx/hud/greyhearts.png', {w: 10, h: 10}, {cols: 5}).frames;

const [, fullFrozenHeart, threeFrozenQuarters, halfFrozenHeart, quarterFrozenHeart] =
    createAnimation('gfx/hud/frozenhearts.png', {w: 10, h: 10}, {cols: 5}).frames;

const [coin] =
    createAnimation('gfx/hud/money.png', {w: 16, h: 16}, {x: 9}).frames;

const [keyFrame, bigKeyFrame] = createAnimation('gfx/hud/icons.png',
    {w: 20, h: 20, content: {x: 2, y: 2, w: 16, h: 16}}, {x: 2, cols: 2}
).frames;

const frameSize = 24;

const yellowFrame = createAnimation('gfx/hud/toprighttemp1.png', {w: frameSize, h: frameSize}).frames[0];
const blueFrame = createAnimation('gfx/hud/toprighttemp2.png', {w: frameSize, h: frameSize}).frames[0];

const [hudCanvas, hudContext] = createCanvasAndContext(CANVAS_WIDTH, CANVAS_HEIGHT);

export function renderHUD(context: CanvasRenderingContext2D, state: GameState): void {
    if (editingState.isEditing) {
        renderEditorHUD(context, state);
        return;
    }
    if (state.hudOpacity <= 0) {
        return;
    }
    if (state.hudOpacity < 1) {
        context.save();
            context.globalAlpha *= state.hudOpacity;
            hudContext.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
            renderHUDProper(hudContext, state);
            context.drawImage(hudCanvas, 0, 0);
        context.restore();
        return;
    }
    renderHUDProper(context, state);
}
function renderHUDProper(context: CanvasRenderingContext2D, state: GameState): void {
    // Draw heart backs, and fillings
    let x = 26;
    let y = 5;
    const normalHeartLife = Math.min(state.hero.life, state.hero.displayLife);
    for (let i = 0; i < state.hero.savedData.maxLife; i++) {
        if (i === 10) {
            y += 11;
            x = 26;
        }
        drawFrame(context, emptyHeart, {...emptyHeart, x, y});
        // Recently lost hearts render semi transparent for a bit.
        if (state.hero.displayLife > state.hero.life) {
            context.save();
                context.globalAlpha *= 0.4 * state.hero.invulnerableFrames / 30;
                let frame = fullHeart;
                if (i >= state.hero.displayLife ) {
                    frame = null;
                } else if (i >= state.hero.displayLife  - 0.25) {
                    frame = quarterHeart;
                } else if (i >= state.hero.displayLife  - 0.5) {
                    frame = halfHeart;
                } else if (i >= state.hero.displayLife  - 0.75) {
                    frame = threeQuarters;
                }
                if (frame) {
                    drawFrame(context, frame, {...frame, x, y});
                }
            context.restore();
        }
        let frame = fullHeart;
        if (i >= normalHeartLife) {
            frame = null;
        } else if (i >= normalHeartLife - 0.25) {
            frame = quarterHeart;
        } else if (i >= normalHeartLife - 0.5) {
            frame = halfHeart;
        } else if (i >= normalHeartLife - 0.75) {
            frame = threeQuarters;
        }
        if (frame) {
            drawFrame(context, frame, {...frame, x, y});
        }
        x += 11;
    }
    // Draw iron skin hearts on top of regular hearts
    x = 26;
    y = 5;
    const effectiveIronSkin = state.hero.frozenHeartDuration > 0
        ? Math.max(0, Math.ceil(state.hero.savedData.ironSkinLife) - 2)
        : state.hero.savedData.ironSkinLife;
    for (let i = 0; i < state.hero.savedData.ironSkinLife; i++) {
        if (i === 10) {
            y += 11;
            x = 26;
        }
        let frame: Frame = fullGreyHeart;
        if (i >= effectiveIronSkin) {
            frame = fullFrozenHeart;
            if (i >= state.hero.savedData.ironSkinLife - 0.25) {
                frame = quarterFrozenHeart;
            } else if (i >= state.hero.savedData.ironSkinLife - 0.5) {
                frame = halfFrozenHeart;
            } else if (i >= state.hero.savedData.ironSkinLife - 0.75) {
                frame = threeFrozenQuarters;
            }
        } else {
            if (i >= state.hero.savedData.ironSkinLife - 0.25) {
                frame = quarterGreyHeart;
            } else if (i >= state.hero.savedData.ironSkinLife - 0.5) {
                frame = halfGreyHeart;
            } else if (i >= state.hero.savedData.ironSkinLife - 0.75) {
                frame = threeGreyQuarters;
            }
        }
        drawFrame(context, frame, {...frame, x, y});
        x += 11;
    }
    const dungeonInventory = state.savedState.dungeonInventories[state.location.logicalZoneKey];
    if (dungeonInventory?.bigKey) {
        drawFrameAt(context, bigKeyFrame, {x: CANVAS_WIDTH - 21, y: 28});
    }
    for (let i = 0; i < dungeonInventory?.smallKeys; i++) {
        //drawFrameAt(context, keyFrame, {x: CANVAS_WIDTH - 14 - 4 * i, y: 34});
        drawFrameAt(context, keyFrame, {x: CANVAS_WIDTH - 14 - 3 * (i % 2), y: 30 + 3 * i});
    }
    renderSpiritBar(context, state);

    let frame = getLootFrame(state, {lootType: state.hero.savedData.leftTool, lootLevel: state.hero.savedData.activeTools[state.hero.savedData.leftTool]});
    let target = {w: frameSize, h: frameSize, x: CANVAS_WIDTH - 50, y: 4};
    //fillRect(context, pad(target, 2), LEFT_TOOL_COLOR);
    //fillRect(context, target, 'black');
    drawFrameAt(context, blueFrame, target);
    if (state.hero.savedData.leftTool) {
        drawFrameCenteredAt(context, frame, target)
    }
    frame = getLootFrame(state, {lootType: state.hero.savedData.rightTool, lootLevel: state.hero.savedData.activeTools[state.hero.savedData.rightTool]});
    target = {w: frameSize, h: frameSize, x: CANVAS_WIDTH - 25, y: 4};
    //fillRect(context, pad(target, 2), RIGHT_TOOL_COLOR);
    //fillRect(context, target, 'black');
    drawFrameAt(context, yellowFrame, target);
    if (state.hero.savedData.rightTool) {
        drawFrameCenteredAt(context, frame, target);
    }

    drawFrame(context, coin, {...coin, x: CANVAS_WIDTH - 110, y: 4});
    let moneyText = `${state.hero.savedData.money}`;
    while (moneyText.length < 4) moneyText = '0' + moneyText;
    drawText(context, moneyText, CANVAS_WIDTH - 90, 14, {
        textBaseline: 'middle',
        textAlign: 'left',
        size: 16,
    });

    // Show boss health bars from both realms.
    const bossesWithHealthBars = [...state.areaInstance.enemies, ...state.alternateAreaInstance.enemies].filter(
        e => e.status !== 'gone' && e.definition.type === 'boss'
            && e.isFromCurrentSection(state) && e.healthBarTime >= 100
    ) as Enemy[];
    y = CANVAS_HEIGHT
    if (bossesWithHealthBars.length) {
        const totalSpace = CANVAS_WIDTH - 40 - (bossesWithHealthBars.length - 1) * 20 + 4;
        const barHeight = 6;
        const barWidth = (totalSpace / bossesWithHealthBars.length) | 0;
        y -= 12;
        x = 24;
        for (const boss of bossesWithHealthBars) {
            renderBossHealthBar(context, state, boss, {x, y, w: barWidth, h: barHeight});
            x += barWidth + 20;
        }
        y -= 6;
    }
    const otherEnemiesWithHealthBars = [...state.areaInstance.enemies, ...state.alternateAreaInstance.enemies].filter(
        e => e.status !== 'gone' && e.definition.type !== 'boss' && e.enemyDefinition.showHealthBar
            && e.isFromCurrentSection(state) && e.healthBarTime >= 100
    );
    if (otherEnemiesWithHealthBars.length) {
        const totalSpace = CANVAS_WIDTH - 32 - (otherEnemiesWithHealthBars.length - 1) * 20 + 4;
        const barHeight = 4;
        // This probably won't work when there are more than three such enemies.
        const barWidth = (totalSpace / Math.max(3, otherEnemiesWithHealthBars.length)) | 0;
        y -= barHeight;
        x = 45;
        for (const enemy of otherEnemiesWithHealthBars) {
            renderMinionHealthBar(context, state, enemy, {x, y, w: barWidth, h: barHeight});
            x += barWidth + 20;
        }
    }
    if (isRandomizer) {
        // Freeze on the display of the win time once the game is completed.
        let seconds = (state.hero.savedData.winTime || state.hero.savedData.playTime) / 1000;
        const hours = (seconds / 3600) | 0;
        const minutes = ((seconds - hours * 3600) / 60) | 0;
        seconds = seconds % 60;
        const minutesString = `${minutes}`.padStart(2, '0');
        const secondsString = seconds.toFixed(1).padStart(4, '0');
        const timeString = `${hours}:${minutesString}:${secondsString}`;
        const info = getCheckInfo(state);
        if (randomizerGoalType === 'victoryPoints') {
            drawText(context, `${Math.max(0, state.randomizer.goal - state.hero.savedData.victoryPoints)}`, 2, CANVAS_HEIGHT - 8 - 16, {
                textBaseline: 'middle',
                textAlign: 'left',
                size: 16,
            });
        }
        drawText(context, timeString, 2, CANVAS_HEIGHT - 8, {
            textBaseline: 'middle',
            textAlign: 'left',
            size: 16,
        });
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
        if (effects.drawPriority === 'hud' || effects.getDrawPriority?.(state) === 'hud') {
            effects.render(context, state);
        }
    }
    if (state.paused && shouldHideMenu(state)) {
        // renderTextRow(context, 'PAUSED', {x: 8, y: CANVAS_HEIGHT - 22});
    }
}

export function renderEditorHUD(context: CanvasRenderingContext2D, state: GameState): void {
    const [sx, sy] = getAreaMousePosition();
    const x = sx + state.camera.x;
    const y = sy + state.camera.y;
    /*drawText(context, `${x | 0}x${y | 0}`,
        (sx > CANVAS_WIDTH / 2) ? 2 : CANVAS_WIDTH - 2,
        (sy > CANVAS_HEIGHT / 2) ? 2 : CANVAS_HEIGHT - 2,
        {
            textBaseline: (sy > CANVAS_HEIGHT / 2) ? 'top' : 'bottom',
            textAlign:  (sx > CANVAS_WIDTH / 2) ? 'left' : 'right' ,
            size: 16,
        }
    );*/
    if (isKeyboardKeyDown(KEY.SHIFT)) {
        drawText(context, `${x | 0}x${y | 0}`,
            CANVAS_WIDTH - 2,
            CANVAS_HEIGHT - 2,
            {
                textBaseline: 'bottom',
                textAlign: 'right' ,
                size: 16,
            }
        )
    }
    const rightLayer = Object.keys(editingState.brush ?? {}).find(
        key => editingState.brush?.[key]?.tiles?.[0]?.[0] !== 0  && editingState.brush?.[key]?.tiles?.[0]?.[0] !== undefined 
    );
    
    if (rightLayer) {
        drawText(
            context,
            String(editingState.brush?.[rightLayer]?.tiles?.[0]?.[0] ?? 0), 
            10,
            CANVAS_HEIGHT - 2,
            {
                textBaseline: 'bottom',
                textAlign: 'left',
                size: 16,
            }
        );
    }
}

const skullFrame = requireFrame('gfx/hud/bossBar.png', {x: 2, y: 93, w: 30, h: 19});
const leftClawFrame = requireFrame('gfx/hud/bossBar.png', {x: 17, y: 65, w: 14, h: 14});
const rightClawFrame = requireFrame('gfx/hud/bossBar.png', {x: 81, y: 65, w: 14, h: 14});

const leftBarBack = requireFrame('gfx/hud/bossBar.png', {x: 23, y: 45, w: 2, h: 6});
const middleBarBack = requireFrame('gfx/hud/bossBar.png', {x: 25, y: 45, w: 1, h: 6});
const rightBarBack = requireFrame('gfx/hud/bossBar.png', {x: 87, y: 45, w: 2, h: 6});

const leftCover = requireFrame('gfx/hud/bossBar.png', {x: 23, y: 30, w: 2, h: 6});
const middleCover = requireFrame('gfx/hud/bossBar.png', {x: 25, y: 30, w: 1, h: 6});
// This is quite long because of the light glare on the right part of the cover to give it a glassy effect.
const rightCover = requireFrame('gfx/hud/bossBar.png', {x: 60, y: 30, w: 29, h: 6});

function renderBossHealthBar(context: CanvasRenderingContext2D, state: GameState, boss: Enemy, r: Rect) {
    const w = Math.floor(r.w * Math.max(0, Math.min(1, (boss.healthBarTime - 100) / 1000)));
    if (w < 2) {
        return;
    }
    renderHealthBar(context, state, boss, {...r, w});
    drawFrameAt(context, skullFrame, {x: r.x - 20, y: r.y - 9});
}

function renderMinionHealthBar(context: CanvasRenderingContext2D, state: GameState, enemy: Enemy, r: Rect) {
    const w = Math.floor(r.w * Math.max(0, Math.min(1, (enemy.healthBarTime - 100) / 1000)));
    if (w < 2) {
        return;
    }
    r = {...r, x: r.x + r.w / 2 - w / 2, w};
    renderHealthBar(context, state, enemy, r);
    drawFrameAt(context, leftClawFrame, {x: r.x - 6, y: r.y - 5});
    drawFrameAt(context, rightClawFrame, {x: r.x + w - 8, y: r.y - 5});
}

function renderHealthBar(context: CanvasRenderingContext2D, state: GameState, enemy: Enemy, r: Rect) {
    const w = r.w;
    if (w < 2) {
        return;
    }
    // Draw the expanding background of the bar.
    drawFrameAt(context, leftBarBack, {x: r.x, y: r.y});
    let midWidth = w - 4;
    if (midWidth > 0) {
        drawFrame(context, middleBarBack, {x: r.x + 2, y: r.y, w: midWidth, h: middleBarBack.h});
    }
    drawFrameAt(context, rightBarBack, {x: r.x + w - 2, y: r.y});

    const healthWidth = (w - 2) * enemy.getHealthPercent(state) | 0;
    if (healthWidth > 0) {
        context.fillStyle = enemy.healthBarColor ?? (enemy.definition.type === 'boss' ? '#E31B1B' : 'orange');
        context.fillRect(r.x + 1, r.y + 1, healthWidth, 4);
    }
    const shieldWidth = (w - 4) * enemy.getShieldPercent(state) | 0;
    if (shieldWidth > 0) {
        context.fillStyle = 'white';
        context.fillRect(Math.floor(r.x + r.w / 2 - shieldWidth / 2), r.y + 1, shieldWidth, 1);
        context.fillRect(Math.floor(r.x + r.w / 2 - shieldWidth / 2), r.y + 4, shieldWidth, 1);
    }


    drawFrameAt(context, leftCover, {x: r.x, y: r.y});
    midWidth = w - leftCover.w - rightCover.w;
    if (midWidth > 0) {
        drawFrame(context, middleCover, {x: r.x + 2, y: r.y, w: midWidth, h: middleCover.h});
    }
    const rightWidth = Math.min(rightCover.w, w - leftCover.w);
    if (rightWidth < rightCover.w) {
        drawFrameAt(context, {...rightCover, x: rightCover.x + rightCover.w - rightWidth, w: rightWidth}, {x: r.x + w - rightWidth, y: r.y});
    } else {
        drawFrameAt(context, rightCover, {x: r.x + w - rightCover.w, y: r.y});
    }
}
