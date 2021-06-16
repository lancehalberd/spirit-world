import { createAnimation } from 'app/utils/animations';

import { ActorAnimations, FrameAnimation, FrameDimensions } from 'app/types';


const enemyDeathGeometry: FrameDimensions = {w: 20, h: 20};
export const enemyDeathAnimation: FrameAnimation = createAnimation('gfx/effects/enemydeath.png', enemyDeathGeometry, { cols: 9, duration: 4}, { loop: false });

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
