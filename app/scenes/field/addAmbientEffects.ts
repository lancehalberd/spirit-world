import { addSparkleAnimation, FieldAnimationEffect } from 'app/content/effects/animationEffect';
// import { FRAME_LENGTH } from 'app/gameConstants';
// import { editingState } from 'app/development/editingState';
import { createAnimation } from 'app/utils/animations';
import { addEffectToArea } from 'app/utils/effects';
import { getCompositeBehaviors} from 'app/utils/getBehaviors';
import Random from 'app/utils/Random';

let points: Point[] = [];
export function addAmbientEffects(this: void, state: GameState) {
    for (let i = 0; i < 1; i++) {
        if (!points.length) {
            for (let y = 4; y < 16 * 16; y += 8) {
                for (let x = 4; x < 16 * 16; x += 8) {
                    points.push({x, y});
                }
            }
            points = Random.shuffle(points);
        }
        //const x = (state.fieldTime * 56 / FRAME_LENGTH) % (state.areaInstance.w * 16);
        //const y = (state.fieldTime * 88 / FRAME_LENGTH) % (state.areaInstance.h * 16);

        const {x, y} = points.pop();
        for (let sy = 0; sy < state.areaInstance.h / 16; sy++) {
            for (let sx = 0; sx < state.areaInstance.w / 16; sx++) {
                addAmbientEffectToPoint(state, state.areaInstance, {x: 256 * sx + x, y: 256 * sy + y});
            }
        }
    }
    /*addAmbientEffectToPoint(state, state.areaInstance, points.pop()
        {
            x: (Math.random() * 16 * state.areaInstance.w),
            y: (Math.random() * 16 * state.areaInstance.h)
        }
    );*/
}


const bubbleGeometry: FrameDimensions = {w: 16, h: 16, content: {x: 3, w: 10, y: 6, h: 4}};
const smallLavaBubbleAnimation = createAnimation('gfx/tiles/lavaAnimations.png', bubbleGeometry, {top: 240, cols: 6, duration: 6}, { loop: false });
const mediumLavaBubbleAnimation = createAnimation('gfx/tiles/lavaAnimations.png', bubbleGeometry, {top: 256, cols: 6, duration: 6, frameMap: [0, 0, 1, 1, 2, 3, 4, 5]}, { loop: false });
const largeLavaBubbleAnimation = createAnimation('gfx/tiles/lavaAnimations.png', bubbleGeometry, {top: 272, cols: 6, duration: 6, frameMap: [0, 0, 1, 1, 2, 2, 3, 3, 4, 5]}, { loop: false });
const lavaBubbleAnimations = [smallLavaBubbleAnimation, mediumLavaBubbleAnimation, largeLavaBubbleAnimation];
const frameMap = [0,1,2,3,4,5,0,1,2,3,4,5,0,1,2,3,4,5];
const lavaDiamond1 = createAnimation('gfx/tiles/lavaAnimations.png', bubbleGeometry, {top: 288, cols: 6, duration: 5, frameMap}, { loop: false });
const lavaDiamond2 = createAnimation('gfx/tiles/lavaAnimations.png', bubbleGeometry, {top: 304, cols: 6, duration: 5, frameMap}, { loop: false });
const lavaDiamond3 = createAnimation('gfx/tiles/lavaAnimations.png', bubbleGeometry, {top: 320, cols: 6, duration: 5, frameMap}, { loop: false });
const lavaDiamondAnimations = [lavaDiamond1, lavaDiamond2, lavaDiamond3];
const iceSparkleAnimation1 = createAnimation('gfx/effects/aura_particles.png', {w: 10, h: 10}, {cols: 2, x: 2, duration: 6, frameMap: [0, 0, 1, 0, 0, 1, 0, 0]}, {loop: false});
const iceSparkleAnimation2 = createAnimation('gfx/effects/aura_particles.png', {w: 10, h: 10}, {cols: 2, x: 2, duration: 6, frameMap: [0, 0, 0, 1, 1, 0, 0]}, {loop: false});
const iceSparkleAnimation3 = createAnimation('gfx/effects/aura_particles.png', {w: 10, h: 10}, {cols: 2, x: 2, duration: 6, frameMap: [0, 1, 1, 1, 1, 0]}, {loop: false});
const iceSparkleAnimations = [iceSparkleAnimation1, iceSparkleAnimation2, iceSparkleAnimation3];
function addAmbientEffectToPoint(this: void, state: GameState, area: AreaInstance, {x, y}: Point) {

    /*const tlBehaviors = getCompositeBehaviors(state, area, {x: x - 2, y: y - 2});
    const trBehaviors = getCompositeBehaviors(state, area, {x: x + 2, y: y - 2});
    const blBehaviors = getCompositeBehaviors(state, area, {x: x - 2, y: y + 2});
    const brBehaviors = getCompositeBehaviors(state, area, {x: x + 2, y: y + 2});*/
    //if (tlBehaviors.isLava && trBehaviors.isLava && blBehaviors.isLava && brBehaviors.isLava) {
    if (getCompositeBehaviors(state, area, {x: x, y}).isLava) {
        if (Math.random() < 0.1) {
            addLavaAnimationEffectToBackground(state, area, Random.element(lavaDiamondAnimations), {x, y});
            return;
        }
        if (Math.random() < 0.1) {
            //addSparkleAnimation(state, area, {x, y, w: 1, h: 1}, { element: 'fire' });
            return;
        }
        addLavaAnimationEffectToBackground(state, area, Random.element(lavaBubbleAnimations), {x, y});
        return;
    }
    if (state.areaInstance === area && state.areaSection?.isHot) {
        const sparkle = addSparkleAnimation(state, area, {x, y, w: 1, h: 1}, { element: 'fire' });
        sparkle.drawPriority = 'foreground';
        return;
    }
    if (area.isCorrosive && Math.random() < 0.2) {
        const sparkle = addAnimationEffectToBackground(state, area, Random.element(iceSparkleAnimations), {x, y});
        // const sparkle = addSparkleAnimation(state, area, {x, y, w: 1, h: 1}, { element: 'ice' });
        sparkle.drawPriority = 'foreground';
        sparkle.vy = 1.5 + Math.random();
        return;
    }

}
function addLavaAnimationEffectToBackground(this: void, state: GameState, area: AreaInstance, animation: FrameAnimation, {x, y}: Point): FieldAnimationEffect {
    const animationEffect = addAnimationEffectToBackground(state, area, animation, {x, y});
    // Lava effects should be culled from the scene any time they are no longer over lava tiles.
    animationEffect.checkToCull = checkToCullLavaEffect;
    return animationEffect;
}

function checkToCullLavaEffect(this: BaseFieldInstance, state: GameState): boolean {
    const hitbox = this.getHitbox();
    return !getCompositeBehaviors(state, this.area, {x: hitbox.x + hitbox.w / 2, y: hitbox.y + hitbox.h / 2}).isLava;
}


function addAnimationEffectToBackground(this: void, state: GameState, area: AreaInstance, animation: FrameAnimation, {x, y}: Point): FieldAnimationEffect {
    const animationEffect = new FieldAnimationEffect({
        animation,
        drawPriority: 'background',
        x, y, centerOnPoint: true
    });
    addEffectToArea(state, area, animationEffect);
    return animationEffect;
}
