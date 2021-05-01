import { createAnimation } from 'app/utils/animations';

import { ActorAnimations, FrameAnimation, FrameDimensions } from 'app/types';

export const Y_OFF = -4;

const heroGeometry: FrameDimensions = {w: 18, h: 26, content: {x: 1, y: 15 + Y_OFF, w: 16, h: 16}};
const upAnimation: FrameAnimation = createAnimation('gfx/mc/facing.png', heroGeometry, { x: 2});
const downAnimation: FrameAnimation = createAnimation('gfx/mc/facing.png', heroGeometry, { x: 0});
const leftAnimation: FrameAnimation = createAnimation('gfx/mc/facing.png', heroGeometry, { x: 3});
const rightAnimation: FrameAnimation = createAnimation('gfx/mc/facing.png', heroGeometry, { x: 1});
const heroShallowGeometry: FrameDimensions = {w: 20, h: 28, content: {x: 2, y: 16 + Y_OFF, w: 16, h: 16}};
const upShallowAnimation: FrameAnimation = createAnimation('gfx/mc/mcfacingshallow.png', heroShallowGeometry, { x: 2});
const downShallowAnimation: FrameAnimation = createAnimation('gfx/mc/mcfacingshallow.png', heroShallowGeometry, { x: 0});
const leftShallowAnimation: FrameAnimation = createAnimation('gfx/mc/mcfacingshallow.png', heroShallowGeometry, { x: 3});
const rightShallowAnimation: FrameAnimation = createAnimation('gfx/mc/mcfacingshallow.png', heroShallowGeometry, { x: 1});

const hurtGeometry: FrameDimensions = {w: 20, h: 28, content: {x: 2, y: 16 + Y_OFF, w: 16, h: 16}};
const hurtUpAnimation: FrameAnimation = createAnimation('gfx/mc/mchurt.png', hurtGeometry, { x: 2});
const hurtDownAnimation: FrameAnimation = createAnimation('gfx/mc/mchurt.png', hurtGeometry, { x: 0});
const hurtLeftAnimation: FrameAnimation = createAnimation('gfx/mc/mchurt.png', hurtGeometry, { x: 3});
const hurtRightAnimation: FrameAnimation = createAnimation('gfx/mc/mchurt.png', hurtGeometry, { x: 1});

const walkingGeometry: FrameDimensions = {w: 20, h: 28, content: {x: 2, y: 16 + Y_OFF, w: 16, h: 16}};
const walkUpAnimation: FrameAnimation = createAnimation('gfx/mc/mcwalking.png', walkingGeometry, { cols: 8, y: 2, duration: 4});
const walkDownAnimation: FrameAnimation = createAnimation('gfx/mc/mcwalking.png', walkingGeometry, { cols: 8, y: 0, duration: 4});
const walkLeftAnimation: FrameAnimation = createAnimation('gfx/mc/mcwalking.png', walkingGeometry, { cols: 8, y: 3, duration: 4});
const walkRightAnimation: FrameAnimation = createAnimation('gfx/mc/mcwalking.png', walkingGeometry, { cols: 8, y: 1, duration: 4});
const walkShallowUpAnimation: FrameAnimation = createAnimation('gfx/mc/mcwalkingshallow.png', walkingGeometry, { cols: 8, y: 2, duration: 4});
const walkShallowDownAnimation: FrameAnimation = createAnimation('gfx/mc/mcwalkingshallow.png', walkingGeometry, { cols: 8, y: 0, duration: 4});
const walkShallowLeftAnimation: FrameAnimation = createAnimation('gfx/mc/mcwalkingshallow.png', walkingGeometry, { cols: 8, y: 3, duration: 4});
const walkShallowRightAnimation: FrameAnimation = createAnimation('gfx/mc/mcwalkingshallow.png', walkingGeometry, { cols: 8, y: 1, duration: 4});

