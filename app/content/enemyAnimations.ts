import { createAnimation } from 'app/utils/animations';

import {
    ActorAnimations, CreateAnimationOptions,
    ExtraAnimationProperties, FrameAnimation, FrameDimensions,
} from 'app/types';

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
// all idols share the same layout and dimensions
// row 0: still frames; row 1: float;
// row 2: float attack; row 3: dead float attack;
// row 4: projectile float attack; row 5: dead projectile float attack;
// row 6: warning eye glow
const idolGeometry: FrameDimensions = { w: 32, h: 40, content: { x: 2, y: 20, w: 28, h: 20} };
const iceImage = 'gfx/enemies/miniStatueBoss-ice-32x40.png';
const fireImage = 'gfx/enemies/miniStatueBoss-fire-32x40.png';
const lightningImage = 'gfx/enemies/miniStatueBoss-lightning-32x40.png';

// ice snake animations
// gfx/enemies/miniStatueBoss-ice-32x40
const iceIdolAttackAnimation: FrameAnimation = createAnimation(iceImage, idolGeometry, { y: 2, cols: 5});
const iceIdolAttackDeadAnimation: FrameAnimation = createAnimation(iceImage, idolGeometry, { y: 3, cols: 5});
const iceIdolAttackBallAnimation: FrameAnimation = createAnimation(iceImage, idolGeometry, { y: 4, cols: 5});
const iceIdolAttackBallDeadAnimation: FrameAnimation = createAnimation(iceImage, idolGeometry, { y: 5, cols: 5});
const iceIdolBrokenAnimation: FrameAnimation = createAnimation(iceImage, idolGeometry, { x: 3, y: 0, cols: 1});
const iceIdolIdleAnimation: FrameAnimation = createAnimation(iceImage, idolGeometry, { y: 1, cols: 5});
const iceIdolStillAnimation: FrameAnimation = createAnimation(iceImage, idolGeometry, { x: 0, y: 0, cols: 1});
const iceIdolWakeAnimation: FrameAnimation = createAnimation(iceImage, idolGeometry, { x: 0, y: 0, cols: 2}, {loop: false});
const iceIdolWarningAnimation: FrameAnimation = createAnimation(iceImage, idolGeometry, { y: 6, cols: 5});

export const iceIdolAnimations: ActorAnimations = {
    attack: omniAnimation(iceIdolAttackAnimation),
    attackDead: omniAnimation(iceIdolAttackDeadAnimation),
    attackBall: omniAnimation(iceIdolAttackBallAnimation),
    attackBallDead: omniAnimation(iceIdolAttackBallDeadAnimation),
    broken: omniAnimation(iceIdolBrokenAnimation),
    death: omniAnimation(iceIdolBrokenAnimation),
    idle: omniAnimation(iceIdolIdleAnimation),
    still: omniAnimation(iceIdolStillAnimation),
    wake: omniAnimation(iceIdolWakeAnimation),
    warning: omniAnimation(iceIdolWarningAnimation),
};

// lightning bird animations
// gfx/enemies/miniStatueBoss-lightning-32x40
const lightningIdolAttackAnimation: FrameAnimation = createAnimation(lightningImage, idolGeometry, { y: 2, cols: 5});
const lightningIdolAttackDeadAnimation: FrameAnimation = createAnimation(lightningImage, idolGeometry, { y: 3, cols: 5});
const lightningIdolAttackBallAnimation: FrameAnimation = createAnimation(lightningImage, idolGeometry, { y: 4, cols: 5});
const lightningIdolAttackBallDeadAnimation: FrameAnimation = createAnimation(lightningImage, idolGeometry, { y: 5, cols: 5});
const lightningIdolBrokenAnimation: FrameAnimation = createAnimation(lightningImage, idolGeometry, { x: 3, y: 0, cols: 1});
const lightningIdolIdleAnimation: FrameAnimation = createAnimation(lightningImage, idolGeometry, { y: 1, cols: 5});
const lightningIdolStillAnimation: FrameAnimation = createAnimation(lightningImage, idolGeometry, { y: 0, cols: 1});
const lightningIdolWakeAnimation: FrameAnimation = createAnimation(lightningImage, idolGeometry, { x: 0, y: 0, cols: 2}, {loop: false});
const lightningIdolWarningAnimation: FrameAnimation = createAnimation(lightningImage, idolGeometry, { y: 6, cols: 5});

