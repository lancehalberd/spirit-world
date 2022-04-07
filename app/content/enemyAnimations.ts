import { createAnimation } from 'app/utils/animations';

import { ActorAnimations, FrameAnimation, FrameDimensions } from 'app/types';

const enemyDeathGeometry: FrameDimensions = {w: 20, h: 20};
export const enemyDeathAnimation: FrameAnimation = createAnimation('gfx/effects/enemydeath.png', enemyDeathGeometry, { cols: 9, duration: 4}, { loop: false });

// 252x28
const bossDeathExplosionGeometry: FrameDimensions = {w: 28, h: 28};
export const bossDeathExplosionAnimation: FrameAnimation
    = createAnimation('gfx/effects/powersource_explosion.png', bossDeathExplosionGeometry, { cols: 9, duration: 4}, { loop: false });


const snakeGeometry: FrameDimensions = { w: 18, h: 18, content: { x: 2, y: 6, w: 14, h: 11} };
const leftSnakeAnimation: FrameAnimation = createAnimation('gfx/enemies/snek.png', snakeGeometry, { x: 0});
const downSnakeAnimation: FrameAnimation = createAnimation('gfx/enemies/snek.png', snakeGeometry, { x: 1});
const upSnakeAnimation: FrameAnimation = createAnimation('gfx/enemies/snek.png', snakeGeometry, { x: 2});
export const snakeAnimations: ActorAnimations = {
    idle: {
        up: upSnakeAnimation,
        down: downSnakeAnimation,
        left: leftSnakeAnimation,
        right: leftSnakeAnimation,
    },
};
const beetleGeometry: FrameDimensions = { w: 18, h: 17, content: { x: 2, y: 4, w: 14, h: 12} };
const beetleDownAnimation: FrameAnimation = createAnimation('gfx/enemies/genericbeetle.png', beetleGeometry, { y: 0, cols: 4});
const beetleRightAnimation: FrameAnimation = createAnimation('gfx/enemies/genericbeetle.png', beetleGeometry, { y: 1, cols: 4});
const beetleUpAnimation: FrameAnimation = createAnimation('gfx/enemies/genericbeetle.png', beetleGeometry, { y: 2, cols: 4});
const beetleLeftAnimation: FrameAnimation = createAnimation('gfx/enemies/genericbeetle.png', beetleGeometry, { y: 4, cols: 4});
const beetleClimbAnimation: FrameAnimation = createAnimation('gfx/enemies/genericbeetle.png', beetleGeometry, { y: 3, cols: 4});

export const beetleAnimations: ActorAnimations = {
    climbing: {
        up: beetleClimbAnimation,
        down: beetleClimbAnimation,
        left: beetleClimbAnimation,
        right: beetleClimbAnimation,
    },
    idle: {
        up: beetleUpAnimation,
        down: beetleDownAnimation,
        left: beetleLeftAnimation,
        right: beetleRightAnimation,
    },
};

export const climbingBeetleAnimations: ActorAnimations = {
    idle: {
        up: beetleClimbAnimation,
        down: beetleClimbAnimation,
        left: beetleClimbAnimation,
        right: beetleClimbAnimation,
    },
};

const beetleMiniGeometry: FrameDimensions = { w: 10, h: 10 };
const beetleMiniDownAnimation: FrameAnimation = createAnimation('gfx/enemies/smallbeetle.png', beetleMiniGeometry, { x: 0, cols: 2});
const beetleMiniRightAnimation: FrameAnimation = createAnimation('gfx/enemies/smallbeetle.png', beetleMiniGeometry, { x: 2, cols: 2});
const beetleMiniUpAnimation: FrameAnimation = createAnimation('gfx/enemies/smallbeetle.png', beetleMiniGeometry, { x: 4, cols: 2});
const beetleMiniLeftAnimation: FrameAnimation = createAnimation('gfx/enemies/smallbeetle.png', beetleMiniGeometry, { x: 7, cols: 2});
export const beetleMiniAnimations: ActorAnimations = {
    idle: {
        up: beetleMiniUpAnimation,
        down: beetleMiniDownAnimation,
        left: beetleMiniLeftAnimation,
        right: beetleMiniRightAnimation,
    },
};