const attackingGeometry: FrameDimensions = {w: 20, h: 28, content: {x: 2, y: 16 + Y_OFF, w: 16, h: 16}};
const attackUpAnimation: FrameAnimation = createAnimation('gfx/mc/mcchakramthrow.png', attackingGeometry, { cols: 4, x: 1, y: 2, duration: 3}, {loop: false});
const attackDownAnimation: FrameAnimation = createAnimation('gfx/mc/mcchakramthrow.png', attackingGeometry, { cols: 4, x: 1, y: 0, duration: 3}, {loop: false});
const attackLeftAnimation: FrameAnimation = createAnimation('gfx/mc/mcchakramthrow.png', attackingGeometry, { cols: 4, x: 1, y: 3, duration: 3}, {loop: false});
const attackRightAnimation: FrameAnimation = createAnimation('gfx/mc/mcchakramthrow.png', attackingGeometry, { cols: 4, x: 1, y: 1, duration: 3}, {loop: false});
const attackShallowUpAnimation: FrameAnimation = createAnimation('gfx/mc/mcchakramthrowshallow.png', attackingGeometry, { cols: 4, x: 1, y: 2, duration: 3}, {loop: false});
const attackShallowDownAnimation: FrameAnimation = createAnimation('gfx/mc/mcchakramthrowshallow.png', attackingGeometry, { cols: 4, x: 1, y: 0, duration: 3}, {loop: false});
const attackShallowLeftAnimation: FrameAnimation = createAnimation('gfx/mc/mcchakramthrowshallow.png', attackingGeometry, { cols: 4, x: 1, y: 3, duration: 3}, {loop: false});
const attackShallowRightAnimation: FrameAnimation = createAnimation('gfx/mc/mcchakramthrowshallow.png', attackingGeometry, { cols: 4, x: 1, y: 1, duration: 3}, {loop: false});

const rollGeometry: FrameDimensions = {w: 20, h: 28, content: {x: 2, y: 16 + Y_OFF, w: 16, h: 16}};
const rollUpAnimation: FrameAnimation = createAnimation('gfx/mc/mcroll.png', rollGeometry, { cols: 4, x: 1, y: 2, duration: 4}, {loop: false});
const rollDownAnimation: FrameAnimation = createAnimation('gfx/mc/mcroll.png', rollGeometry, { cols: 4, x: 1, y: 0, duration: 4}, {loop: false});
const rollLeftAnimation: FrameAnimation = createAnimation('gfx/mc/mcroll.png', rollGeometry, { cols: 4, x: 1, y: 3, duration: 4}, {loop: false});
const rollRightAnimation: FrameAnimation = createAnimation('gfx/mc/mcroll.png', rollGeometry, { cols: 4, x: 1, y: 1, duration: 4}, {loop: false});


