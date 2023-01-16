import { createCanvasAndContext } from 'app/dom';
import { createAnimation, drawFrame, getFrame } from 'app/utils/animations';

import { Frame, GameState } from 'app/types';


const [
    /*topCap*/, bottomCap,
    // These are drawn on the top/bottom 5px of the bar itself.
    topBar, bottomBar,
    barBack,
    // These are all small image that create the fill for the spirit bar.
    // This is the very bottom of the fill and always drawn unless spirit is < 1.
    spiritBottom,
    // This is stretched to fill the bulk of the spirit bar.
    spiritFill,
    // This is drawn at the top of the filled portion as an indicator for the current amount.
    spiritLine,
    // This is only drawn when the spirit bar is at 100%
    spiritTop
] =
    createAnimation('gfx/hud/magicbar.png', {w: 16, h: 16}, {cols: 9}).frames;

const topCapHeight = 20;
const reviveAnimation = createAnimation('gfx/hud/revive.png', {w: 32, h: 20},
    {cols: 5, frameMap: [0, 1, 2, 3, 3, 4], duration: 5}, {loop: false}
);
const reviveGlowAnimation = createAnimation('gfx/hud/revive.png', {w: 32, h: 20},
    {x: 5, cols: 5, duration: 5, frameMap: [4, 3, 2, 1]}, {loop: false});
const reviveGlowAnimationLoop = createAnimation('gfx/hud/revive.png', {w: 32, h: 20},
    {x: 5, cols: 5, duration: 25, frameMap: [0, 1]});

export const [
    elementContainer , fireElement, iceElement, lightningElement, neutralElement, elementShine
] = createAnimation('gfx/hud/elementhud.png',
    {w: 20, h: 20}, {cols: 6}
).frames;

// This frame needs to have the exact height+y set on it so that it stretches verically correctly.
spiritFill.y = 13;
spiritFill.h = 1;

const [spiritBarFrameCanvas, spiritBarFrameContext] = createCanvasAndContext(32, 100 + 32);
const spiritFrame: Frame = {
    image: spiritBarFrameCanvas,
    x: 0, y: 0,
    w: spiritBarFrameCanvas.width, h: spiritBarFrameCanvas.height,
};
let lastFrameHeight: number, hadRevive: boolean = false;
function updateSpiritBarFrame(state: GameState): void {
    const reviveAnimationTime = state.fieldTime - state.reviveTime;
    const hasRevive = state.hero.hasRevive && !state.defeatState.defeated;
    if (lastFrameHeight === state.hero.maxMagic
        && hadRevive === hasRevive
        && reviveAnimationTime >= reviveAnimation.duration) {
        return;
    }
    const context = spiritBarFrameContext;
    lastFrameHeight = state.hero.maxMagic;
    hadRevive = hasRevive;
    context.clearRect(0, 0, spiritFrame.w, spiritFrame.h);
    drawFrame(context, barBack, {...barBack, x: 8, y: topCapHeight, h: lastFrameHeight});
    if (hasRevive) {
        const frame = getFrame(reviveAnimation, reviveAnimationTime);
        drawFrame(context, frame, {...frame, x: 0, y: 0});
    } else {
        const frame = getFrame(reviveAnimation, Math.max(0, reviveAnimation.duration - reviveAnimationTime));
        drawFrame(context, frame, {...frame, x: 0, y: 0});
    }
    drawFrame(context, topBar, {...topBar, x: 8, y: topCapHeight});
    drawFrame(context, bottomBar, {...bottomBar, x: 8, y: topCapHeight + lastFrameHeight - bottomBar.h});
    if (state.hero.passiveTools.charge > 0) {
        drawFrame(context, elementContainer, {...elementContainer, x: 6, y: topCapHeight + lastFrameHeight});
    } else {
        drawFrame(context, bottomCap, {...bottomCap, x: 8, y: topCapHeight + lastFrameHeight});
    }
}