const beetleHornedGeometry: FrameDimensions = { w: 22, h: 18, content: { x: 4, y: 4, w: 14, h: 13} };
const beetleHornedDownAnimation: FrameAnimation = createAnimation('gfx/enemies/hornedbeetle.png', beetleHornedGeometry, { y: 0, cols: 4});
const beetleHornedRightAnimation: FrameAnimation = createAnimation('gfx/enemies/hornedbeetle.png', beetleHornedGeometry, { y: 2, cols: 4});
const beetleHornedUpAnimation: FrameAnimation = createAnimation('gfx/enemies/hornedbeetle.png', beetleHornedGeometry, { y: 4, cols: 4});
const beetleHornedLeftAnimation: FrameAnimation = createAnimation('gfx/enemies/hornedbeetle.png', beetleHornedGeometry, { y: 6, cols: 4});
const beetleHornedChargeDownAnimation: FrameAnimation = createAnimation('gfx/enemies/hornedbeetle.png', beetleHornedGeometry, { y: 1, cols: 4});
const beetleHornedChargeRightAnimation: FrameAnimation = createAnimation('gfx/enemies/hornedbeetle.png', beetleHornedGeometry, { y: 3, cols: 4});
const beetleHornedChargeUpAnimation: FrameAnimation = createAnimation('gfx/enemies/hornedbeetle.png', beetleHornedGeometry, { y: 5, cols: 4});
const beetleHornedChargeLeftAnimation: FrameAnimation = createAnimation('gfx/enemies/hornedbeetle.png', beetleHornedGeometry, { y: 7, cols: 4});

export const beetleHornedAnimations: ActorAnimations = {
    idle: {
        up: beetleHornedUpAnimation,
        down: beetleHornedDownAnimation,
        left: beetleHornedLeftAnimation,
        right: beetleHornedRightAnimation,
    },
    attack: {
        up: beetleHornedChargeUpAnimation,
        down: beetleHornedChargeDownAnimation,
        left: beetleHornedChargeLeftAnimation,
        right: beetleHornedChargeRightAnimation,
    }
};

const beetleWingedGeometry: FrameDimensions = { w: 22, h: 18, content: { x: 4, y: 4, w: 14, h: 13} };
const beetleWingedAnimation: FrameAnimation = createAnimation('gfx/enemies/flyingbeetle.png', beetleWingedGeometry, { cols: 4});
export const beetleWingedAnimations: ActorAnimations = {
    idle: {
        up: beetleWingedAnimation,
        down: beetleWingedAnimation,
        left: beetleWingedAnimation,
        right: beetleWingedAnimation,
    },
};

const entGeometry: FrameDimensions = { w: 40, h: 38, content: { x: 4, y: 6, w: 32, h: 32} };
const entAnimation: FrameAnimation = createAnimation('gfx/enemies/ent.png', entGeometry, { cols: 1});
export const entAnimations: ActorAnimations = {
    idle: {
        up: entAnimation,
        down: entAnimation,
        left: entAnimation,
        right: entAnimation,
    },
};

const droneGeometry: FrameDimensions = { w: 18, h: 17, content: { x: 2, y: 4, w: 14, h: 12} };
const droneAnimation: FrameAnimation = createAnimation('gfx/enemies/drone.png', droneGeometry, { cols: 4});
export const droneAnimations: ActorAnimations = {
    idle: {
        up: droneAnimation,
        down: droneAnimation,
        left: droneAnimation,
        right: droneAnimation,
    },
};