const pushGeometry: FrameDimensions = {w: 20, h: 28, content: {x: 2, y: 16 + Y_OFF, w: 16, h: 16}};
const grabUpAnimation: FrameAnimation = createAnimation('gfx/mc/mcpushpull.png', pushGeometry, { cols: 1, x: 1, y: 2, duration: 8});
const grabDownAnimation: FrameAnimation = createAnimation('gfx/mc/mcpushpull.png', pushGeometry, { cols: 1, x: 1, y: 0, duration: 8});
const grabLeftAnimation: FrameAnimation = createAnimation('gfx/mc/mcpushpull.png', pushGeometry, { cols: 1, x: 1, y: 3, duration: 8});
const grabRightAnimation: FrameAnimation = createAnimation('gfx/mc/mcpushpull.png', pushGeometry, { cols: 1, x: 1, y: 1, duration: 8});
const pullUpAnimation: FrameAnimation = createAnimation('gfx/mc/mcpushpull.png', pushGeometry, { cols: 3, x: 2, y: 2, duration: 8, frameMap:[0, 1, 0, 2]});
const pullDownAnimation: FrameAnimation = createAnimation('gfx/mc/mcpushpull.png', pushGeometry, { cols: 3, x: 2, y: 0, duration: 8, frameMap:[0, 1, 0, 2]});
const pullLeftAnimation: FrameAnimation = createAnimation('gfx/mc/mcpushpull.png', pushGeometry, { cols: 3, x: 2, y: 3, duration: 8, frameMap:[0, 1, 0, 2]});
const pullRightAnimation: FrameAnimation = createAnimation('gfx/mc/mcpushpull.png', pushGeometry, { cols: 3, x: 2, y: 1, duration: 8, frameMap:[0, 1, 0, 2]});
const pushUpAnimation: FrameAnimation = createAnimation('gfx/mc/mcpushpull.png', pushGeometry, { cols: 3, x: 5, y: 2, duration: 8, frameMap:[0, 1, 0, 2]});
const pushDownAnimation: FrameAnimation = createAnimation('gfx/mc/mcpushpull.png', pushGeometry, { cols: 3, x: 5, y: 0, duration: 8, frameMap:[0, 1, 0, 2]});
const pushLeftAnimation: FrameAnimation = createAnimation('gfx/mc/mcpushpull.png', pushGeometry, { cols: 3, x: 5, y: 3, duration: 8, frameMap:[0, 1, 0, 2]});
const pushRightAnimation: FrameAnimation = createAnimation('gfx/mc/mcpushpull.png', pushGeometry, { cols: 3, x: 5, y: 1, duration: 8, frameMap:[0, 1, 0, 2]});
const grabShallowUpAnimation: FrameAnimation = createAnimation('gfx/mc/mcpushpullshallow.png', pushGeometry, { cols: 1, x: 1, y: 2, duration: 8});
const grabShallowDownAnimation: FrameAnimation = createAnimation('gfx/mc/mcpushpullshallow.png', pushGeometry, { cols: 1, x: 1, y: 0, duration: 8});
const grabShallowLeftAnimation: FrameAnimation = createAnimation('gfx/mc/mcpushpullshallow.png', pushGeometry, { cols: 1, x: 1, y: 3, duration: 8});
const grabShallowRightAnimation: FrameAnimation = createAnimation('gfx/mc/mcpushpullshallow.png', pushGeometry, { cols: 1, x: 1, y: 1, duration: 8});
const pullShallowUpAnimation: FrameAnimation = createAnimation('gfx/mc/mcpushpullshallow.png', pushGeometry, { cols: 3, x: 2, y: 2, duration: 8, frameMap:[0, 1, 0, 2]});
const pullShallowDownAnimation: FrameAnimation = createAnimation('gfx/mc/mcpushpullshallow.png', pushGeometry, { cols: 3, x: 2, y: 0, duration: 8, frameMap:[0, 1, 0, 2]});
const pullShallowLeftAnimation: FrameAnimation = createAnimation('gfx/mc/mcpushpullshallow.png', pushGeometry, { cols: 3, x: 2, y: 3, duration: 8, frameMap:[0, 1, 0, 2]});
const pullShallowRightAnimation: FrameAnimation = createAnimation('gfx/mc/mcpushpullshallow.png', pushGeometry, { cols: 3, x: 2, y: 1, duration: 8, frameMap:[0, 1, 0, 2]});
const pushShallowUpAnimation: FrameAnimation = createAnimation('gfx/mc/mcpushpullshallow.png', pushGeometry, { cols: 3, x: 5, y: 2, duration: 8, frameMap:[0, 1, 0, 2]});
const pushShallowDownAnimation: FrameAnimation = createAnimation('gfx/mc/mcpushpullshallow.png', pushGeometry, { cols: 3, x: 5, y: 0, duration: 8, frameMap:[0, 1, 0, 2]});
const pushShallowLeftAnimation: FrameAnimation = createAnimation('gfx/mc/mcpushpullshallow.png', pushGeometry, { cols: 3, x: 5, y: 3, duration: 8, frameMap:[0, 1, 0, 2]});
const pushShallowRightAnimation: FrameAnimation = createAnimation('gfx/mc/mcpushpullshallow.png', pushGeometry, { cols: 3, x: 5, y: 1, duration: 8, frameMap:[0, 1, 0, 2]});