export function renderSpiritBar(context: CanvasRenderingContext2D, state: GameState): void {
    context.fillStyle = 'black';
    updateSpiritBarFrame(state);
    const x = 5, y = 5;
    drawFrame(context, spiritFrame, {...spiritFrame, x: x - 8, y});
    // Draw the glow effect on top of the top cap if appropriate.
    const reviveAnimationTime = state.fieldTime - state.reviveTime;
    const hasRevive = state.hero.hasRevive && !state.defeatState.defeated;
    if (hasRevive && reviveAnimationTime >= 400) {
        let animationTime = reviveAnimationTime - 400;
        // Start with the initial glow animation that plays with the top revive animation intro.
        let frame = getFrame(reviveGlowAnimation, reviveAnimationTime - 400);
        // Switch to the slow repeating animation after the intro is finished.
        if (animationTime > reviveGlowAnimation.duration) {
            frame = getFrame(reviveGlowAnimationLoop, animationTime - reviveGlowAnimation.duration);
        }
        drawFrame(context, frame, {...frame, x: x - 8, y});
    } else if (!hasRevive && reviveAnimationTime < reviveGlowAnimation.duration) {
        // This animation plays through once on revive ending in the glow disappearing.
        const frame = getFrame(reviveGlowAnimation, reviveAnimationTime);
        drawFrame(context, frame, {...frame, x: x - 8, y});
    }
    const barHeight = state.hero.maxMagic;
    if (state.hero.magic >= 1) {
        drawFrame(context, spiritBottom, {...spiritBottom, x, y: y + topCapHeight + barHeight - spiritBottom.h + 1});
    }
    const fillHeight = Math.floor(state.hero.magic);
    if (fillHeight > 0) {
        drawFrame(context, spiritFill, {...spiritFill, x, y: y + topCapHeight + barHeight - fillHeight, h: fillHeight});
        // Draw the top of the spirit bar at 100%, otherwise draw the indicator line at the top of the fill.
        if (fillHeight >= state.hero.maxMagic) {
            drawFrame(context, spiritTop, {...spiritTop, x, y: y + topCapHeight - 1});
        } else if (fillHeight > 1) {
            drawFrame(context, spiritLine, {...spiritLine, x, y: y + topCapHeight + barHeight - fillHeight});
        }
    }
    if (state.renderMagicCooldown) {
        const cooldownHeight = Math.floor(state.hero.magicRegenCooldown / 100);
        if (cooldownHeight > 0) {
            context.fillStyle = 'purple';
            context.fillRect(x + 6, y + topCapHeight + barHeight - cooldownHeight, 2, cooldownHeight);
        }
    }
    if (state.hero.passiveTools.charge) {
        let elementFrame = neutralElement;
        if (state.hero.element === 'fire') {
            elementFrame = fireElement;
        } else if (state.hero.element === 'ice') {
            elementFrame = iceElement;
        } else if (state.hero.element === 'lightning') {
            elementFrame = lightningElement;
        }
        drawFrame(context, elementFrame, {...elementFrame, x: x - 2, y: y + topCapHeight + barHeight});
        drawFrame(context, elementShine, {...elementShine, x: x - 2, y: y + topCapHeight + barHeight});
        /*context.save();
            context.globalAlpha = 0.6;
            context.fillStyle = (state.hero.action === 'charging' && state.time % 200 < 100) ? 'white' : elementColor;
            context.beginPath();
            context.arc(x + 8, y + topCapHeight + barHeight + 6, 10,0, 2 * Math.PI);
            context.fill();
        context.restore();*/

    }

}

export function updateHeroMagicStats(state: GameState) {
    state.hero.magicRegenCooldownLimit = 2000;
    // Normally, Hero has no spirit energy until they have eaten a golden peach,
    // which automatically gives them magic + catEyes.
    // During randomizer seeds, Hero always has access to spirit energy.
    if (!state.hero.passiveTools.catEyes && !state.randomizer?.seed) {
        state.hero.maxMagic = 20;
        state.hero.magic = 0;
        state.hero.magicRegen = 0;
        return;
    }
    state.hero.maxMagic = 20;
    state.hero.magicRegen = 4;
    // Cloak increases max magic but not magic regen.
    if (state.hero.activeTools.cloak) {
        state.hero.maxMagic += 10;
    }
    if (state.hero.passiveTools.charge >= 1) {
        state.hero.maxMagic += 10;
        state.hero.magicRegen += 1;
        state.hero.magicRegenCooldownLimit -= 200;
    }
    if (state.hero.passiveTools.charge >= 2) {
        state.hero.maxMagic += 10;
        state.hero.magicRegen += 2;
        state.hero.magicRegenCooldownLimit -= 200;
    }
    if (state.hero.elements.fire) {
        state.hero.maxMagic += 10;
        state.hero.magicRegen += 1;
        state.hero.magicRegenCooldownLimit -= 200;
    }
    if (state.hero.elements.ice) {
        state.hero.maxMagic += 10;
        state.hero.magicRegen += 1;
        state.hero.magicRegenCooldownLimit -= 200;
    }
    if (state.hero.elements.lightning) {
        state.hero.maxMagic += 10;
        state.hero.magicRegen += 1;
        state.hero.magicRegenCooldownLimit -= 200;
    }
    if (state.hero.passiveTools.phoenixCrown) {
        state.hero.maxMagic += 20;
        state.hero.magicRegen += 6;
        state.hero.magicRegenCooldownLimit /= 2;
    }
}