export const lightningIdolAnimations: ActorAnimations = {
    attack: omniAnimation(lightningIdolAttackAnimation),
    attackDead: omniAnimation(lightningIdolAttackDeadAnimation),
    attackBall: omniAnimation(lightningIdolAttackBallAnimation),
    attackBallDead: omniAnimation(lightningIdolAttackBallDeadAnimation),
    broken: omniAnimation(lightningIdolBrokenAnimation),
    death: omniAnimation(lightningIdolBrokenAnimation),
    idle: omniAnimation(lightningIdolIdleAnimation),
    still: omniAnimation(lightningIdolStillAnimation),
    wake: omniAnimation(lightningIdolWakeAnimation),
    warning: omniAnimation(lightningIdolWarningAnimation),
};

// fire badger animations
// gfx/enemies/miniStatueBoss-fire-32x40
const fireIdolAttackAnimation: FrameAnimation = createAnimation(fireImage, idolGeometry, { y: 2, cols: 5});
const fireIdolAttackDeadAnimation: FrameAnimation = createAnimation(fireImage, idolGeometry, { y: 3, cols: 5});
const fireIdolAttackBallAnimation: FrameAnimation = createAnimation(fireImage, idolGeometry, { y: 4, cols: 5});
const fireIdolAttackBallDeadAnimation: FrameAnimation = createAnimation(fireImage, idolGeometry, { y: 5, cols: 5});
const fireIdolBrokenAnimation: FrameAnimation = createAnimation(fireImage, idolGeometry, { x: 3, y: 0, cols: 1});
const fireIdolIdleAnimation: FrameAnimation = createAnimation(fireImage, idolGeometry, { y: 1, cols: 5});
const fireIdolStillAnimation: FrameAnimation = createAnimation(fireImage, idolGeometry, { y: 0, cols: 1});
const fireIdolWakeAnimation: FrameAnimation = createAnimation(fireImage, idolGeometry, { x: 0, y: 0, cols: 2}, {loop: false});
const fireIdolWarningAnimation: FrameAnimation = createAnimation(fireImage, idolGeometry, { y: 6, cols: 5});