const sentryBotGeometry: FrameDimensions = { w: 40, h: 39, content: { x: 4, y: 8, w: 32, h: 32} };
const sentryBotSideGeometry: FrameDimensions = { w: 40, h: 39, content: { x: 14, y: 8, w: 12, h: 32} };
const sentryBotAnimationDown: FrameAnimation = createAnimation('gfx/enemies/sentrybot.png', sentryBotGeometry, { cols: 4});
const sentryBotAnimationRight: FrameAnimation = createAnimation('gfx/enemies/sentrybot.png', sentryBotSideGeometry, { cols: 4, y: 1});
const sentryBotAnimationUp: FrameAnimation = createAnimation('gfx/enemies/sentrybot.png', sentryBotGeometry, { cols: 4, y: 2});
const sentryBotAnimationLeft: FrameAnimation = createAnimation('gfx/enemies/sentrybot.png', sentryBotSideGeometry, { cols: 4, y: 3});
export const sentryBotAnimations: ActorAnimations = {
    idle: {
        up: sentryBotAnimationUp,
        down: sentryBotAnimationDown,
        left: sentryBotAnimationLeft,
        right: sentryBotAnimationRight,
    },
};

const squirrelGeometry: FrameDimensions = { w: 24, h: 24, content: { x: 3, y: 7, w: 18, h: 18} };
type SquirrelObject = {
    down: FrameAnimation;
    right: FrameAnimation;
    up: FrameAnimation;
    left: FrameAnimation;
    climb: FrameAnimation;
}
function createSquirrelAnimation(squirrelType: string): SquirrelObject {
    const down: FrameAnimation = createAnimation(`gfx/enemies/${squirrelType}.png`, squirrelGeometry, { y: 0, cols: 4, duration: 10});
    const right: FrameAnimation = createAnimation(`gfx/enemies/${squirrelType}.png`, squirrelGeometry, { y: 1, cols: 4, duration: 10});
    const up: FrameAnimation = createAnimation(`gfx/enemies/${squirrelType}.png`, squirrelGeometry, { y: 4, cols: 4, duration: 10});
    const left: FrameAnimation = createAnimation(`gfx/enemies/${squirrelType}.png`, squirrelGeometry, { y: 2, cols: 4, duration: 10});
    const climb: FrameAnimation = createAnimation(`gfx/enemies/${squirrelType}.png`, squirrelGeometry, { y: 3, cols: 4, duration: 10});
    return {down, right, up, left, climb};
}

const electricSquirrelAnimation = createSquirrelAnimation('electricsquirrel');
export const electricSquirrelAnimations: ActorAnimations = {
    climbing: {
        up: electricSquirrelAnimation.climb,
        down: electricSquirrelAnimation.climb,
        left: electricSquirrelAnimation.climb,
        right: electricSquirrelAnimation.climb,
    },
    idle: {
        up: electricSquirrelAnimation.up,
        down: electricSquirrelAnimation.down,
        left: electricSquirrelAnimation.left,
        right: electricSquirrelAnimation.right,
    },
};

const superElectricSquirrelAnimation = createSquirrelAnimation('superelectricsquirrel');
export const superElectricSquirrelAnimations: ActorAnimations = {
    climbing: {
        up: superElectricSquirrelAnimation.climb,
        down: superElectricSquirrelAnimation.climb,
        left: superElectricSquirrelAnimation.climb,
        right: superElectricSquirrelAnimation.climb,
    },
    idle: {
        up: superElectricSquirrelAnimation.up,
        down: superElectricSquirrelAnimation.down,
        left: superElectricSquirrelAnimation.left,
        right: superElectricSquirrelAnimation.right,
    },
};

const brownSquirrelAnimation = createSquirrelAnimation('brownsquirrel');
export const brownSquirrelAnimations: ActorAnimations = {
    climbing: {
        up: brownSquirrelAnimation.climb,
        down: brownSquirrelAnimation.climb,
        left: brownSquirrelAnimation.climb,
        right: brownSquirrelAnimation.climb,
    },
    idle: {
        up: brownSquirrelAnimation.up,
        down: brownSquirrelAnimation.down,
        left: brownSquirrelAnimation.left,
        right: brownSquirrelAnimation.right,
    },
};
