import {createAnimation, speedUpAnimation} from 'app/utils/animations';


export function omniAnimation(animation: FrameAnimation) {
    return {
        up: animation, down: animation, left: animation, right: animation,
    };
}

const enemyDeathGeometry: FrameDimensions = {w: 20, h: 20};
export const enemyDeathAnimation: FrameAnimation = createAnimation('gfx/effects/enemydeath.png', enemyDeathGeometry, { cols: 9, duration: 4}, { loop: false });

// 252x28
const bossDeathExplosionGeometry: FrameDimensions = {w: 28, h: 28};
export const bossDeathExplosionAnimation: FrameAnimation
    = createAnimation('gfx/effects/powersource_explosion.png', bossDeathExplosionGeometry, { cols: 9, duration: 4}, { loop: false });



const snakeGeometry: FrameDimensions = { w: 18, h: 18, content: { x: 2, y: 6, w: 14, h: 11} };
function createSnakeAnimations(source: string): ActorAnimations {
    const leftAnimation: FrameAnimation = createAnimation(source, snakeGeometry, { x: 0});
    return {
        idle: {
            up: createAnimation(source, snakeGeometry, { x: 2}),
            down: createAnimation(source, snakeGeometry, { x: 1}),
            left: leftAnimation,
            right: leftAnimation,
        },
    };
}
export const snakeAnimations: ActorAnimations = createSnakeAnimations('gfx/enemies/snek.png');
export const snakeFlameAnimations: ActorAnimations = createSnakeAnimations('gfx/enemies/snekred.png');
export const snakeFrostAnimations: ActorAnimations = createSnakeAnimations('gfx/enemies/snekblue.png');
export const snakeStormAnimations: ActorAnimations = createSnakeAnimations('gfx/enemies/snekStorm.png');


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
function genericBeetleAnimation(props: CreateAnimationOptions, extra?: ExtraAnimationProperties) {
    return createAnimation('gfx/enemies/genericbeetle.png', beetleGeometry, props, extra);
}
const beetleDownAnimation: FrameAnimation = genericBeetleAnimation({ y: 0, cols: 4});
const beetleRightAnimation: FrameAnimation = genericBeetleAnimation({ y: 1, cols: 4});
const beetleUpAnimation: FrameAnimation = genericBeetleAnimation({ y: 2, cols: 4});
const beetleLeftAnimation: FrameAnimation = genericBeetleAnimation({ y: 4, cols: 4});
const beetleClimbAnimation: FrameAnimation = genericBeetleAnimation({ y: 3, cols: 4});
export const beetleAnimations: ActorAnimations = {
    climbing: omniAnimation(beetleClimbAnimation),
    idle: {
        up: beetleUpAnimation,
        down: beetleDownAnimation,
        left: beetleLeftAnimation,
        right: beetleRightAnimation,
    },
};
export const climbingBeetleAnimations: ActorAnimations = {
    idle: omniAnimation(beetleClimbAnimation),
};