export const fireIdolAnimations: ActorAnimations = {
    attack: omniAnimation(fireIdolAttackAnimation),
    attackDead: omniAnimation(fireIdolAttackDeadAnimation),
    attackBall: omniAnimation(fireIdolAttackBallAnimation),
    attackBallDead: omniAnimation(fireIdolAttackBallDeadAnimation),
    broken: omniAnimation(fireIdolBrokenAnimation),
    death: omniAnimation(fireIdolBrokenAnimation),
    idle: omniAnimation(fireIdolIdleAnimation),
    still: omniAnimation(fireIdolStillAnimation),
    wake: omniAnimation(fireIdolWakeAnimation),
    warning: omniAnimation(fireIdolWarningAnimation),
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

function omniAnimation(animation: FrameAnimation) {
    return {
        up: animation, down: animation, left: animation, right: animation,
    };
}

const floorEyeGeometry: FrameDimensions = { w: 16, h: 16 };
const floorEyeClosedAnimation: FrameAnimation = createAnimation('gfx/enemies/eyemonster.png', floorEyeGeometry, { cols: 1});
const floorEyeOpeningAnimation: FrameAnimation = createAnimation('gfx/enemies/eyemonster.png', floorEyeGeometry,
    { x: 1, cols: 10, duration: 5, frameMap: [0, 1, 2, 2, 2, 2, 2, 3, 4, 5, 6, 7, 8, 9]}, {loop: false});
const floorEyeOpenAnimation: FrameAnimation = createAnimation('gfx/enemies/eyemonster.png', floorEyeGeometry, { x: 3, cols: 1, duration: 5});
const floorEyeAttackAnimation: FrameAnimation = createAnimation('gfx/enemies/eyemonster.png', floorEyeGeometry,
    { x: 9, cols: 4, duration: 3, frameMap: [0, 1, 2, 3, 2, 1]});
const floorEyeClosingAnimation: FrameAnimation = createAnimation('gfx/enemies/eyemonster.png', floorEyeGeometry,
    { x: 0, cols: 3, duration: 5, frameMap: [2, 1, 0]}, {loop: false});
const floorEyeHurtAnimation: FrameAnimation = createAnimation('gfx/enemies/eyemonster.png', floorEyeGeometry, { x: 16, cols: 1, duration: 5});
const floorEyeDefeatedAnimation: FrameAnimation = createAnimation('gfx/enemies/eyemonster.png', floorEyeGeometry, { x: 17, cols: 1, duration: 5});

export const floorEyeAnimations: ActorAnimations = {
    idle: omniAnimation(floorEyeClosedAnimation),
    opening: omniAnimation(floorEyeOpeningAnimation),
    open: omniAnimation(floorEyeOpenAnimation),
    attack: omniAnimation(floorEyeAttackAnimation),
    closing: omniAnimation(floorEyeClosingAnimation),
    hurt: omniAnimation(floorEyeHurtAnimation),
    defeated: omniAnimation(floorEyeDefeatedAnimation),
};

/*
This is the Bat sheet. The Bat runs at 10 FPS
The first 6 frames are for flying - it runs 1-2-3-4-5-6-1 at 10 FPS
Frame 7 is when hurt (runs however long is appropriate)
Frame 8-14 is for attacking. I imagine the icicles are spawned on frame 11 or 12.
*/

const crystalBatGeometry: FrameDimensions = { w: 36, h: 36, content: {x: 8, y: 8, w: 20, h: 20} };
const crystalBatFlyingAnimation = createAnimation('gfx/enemies/bat1-Sheet.png', crystalBatGeometry, { cols: 6, duration: 5});
const crystalBatHurtAnimation = createAnimation('gfx/enemies/bat1-Sheet.png', crystalBatGeometry, { x: 6, cols: 1});
const crystalBatAttackAnimation = createAnimation('gfx/enemies/bat1-Sheet.png', crystalBatGeometry, { x: 7, cols: 7, duration: 5});

export const crystalBatAnimations: ActorAnimations = {
    idle: omniAnimation(crystalBatFlyingAnimation),
    hurt: omniAnimation(crystalBatHurtAnimation),
    attack: omniAnimation(crystalBatAttackAnimation),
};

const crystalCollectorGeometry: FrameDimensions = { w: 50, h: 39, content: {x: 7, y: 9, w: 36, h: 30} };
const crystalBossAnimation = (props: CreateAnimationOptions, extra?: ExtraAnimationProperties) =>
    createAnimation('gfx/enemies/eyeboss1.png', crystalCollectorGeometry, props, extra);


const crystalCollectorOpenAnimation = crystalBossAnimation({ cols: 5, duration: 10}, {loop: false});
const crystalCollectorEnragedOpenAnimation = crystalBossAnimation({ y: 1, cols: 5, duration: 10}, {loop: false});

const crystalCollectorIdleAnimation = crystalBossAnimation({ x: 4, cols: 1, duration: 5});
const crystalCollectorEnragedIdleAnimation = crystalBossAnimation({ y: 1, x: 4, cols: 1, duration: 5});

const crystalCollectorHurtAnimation = crystalBossAnimation({ x: 5, cols: 1});
const crystalCollectorEnragedHurtAnimation = crystalBossAnimation({ y: 1, x: 5, cols: 1});

const crystalCollectorConfusedAnimation = crystalBossAnimation({ x: 6, cols: 2}, {loop: false});
const crystalCollectorEnragedConfusedAnimation = crystalBossAnimation({ y: 1, x: 6, cols: 2}, {loop: false});

const crystalCollectorAttackAnimation = crystalBossAnimation({ x: 8, cols: 3, duration: 5});
const crystalCollectorEnragedAttackAnimation = crystalBossAnimation({ y: 1, x: 8, cols: 3, duration: 5});

export const crystalCollectorAnimations: ActorAnimations = {
    open: omniAnimation(crystalCollectorOpenAnimation),
    idle: omniAnimation(crystalCollectorIdleAnimation),
    hurt: omniAnimation(crystalCollectorHurtAnimation),
    confused: omniAnimation(crystalCollectorConfusedAnimation),
    attack: omniAnimation(crystalCollectorAttackAnimation),
    death: omniAnimation(crystalCollectorConfusedAnimation),
};
export const crystalCollectorEnragedAnimations: ActorAnimations = {
    open: omniAnimation(crystalCollectorEnragedOpenAnimation),
    idle: omniAnimation(crystalCollectorEnragedIdleAnimation),
    hurt: omniAnimation(crystalCollectorEnragedHurtAnimation),
    confused: omniAnimation(crystalCollectorEnragedConfusedAnimation),
    attack: omniAnimation(crystalCollectorEnragedAttackAnimation),
    death: omniAnimation(crystalCollectorEnragedConfusedAnimation),
};

const crystalBarrierGeometry: FrameDimensions = { w: 96, h: 94, content: {x: 16, y: 40, w: 64, h: 44} };
export const crystalBarrierSummonAnimation = createAnimation('gfx/effects/monstershield.png', crystalBarrierGeometry,
    { x: 0, cols: 4, duration: 6, frameMap: [0,0,0,0,1,2,3,2,3]});
export const crystalBarrierNormalAnimation = createAnimation('gfx/effects/monstershield.png', crystalBarrierGeometry, { x: 3, cols: 1, duration: 5});
export const crystalBarrierDamagedAnimation = createAnimation('gfx/effects/monstershield.png', crystalBarrierGeometry, { x: 4, cols: 1, duration: 5});
export const crystalBarrierVeryDamagedAnimation = createAnimation('gfx/effects/monstershield.png', crystalBarrierGeometry, { x: 5, cols: 1, duration: 5});

export const crystalBarrierSmallParticles = createAnimation('gfx/effects/crystalwallparticles.png', {w: 8, h: 8}, { cols: 3}).frames;
export const crystalBarrierLargeParticles = createAnimation('gfx/effects/crystalwallparticles2.png', {w: 16, h: 28}, { cols: 4}).frames;

/* RIVAL */
// image layout
// row 0: still; row 1: walk-down;
// row 2: walk-right; row 3: walk-up;
// row 4: walk-left; row 5: roll-down;
// row 6: roll-right; row 7: roll-up;
// row 8: roll-left; row 9: attack-down;
// row 10: attack-right; row 11: attack-up;
// row 12: attack-left; row 13: staff-down;
// row 14: staff-right; row 15: staff-up;
// row 16: staff-left; row 17: kneel;
// row 18: staff-right-body; row 19: staff-up-body
// row 20: staff-left-body; row 21: staff-down-body
const rivalGeometry: FrameDimensions = { w: 30, h: 28, content: { x: 11, y: 10, w: 18, h: 18} };
const rivalImg = 'gfx/enemies/rival.png';

// rival animations
const rivalStillDownAnimation: FrameAnimation = createAnimation(rivalImg, rivalGeometry, { x: 0, y: 0, cols: 1});
const rivalStillRightAnimation: FrameAnimation = createAnimation(rivalImg, rivalGeometry, { x: 1, y: 0, cols: 1});
const rivalStillUpAnimation: FrameAnimation = createAnimation(rivalImg, rivalGeometry, { x: 2, y: 0, cols: 1});
const rivalStillLeftAnimation: FrameAnimation = createAnimation(rivalImg, rivalGeometry, { x: 3, y: 0, cols: 1});

const rivalWalkDownAnimation: FrameAnimation = createAnimation(rivalImg, rivalGeometry, { x: 0, y: 1, cols: 8});
const rivalWalkRightAnimation: FrameAnimation = createAnimation(rivalImg, rivalGeometry, { x: 0, y: 2, cols: 8});
const rivalWalkUpAnimation: FrameAnimation = createAnimation(rivalImg, rivalGeometry, { x: 0, y: 3, cols: 8});
const rivalWalkLeftAnimation: FrameAnimation = createAnimation(rivalImg, rivalGeometry, { x: 0, y: 4, cols: 8});

const rivalRollDownAnimation: FrameAnimation = createAnimation(rivalImg, rivalGeometry, { cols: 4, x: 1, y: 5, duration: 4}, {loop: false});
const rivalRollRightAnimation: FrameAnimation = createAnimation(rivalImg, rivalGeometry, { cols: 4, x: 1, y: 6, duration: 4}, {loop: false});
const rivalRollUpAnimation: FrameAnimation = createAnimation(rivalImg, rivalGeometry, { cols: 4, x: 1, y: 7, duration: 4}, {loop: false});
const rivalRollLeftAnimation: FrameAnimation = createAnimation(rivalImg, rivalGeometry, { cols: 4, x: 1, y: 8, duration: 4}, {loop: false});

const rivalAttackDownAnimation: FrameAnimation = createAnimation(rivalImg, rivalGeometry, { x: 0, y: 9, cols: 5});
const rivalAttackRightAnimation: FrameAnimation = createAnimation(rivalImg, rivalGeometry, { x: 0, y: 10, cols: 5});
const rivalAttackUpAnimation: FrameAnimation = createAnimation(rivalImg, rivalGeometry, { x: 0, y: 11, cols: 5});
const rivalAttackLeftAnimation: FrameAnimation = createAnimation(rivalImg, rivalGeometry, { x: 0, y: 12, cols: 5});

const rivalKneelDownAnimation: FrameAnimation = createAnimation(rivalImg, rivalGeometry, { x: 0, y: 17, cols: 1});
const rivalKneelRightAnimation: FrameAnimation = createAnimation(rivalImg, rivalGeometry, { x: 1, y: 17, cols: 1});
const rivalKneelUpAnimation: FrameAnimation = createAnimation(rivalImg, rivalGeometry, { x: 2, y: 17, cols: 1});
const rivalKneelLeftAnimation: FrameAnimation = createAnimation(rivalImg, rivalGeometry, { x: 3, y: 17, cols: 1});

const rivalStaffJumpDownAnimation: FrameAnimation = createAnimation(rivalImg, rivalGeometry, { cols: 3, x: 1, y: 18, duration: 3,  frameMap: [0, 1, 1, 1, 1, 2, 2, 2, 2]});
const rivalStaffJumpRightAnimation: FrameAnimation = createAnimation(rivalImg, rivalGeometry, { cols: 3, x: 1, y: 19, duration: 3, frameMap: [0, 1, 1, 1, 1, 2, 2, 2, 2]});
const rivalStaffJumpUpAnimation: FrameAnimation = createAnimation(rivalImg, rivalGeometry, { cols: 2, x: 1, y: 20, duration: 3,   frameMap: [0, 0, 0, 0, 0, 1, 1, 1, 1]});
const rivalStaffJumpLeftAnimation: FrameAnimation = createAnimation(rivalImg, rivalGeometry, { cols: 3, x: 1, y: 21, duration: 3, frameMap: [0, 1, 1, 1, 1, 2, 2, 2, 2]});
const rivalStaffSlamDownAnimation: FrameAnimation = createAnimation(rivalImg, rivalGeometry, { cols: 1, x: 4, y: 18, duration: 9});
const rivalStaffSlamRightAnimation: FrameAnimation = createAnimation(rivalImg, rivalGeometry, { cols: 1, x: 9, y: 19, duration: 9});
const rivalStaffSlamUpAnimation: FrameAnimation = createAnimation(rivalImg, rivalGeometry, { cols: 1, x: 13, y: 20, duration: 9});
const rivalStaffSlamLeftAnimation: FrameAnimation = createAnimation(rivalImg, rivalGeometry, { cols: 1, x: 18, y: 21, duration: 9});

// const staffImg = 'gfx/effects/wukong_staff.png';
// const staffGeometry = {w: 123, h: 181};
// const staffDownAnimation: FrameAnimation = createAnimation(staffImg, staffGeometry, { cols: 8, x: 0, duration: 3, frameMap: [0, 1, 2, 3, 4, 5, 6, 6, 6, 7]}, {loop: false});
// const staffRightAnimation: FrameAnimation = createAnimation(staffImg, staffGeometry, { cols: 10, x: 8, duration: 3}, {loop: false});
// const staffUpAnimation: FrameAnimation = createAnimation(staffImg, staffGeometry, { cols: 8, x: 18, duration: 3, frameMap: [0, 1, 2, 3, 4, 5, 6, 6, 6, 7]}, {loop: false});
// const staffLeftAnimation: FrameAnimation = createAnimation(staffImg, staffGeometry, { cols: 10, x: 26, duration: 3}, {loop: false});

export const rivalAnimations: ActorAnimations = {
    idle: {
        down: rivalStillDownAnimation,
        right: rivalStillRightAnimation,
        up: rivalStillUpAnimation,
        left: rivalStillLeftAnimation,
    },
    move: {
        down: rivalWalkDownAnimation,
        right: rivalWalkRightAnimation,
        up: rivalWalkUpAnimation,
        left: rivalWalkLeftAnimation,
    },
    roll: {
        down: rivalRollDownAnimation,
        right: rivalRollRightAnimation,
        up: rivalRollUpAnimation,
        left: rivalRollLeftAnimation,
    },
    attack: {
        down: rivalAttackDownAnimation,
        right: rivalAttackRightAnimation,
        up: rivalAttackUpAnimation,
        left: rivalAttackLeftAnimation,
    },
    kneel: {
        down: rivalKneelDownAnimation,
        right: rivalKneelRightAnimation,
        up: rivalKneelUpAnimation,
        left: rivalKneelLeftAnimation,
    },
    staffJump: {
        up: rivalStaffJumpUpAnimation,
        down: rivalStaffJumpDownAnimation,
        left: rivalStaffJumpLeftAnimation,
        right: rivalStaffJumpRightAnimation,
    },
    staffSlam: {
        up: rivalStaffSlamUpAnimation,
        down: rivalStaffSlamDownAnimation,
        left: rivalStaffSlamLeftAnimation,
        right: rivalStaffSlamRightAnimation,
    },
};