const swimGeometry: FrameDimensions = {w: 20, h: 28, content: {x: 2, y: 16 + Y_OFF, w: 16, h: 16}};
const floatUpAnimation: FrameAnimation = createAnimation('gfx/mc/wukongswim.png', swimGeometry, { cols: 2, x: 0, y: 2, duration: 16});
const floatDownAnimation: FrameAnimation = createAnimation('gfx/mc/wukongswim.png', swimGeometry, { cols: 2, x: 0, y: 0, duration: 16});
const floatLeftAnimation: FrameAnimation = createAnimation('gfx/mc/wukongswim.png', swimGeometry, { cols: 2, x: 0, y: 3, duration: 16});
const floatRightAnimation: FrameAnimation = createAnimation('gfx/mc/wukongswim.png', swimGeometry, { cols: 2, x: 0, y: 1, duration: 16});
const swimUpAnimation: FrameAnimation = createAnimation('gfx/mc/wukongswim.png', swimGeometry, { cols: 6, x: 2, y: 2, duration: 8});
const swimDownAnimation: FrameAnimation = createAnimation('gfx/mc/wukongswim.png', swimGeometry, { cols: 6, x: 2, y: 0, duration: 8});
const swimLeftAnimation: FrameAnimation = createAnimation('gfx/mc/wukongswim.png', swimGeometry, { cols: 6, x: 2, y: 3, duration: 8});
const swimRightAnimation: FrameAnimation = createAnimation('gfx/mc/wukongswim.png', swimGeometry, { cols: 6, x: 2, y: 1, duration: 8});


const fallGeometry: FrameDimensions = {w: 20, h: 28, content: {x: 2, y: 16 + Y_OFF, w: 16, h: 16}};
export const fallAnimation: FrameAnimation = createAnimation('gfx/mc/mcfall.png', fallGeometry, { cols: 13, duration: 4}, { loop: false });

export const heroAnimations: ActorAnimations = {
    attack: {
        up: attackUpAnimation,
        down: attackDownAnimation,
        left: attackLeftAnimation,
        right: attackRightAnimation,
    },
    falling: {
        up: fallAnimation,
        down: fallAnimation,
        left: fallAnimation,
        right: fallAnimation,
    },
    grab: {
        up: grabUpAnimation,
        down: grabDownAnimation,
        left: grabLeftAnimation,
        right: grabRightAnimation,
    },
    hurt: {
        up: hurtUpAnimation,
        down: hurtDownAnimation,
        left: hurtLeftAnimation,
        right: hurtRightAnimation,
    },
    idle: {
        up: upAnimation,
        down: downAnimation,
        left: leftAnimation,
        right: rightAnimation,
    },
    move: {
        up: walkUpAnimation,
        down: walkDownAnimation,
        left: walkLeftAnimation,
        right: walkRightAnimation,
    },
    pull: {
        up: pullUpAnimation,
        down: pullDownAnimation,
        left: pullLeftAnimation,
        right: pullRightAnimation,
    },
    push: {
        up: pushUpAnimation,
        down: pushDownAnimation,
        left: pushLeftAnimation,
        right: pushRightAnimation,
    },
    roll: {
        up: rollUpAnimation,
        down: rollDownAnimation,
        left: rollLeftAnimation,
        right: rollRightAnimation,
    },
};

export const heroShallowAnimations: ActorAnimations = {
    attack: {
        up: attackShallowUpAnimation,
        down: attackShallowDownAnimation,
        left: attackShallowLeftAnimation,
        right: attackShallowRightAnimation,
    },
    grab: {
        up: grabShallowUpAnimation,
        down: grabShallowDownAnimation,
        left: grabShallowLeftAnimation,
        right: grabShallowRightAnimation,
    },
    idle: {
        up: upShallowAnimation,
        down: downShallowAnimation,
        left: leftShallowAnimation,
        right: rightShallowAnimation,
    },
    move: {
        up: walkShallowUpAnimation,
        down: walkShallowDownAnimation,
        left: walkShallowLeftAnimation,
        right: walkShallowRightAnimation,
    },
    pull: {
        up: pullShallowUpAnimation,
        down: pullShallowDownAnimation,
        left: pullShallowLeftAnimation,
        right: pullShallowRightAnimation,
    },
    push: {
        up: pushShallowUpAnimation,
        down: pushShallowDownAnimation,
        left: pushShallowLeftAnimation,
        right: pushShallowRightAnimation,
    },
};


export const heroSwimAnimations: ActorAnimations = {
    idle: {
        up: floatUpAnimation,
        down: floatDownAnimation,
        left: floatLeftAnimation,
        right: floatRightAnimation,
    },
    move: {
        up: swimUpAnimation,
        down: swimDownAnimation,
        left: swimLeftAnimation,
        right: swimRightAnimation,
    },
};