function goldenBeetleAnimation(props: CreateAnimationOptions, extra?: ExtraAnimationProperties) {
    return createAnimation('gfx/enemies/goldenbeetle.png', beetleGeometry, props, extra);
}
const goldenBeetleDownAnimation: FrameAnimation = goldenBeetleAnimation({ y: 0, cols: 4});
const goldenBeetleRightAnimation: FrameAnimation = goldenBeetleAnimation({ y: 1, cols: 4});
const goldenBeetleUpAnimation: FrameAnimation = goldenBeetleAnimation({ y: 2, cols: 4});
const goldenBeetleLeftAnimation: FrameAnimation = goldenBeetleAnimation({ y: 4, cols: 4});
export const goldenBeetleAnimations: ActorAnimations = {
    idle: {
        up: goldenBeetleUpAnimation,
        down: goldenBeetleDownAnimation,
        left: goldenBeetleLeftAnimation,
        right: goldenBeetleRightAnimation,
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

let frameMap = [0,1,1,1,0,4,4,4];
const clawDroneGeometry: FrameDimensions = { w: 32, h: 32, content: { x: 8, y: 10, w: 17, h: 16} };
const droneSpinUpAnimation: FrameAnimation = createAnimation('gfx/enemies/clawDrone.png', clawDroneGeometry, { cols: 5, y: 0, duration: 24});
const droneSpinLeftAnimation: FrameAnimation = createAnimation('gfx/enemies/clawDrone.png', clawDroneGeometry, { cols: 5, y: 1, duration: 24});
const droneSpinDownAnimation: FrameAnimation = createAnimation('gfx/enemies/clawDrone.png', clawDroneGeometry, { cols: 5, y: 2, duration: 24});
const droneSpinRightAnimation: FrameAnimation = createAnimation('gfx/enemies/clawDrone.png', clawDroneGeometry, { cols: 5, y: 3, duration: 24});
const droneIdleUpAnimation: FrameAnimation = createAnimation('gfx/enemies/clawDrone.png', clawDroneGeometry, { cols: 5, y: 0, duration: 6, frameMap});
const droneIdleLeftAnimation: FrameAnimation = createAnimation('gfx/enemies/clawDrone.png', clawDroneGeometry, { cols: 5, y: 1, duration: 6, frameMap});
const droneIdleDownAnimation: FrameAnimation = createAnimation('gfx/enemies/clawDrone.png', clawDroneGeometry, { cols: 5, y: 2, duration: 6, frameMap});
const droneIdleRightAnimation: FrameAnimation = createAnimation('gfx/enemies/clawDrone.png', clawDroneGeometry, { cols: 5, y: 3, duration: 6, frameMap});
const droneOffAnimation: FrameAnimation = createAnimation('gfx/enemies/clawDrone.png', clawDroneGeometry, { cols: 1, y: 4});
export const droneAnimations: ActorAnimations = {
    idle: {
        up: droneIdleUpAnimation,
        down: droneIdleDownAnimation,
        left: droneIdleLeftAnimation,
        right: droneIdleRightAnimation,
    },
    spin: {
        up: droneSpinUpAnimation,
        down: droneSpinDownAnimation,
        left: droneSpinLeftAnimation,
        right: droneSpinRightAnimation,
    },
    off: omniAnimation(droneOffAnimation)
};

const droneGeometry: FrameDimensions = { w: 18, h: 17, content: { x: 2, y: 4, w: 14, h: 12} };
const droneDownAnimation: FrameAnimation = createAnimation('gfx/enemies/drone.png', droneGeometry, { cols: 4, y: 0});
const droneRightAnimation: FrameAnimation = createAnimation('gfx/enemies/drone.png', droneGeometry, { cols: 4, y: 1});
const droneUpAnimation: FrameAnimation = createAnimation('gfx/enemies/drone.png', droneGeometry, { cols: 4, y: 2});
const droneLeftAnimation: FrameAnimation = createAnimation('gfx/enemies/drone.png', droneGeometry, { cols: 4, y: 3});

export const droneDirectionalAnimations: ActorAnimations = {
    idle: {
        up: droneUpAnimation,
        down: droneDownAnimation,
        left: droneLeftAnimation,
        right: droneRightAnimation,
    }
};

const sentryBotGeometry: FrameDimensions = { w: 40, h: 39, content: { x: 10, y: 24, w: 20, h: 16} };
const sentryBotSideGeometry: FrameDimensions = { w: 40, h: 39, content: { x: 10, y: 24, w: 20, h: 16} };
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
function createSquirrelAnimation(source: string): ActorAnimations {
    return {
        climbing: omniAnimation(createAnimation(source, squirrelGeometry, { y: 3, cols: 4, duration: 10})),
        idle: {
            up: createAnimation(source, squirrelGeometry, { y: 4, cols: 4, duration: 10}),
            down: createAnimation(source, squirrelGeometry, { y: 0, cols: 4, duration: 10}),
            left: createAnimation(source, squirrelGeometry, { y: 2, cols: 4, duration: 10}),
            right: createAnimation(source, squirrelGeometry, { y: 1, cols: 4, duration: 10}),
        },
    };
}
export const squirrelAnimations = createSquirrelAnimation('gfx/enemies/squirrel.png');
export const squirrelFlameAnimations = createSquirrelAnimation('gfx/enemies/squirrelFlame.png');
export const squirrelFrostAnimations = createSquirrelAnimation('gfx/enemies/squirrelFrost.png');
export const squirrelStormAnimations = createSquirrelAnimation('gfx/enemies/squirrelStorm.png');
export const superElectricSquirrelAnimations = createSquirrelAnimation('gfx/enemies/superelectricsquirrel.png');

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

export const floorEyeAnimations: ActorAnimations = {
    idle: omniAnimation(floorEyeClosedAnimation),
    opening: omniAnimation(floorEyeOpeningAnimation),
    open: omniAnimation(floorEyeOpenAnimation),
    attack: omniAnimation(floorEyeAttackAnimation),
    closing: omniAnimation(floorEyeClosingAnimation),
    hurt: omniAnimation(floorEyeHurtAnimation),
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
    createAnimation('gfx/enemies/eyeboss2.png', crystalCollectorGeometry, props, extra);


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

export const crystalCollecterBackFrame = crystalBossAnimation({x: 11}).frames[0];

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

const smallCrystalBarrierGeometry: FrameDimensions = { w: 68, h: 72, content: {x: 2, y: 20, w: 64, h: 44} };
export const [
    smallCrystalBarrierFlashFrame,
    smallCrystalBarrierNormalFrame,
    smallCrystalBarrierDamagedFrame,
    smallCrystalBarrierVeryDamagedFrame,
] = createAnimation('gfx/effects/golemshield.png', smallCrystalBarrierGeometry, { x: 0, cols: 4}).frames;

export const crystalBarrierSmallParticles = createAnimation('gfx/effects/crystalwallparticles.png', {w: 8, h: 8}, { cols: 3}).frames;
export const crystalBarrierLargeParticles = createAnimation('gfx/effects/crystalwallparticles2.png', {w: 16, h: 28}, { cols: 4}).frames;

const crystalGuardianGeometry: FrameDimensions = { w: 40, h: 48, content: {x: 4, y: 16, w: 32, h: 32} };
export const crystalGuardianIdleAnimation = createAnimation('gfx/enemies/golem.png', crystalGuardianGeometry,
    { x: 0, cols: 1, duration: 10});
export const crystalGuardianAttackAnimation = createAnimation('gfx/enemies/golem.png', crystalGuardianGeometry,
    { x: 1, cols: 2, duration: 10, frameMap: [0, 0, 1]}, {loop: false});
export const crystalGuardianSpellAnimation = createAnimation('gfx/enemies/golem.png', crystalGuardianGeometry,
    { x: 3, cols: 4, duration: 10}, {loopFrame: 1});
export const crystalGuardianHurtAnimation = createAnimation('gfx/enemies/golem.png', crystalGuardianGeometry,
    { x: 7, cols: 1, duration: 10}, {loop: false});
export const crystalGuardianAnimations: ActorAnimations = {
    idle: omniAnimation(crystalGuardianIdleAnimation),
    hurt: omniAnimation(crystalGuardianHurtAnimation),
    attack: omniAnimation(crystalGuardianAttackAnimation),
    spell: omniAnimation(crystalGuardianSpellAnimation),
    death: omniAnimation(crystalGuardianHurtAnimation),
};
/*
//
Frame 1 - this is the idle standing frame
Frame 2-3 - this is the hammering frame. I imagine you should keep the golem on frame 3 for longer just to help show that the attack came from the hammer
Frame 4-7 - this is the golem preparing and then casting a spell. Loop frames 5-7 for however long the casting is.
Frame 8 - hurt frame*/

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
const rivalGeometry: FrameDimensions = { w: 30, h: 28, content: { x: 7, y: 12, w: 16, h: 16} };
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
const rivalStaffSlamRightAnimation: FrameAnimation = createAnimation(rivalImg, rivalGeometry, { cols: 1, x: 4, y: 19, duration: 9});
const rivalStaffSlamUpAnimation: FrameAnimation = createAnimation(rivalImg, rivalGeometry, { cols: 1, x: 3, y: 20, duration: 9});
const rivalStaffSlamLeftAnimation: FrameAnimation = createAnimation(rivalImg, rivalGeometry, { cols: 1, x: 4, y: 21, duration: 9});

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

/*
Frame 1 - Idle facing 4 directions "horizontal/vertical"
Frames 2-3 - runs at 5FPS, is the attacking animation
Frames 4-5 - transition frame  from horizontal/vertical shooting to diagonal shooting. Runs at 10 FPS and goes to Frame 6
Frame 6 - Idle facing 4 directions "diagonal"
Frames 7-8 runs at 5 FPS, is the attacking animation
Frames 9-10 - transition frames from diagonal shooting to horizontal/vertical shooting. Runs at 10 FPS and goes to Frame 1
Frame 11 - Cracked frame. I can also make a cracked version for all frames, but I figure this is just for when it is actively destroyed.
*/
const turretGeometry: FrameDimensions = { w: 18, h: 23, content: {x: 1, y: 7, w: 16, h: 16} };
export const turretIdleAnimation = createAnimation('gfx/enemies/turret.png', turretGeometry,
    { x: 0, cols: 1, duration: 10});
export const turretAttackAnimation = createAnimation('gfx/enemies/turret.png', turretGeometry,
    { x: 1, cols: 2, duration: 10});
export const turretRotateAnimation = createAnimation('gfx/enemies/turret.png', turretGeometry,
    { x: 3, cols: 3, duration: 5});
export const diagonalTurretIdleAnimation = createAnimation('gfx/enemies/turret.png', turretGeometry,
    { x: 5, cols: 1, duration: 10});
export const diagonalTurretAttackAnimation = createAnimation('gfx/enemies/turret.png', turretGeometry,
    { x: 6, cols: 2, duration: 10});
// This looks strange because this animation has to wrap back to frame 0.
export const diagonalTurretRotateAnimation = createAnimation('gfx/enemies/turret.png', turretGeometry,
    { x: 0, cols: 10, duration: 5, frameMap: [8, 9, 0]});
export const turretGemAnimation = createAnimation('gfx/enemies/turret.png', turretGeometry,
    { x: 10, cols: 1, duration: 5});
export const turretCrackedGemAnimation = createAnimation('gfx/enemies/turret.png', turretGeometry,
    { x: 11, cols: 1, duration: 5});
export const turretAnimations: ActorAnimations = {
    idle: omniAnimation(turretIdleAnimation),
    rotate: omniAnimation(turretRotateAnimation),
    attack: omniAnimation(turretAttackAnimation),
};
export const diagonalTurretAnimations: ActorAnimations = {
    idle: omniAnimation(diagonalTurretIdleAnimation),
    rotate: omniAnimation(diagonalTurretRotateAnimation),
    attack: omniAnimation(diagonalTurretAttackAnimation),
};
export const fastTurretAnimations: ActorAnimations = {
    idle: omniAnimation(speedUpAnimation(turretIdleAnimation, 2)),
    rotate: omniAnimation(speedUpAnimation(turretRotateAnimation, 2)),
    attack: omniAnimation(speedUpAnimation(turretAttackAnimation, 2)),
};
export const fastDiagonalTurretAnimations: ActorAnimations = {
    idle: omniAnimation(speedUpAnimation(diagonalTurretIdleAnimation, 2)),
    rotate: omniAnimation(speedUpAnimation(diagonalTurretRotateAnimation, 2)),
    attack: omniAnimation(speedUpAnimation(diagonalTurretAttackAnimation, 2)),
};
