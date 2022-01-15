import { createAnimation } from 'app/utils/animations';

import { ActorAnimations, FrameAnimation, FrameDimensions } from 'app/types';

/*


createAnimation(
    source: string | HTMLImageElement | HTMLCanvasElement, dimensions: FrameDimensions,
    { x, y, rows, cols, xSpace, top, left, duration, frameMap }?: CreateAnimationOptions,
    props?: ExtraAnimationProperties): FrameAnimation
import createAnimation
*/

const humanGeometry: FrameDimensions = {w: 24, h: 36, content: {x: 4, y: 20, w: 16, h: 16}};
const momImage: string = 'gfx/npcs/24x36-mom.png'; 

const momUpAnimation: FrameAnimation = createAnimation(momImage, humanGeometry, { x: 0, y: 3});
const momDownAnimation: FrameAnimation = createAnimation(momImage, humanGeometry, { x: 0, y: 0});
const momLeftAnimation: FrameAnimation = createAnimation(momImage, humanGeometry, { x: 0, y: 2});
const momRightAnimation: FrameAnimation = createAnimation(momImage, humanGeometry, { x: 0, y: 1});
const momIdleUpAnimation: FrameAnimation =
    createAnimation(momImage, humanGeometry, { cols: 4, y: 3, duration: 4});
const momIdleDownAnimation: FrameAnimation =
    createAnimation(momImage, humanGeometry, { cols: 4, y: 0, duration: 4});
const momIdleLeftAnimation: FrameAnimation =
    createAnimation(momImage, humanGeometry, { cols: 4, y: 2, duration: 4});
const momIdleRightAnimation: FrameAnimation =
    createAnimation(momImage, humanGeometry, { cols: 4, y: 1, duration: 4});
const momWalkUpAnimation: FrameAnimation =
    createAnimation(momImage, humanGeometry, { cols: 4, y: 7, duration: 4});
const momWalkDownAnimation: FrameAnimation =
    createAnimation(momImage, humanGeometry, { cols: 4, y: 4, duration: 4});
const momWalkLeftAnimation: FrameAnimation =
    createAnimation(momImage, humanGeometry, { cols: 4, y: 6, duration: 4});
const momWalkRightAnimation: FrameAnimation =
    createAnimation(momImage, humanGeometry, { cols: 4, y: 5, duration: 4});

const guyUpAnimation: FrameAnimation = createAnimation('gfx/npcs/24x36-guy.png', humanGeometry, { x: 2});
const guyDownAnimation: FrameAnimation = createAnimation('gfx/npcs/24x36-guy.png', humanGeometry, { x: 0});
const guyLeftAnimation: FrameAnimation = createAnimation('gfx/npcs/24x36-guy.png', humanGeometry, { x: 3});
const guyRightAnimation: FrameAnimation = createAnimation('gfx/npcs/24x36-guy.png', humanGeometry, { x: 1});
const guyWalkUpAnimation: FrameAnimation = createAnimation('gfx/npcs/24x36-guy.png', humanGeometry, { cols: 4, y: 3, duration: 4});
const guyWalkDownAnimation: FrameAnimation = createAnimation('gfx/npcs/24x36-guy.png', humanGeometry, { cols: 4, y: 0, duration: 4});
const guyWalkLeftAnimation: FrameAnimation = createAnimation('gfx/npcs/24x36-guy.png', humanGeometry, { cols: 4, y: 2, duration: 4});
const guyWalkRightAnimation: FrameAnimation = createAnimation('gfx/npcs/24x36-guy.png', humanGeometry, { cols: 4, y: 1, duration: 4});

const zoroGeometry: FrameDimensions = {w: 21, h: 32, content: {x: 2, y: 16, w: 16, h: 16}};
const zoroUpAnimation: FrameAnimation = createAnimation('gfx/npcs/21x32-zoro.png', zoroGeometry, { x: 2});
const zoroDownAnimation: FrameAnimation = createAnimation('gfx/npcs/21x32-zoro.png', zoroGeometry, { x: 0});
const zoroLeftAnimation: FrameAnimation = createAnimation('gfx/npcs/21x32-zoro.png', zoroGeometry, { x: 3});
const zoroRightAnimation: FrameAnimation = createAnimation('gfx/npcs/21x32-zoro.png', zoroGeometry, { x: 1});
const zoroWalkUpAnimation: FrameAnimation = createAnimation('gfx/npcs/21x32-zoro.png', zoroGeometry, { cols: 4, y: 3, duration: 4});
const zoroWalkDownAnimation: FrameAnimation = createAnimation('gfx/npcs/21x32-zoro.png', zoroGeometry, { cols: 4, y: 0, duration: 4});
const zoroWalkLeftAnimation: FrameAnimation = createAnimation('gfx/npcs/21x32-zoro.png', zoroGeometry, { cols: 4, y: 2, duration: 4});
const zoroWalkRightAnimation: FrameAnimation = createAnimation('gfx/npcs/21x32-zoro.png', zoroGeometry, { cols: 4, y: 1, duration: 4});

const vanaraBlackGeometry: FrameDimensions = {w: 18, h: 26, content: {x: 1, y: 11, w: 16, h: 16}};
const vanaraBlackUpAnimation: FrameAnimation = createAnimation('gfx/npcs/vanara-black-facing.png', vanaraBlackGeometry, { x: 2});
const vanaraBlackDownAnimation: FrameAnimation = createAnimation('gfx/npcs/vanara-black-facing.png', vanaraBlackGeometry, { x: 0});
const vanaraBlackLeftAnimation: FrameAnimation = createAnimation('gfx/npcs/vanara-black-facing.png', vanaraBlackGeometry, { x: 3});
const vanaraBlackRightAnimation: FrameAnimation = createAnimation('gfx/npcs/vanara-black-facing.png', vanaraBlackGeometry, { x: 1});
const vanaraBlackWalkingGeometry: FrameDimensions = {w: 20, h: 28, content: {x: 2, y: 12, w: 16, h: 16}};
const vanaraBlackWalkUpAnimation: FrameAnimation = createAnimation('gfx/npcs/vanara-black-walking.png', vanaraBlackWalkingGeometry, { cols: 8, y: 2, duration: 4});
const vanaraBlackWalkDownAnimation: FrameAnimation = createAnimation('gfx/npcs/vanara-black-walking.png', vanaraBlackWalkingGeometry, { cols: 8, y: 0, duration: 4});
const vanaraBlackWalkLeftAnimation: FrameAnimation = createAnimation('gfx/npcs/vanara-black-walking.png', vanaraBlackWalkingGeometry, { cols: 8, y: 3, duration: 4});
const vanaraBlackWalkRightAnimation: FrameAnimation = createAnimation('gfx/npcs/vanara-black-walking.png', vanaraBlackWalkingGeometry, { cols: 8, y: 1, duration: 4});

const vanaraBlueGeometry: FrameDimensions = {w: 18, h: 26, content: {x: 1, y: 11, w: 16, h: 16}};
const vanaraBlueUpAnimation: FrameAnimation = createAnimation('gfx/npcs/vanara-black-facing.png', vanaraBlueGeometry, { x: 2});
const vanaraBlueDownAnimation: FrameAnimation = createAnimation('gfx/npcs/vanara-black-facing.png', vanaraBlueGeometry, { x: 0});
const vanaraBlueLeftAnimation: FrameAnimation = createAnimation('gfx/npcs/vanara-black-facing.png', vanaraBlueGeometry, { x: 3});
const vanaraBlueRightAnimation: FrameAnimation = createAnimation('gfx/npcs/vanara-black-facing.png', vanaraBlueGeometry, { x: 1});
const vanaraBlueWalkingGeometry: FrameDimensions = {w: 20, h: 28, content: {x: 2, y: 12, w: 16, h: 16}};
const vanaraBlueWalkUpAnimation: FrameAnimation = createAnimation('gfx/npcs/vanara-black-walking.png', vanaraBlueWalkingGeometry, { cols: 8, y: 2, duration: 4});
const vanaraBlueWalkDownAnimation: FrameAnimation = createAnimation('gfx/npcs/vanara-black-walking.png', vanaraBlueWalkingGeometry, { cols: 8, y: 0, duration: 4});
const vanaraBlueWalkLeftAnimation: FrameAnimation = createAnimation('gfx/npcs/vanara-black-walking.png', vanaraBlueWalkingGeometry, { cols: 8, y: 3, duration: 4});
const vanaraBlueWalkRightAnimation: FrameAnimation = createAnimation('gfx/npcs/vanara-black-walking.png', vanaraBlueWalkingGeometry, { cols: 8, y: 1, duration: 4});

const vanaraPurpleGeometry: FrameDimensions = {w: 18, h: 26, content: {x: 1, y: 11, w: 16, h: 16}};
const vanaraPurpleUpAnimation: FrameAnimation = createAnimation('gfx/npcs/vanara-purple-facing.png', vanaraPurpleGeometry, { x: 2});
const vanaraPurpleDownAnimation: FrameAnimation = createAnimation('gfx/npcs/vanara-purple-facing.png', vanaraPurpleGeometry, { x: 0});
const vanaraPurpleLeftAnimation: FrameAnimation = createAnimation('gfx/npcs/vanara-purple-facing.png', vanaraPurpleGeometry, { x: 3});
const vanaraPurpleRightAnimation: FrameAnimation = createAnimation('gfx/npcs/vanara-purple-facing.png', vanaraPurpleGeometry, { x: 1});
const vanaraPurpleWalkingGeometry: FrameDimensions = {w: 20, h: 28, content: {x: 2, y: 12, w: 16, h: 16}};
const vanaraPurpleWalkUpAnimation: FrameAnimation = createAnimation('gfx/npcs/vanara-purple-walking.png', vanaraPurpleWalkingGeometry, { cols: 8, y: 2, duration: 4});
const vanaraPurpleWalkDownAnimation: FrameAnimation = createAnimation('gfx/npcs/vanara-purple-walking.png', vanaraPurpleWalkingGeometry, { cols: 8, y: 0, duration: 4});
const vanaraPurpleWalkLeftAnimation: FrameAnimation = createAnimation('gfx/npcs/vanara-purple-walking.png', vanaraPurpleWalkingGeometry, { cols: 8, y: 3, duration: 4});
const vanaraPurpleWalkRightAnimation: FrameAnimation = createAnimation('gfx/npcs/vanara-purple-walking.png', vanaraPurpleWalkingGeometry, { cols: 8, y: 1, duration: 4});

const vanaraBrownGeometry: FrameDimensions = {w: 18, h: 26, content: {x: 1, y: 11, w: 16, h: 16}};
const vanaraBrownUpAnimation: FrameAnimation = createAnimation('gfx/npcs/vanara-brown-facing.png', vanaraBrownGeometry, { x: 2});
const vanaraBrownDownAnimation: FrameAnimation = createAnimation('gfx/npcs/vanara-brown-facing.png', vanaraBrownGeometry, { x: 0});
const vanaraBrownLeftAnimation: FrameAnimation = createAnimation('gfx/npcs/vanara-brown-facing.png', vanaraBrownGeometry, { x: 3});
const vanaraBrownRightAnimation: FrameAnimation = createAnimation('gfx/npcs/vanara-brown-facing.png', vanaraBrownGeometry, { x: 1});
const vanaraBrownWalkingGeometry: FrameDimensions = {w: 20, h: 28, content: {x: 2, y: 12, w: 16, h: 16}};
const vanaraBrownWalkUpAnimation: FrameAnimation = createAnimation('gfx/npcs/vanara-brown-walking.png', vanaraBrownWalkingGeometry, { cols: 8, y: 2, duration: 4});
const vanaraBrownWalkDownAnimation: FrameAnimation = createAnimation('gfx/npcs/vanara-brown-walking.png', vanaraBrownWalkingGeometry, { cols: 8, y: 0, duration: 4});
const vanaraBrownWalkLeftAnimation: FrameAnimation = createAnimation('gfx/npcs/vanara-brown-walking.png', vanaraBrownWalkingGeometry, { cols: 8, y: 3, duration: 4});
const vanaraBrownWalkRightAnimation: FrameAnimation = createAnimation('gfx/npcs/vanara-brown-walking.png', vanaraBrownWalkingGeometry, { cols: 8, y: 1, duration: 4});

const vanaraGoldGeometry: FrameDimensions = {w: 18, h: 26, content: {x: 1, y: 11, w: 16, h: 16}};
const vanaraGoldUpAnimation: FrameAnimation = createAnimation('gfx/npcs/vanara-gold-facing.png', vanaraGoldGeometry, { x: 2});
const vanaraGoldDownAnimation: FrameAnimation = createAnimation('gfx/npcs/vanara-gold-facing.png', vanaraGoldGeometry, { x: 0});
const vanaraGoldLeftAnimation: FrameAnimation = createAnimation('gfx/npcs/vanara-gold-facing.png', vanaraGoldGeometry, { x: 3});
const vanaraGoldRightAnimation: FrameAnimation = createAnimation('gfx/npcs/vanara-gold-facing.png', vanaraGoldGeometry, { x: 1});
const vanaraGoldWalkingGeometry: FrameDimensions = {w: 20, h: 28, content: {x: 2, y: 12, w: 16, h: 16}};
const vanaraGoldWalkUpAnimation: FrameAnimation = createAnimation('gfx/npcs/vanara-gold-walking.png', vanaraGoldWalkingGeometry, { cols: 8, y: 2, duration: 4});
const vanaraGoldWalkDownAnimation: FrameAnimation = createAnimation('gfx/npcs/vanara-gold-walking.png', vanaraGoldWalkingGeometry, { cols: 8, y: 0, duration: 4});
const vanaraGoldWalkLeftAnimation: FrameAnimation = createAnimation('gfx/npcs/vanara-gold-walking.png', vanaraGoldWalkingGeometry, { cols: 8, y: 3, duration: 4});
const vanaraGoldWalkRightAnimation: FrameAnimation = createAnimation('gfx/npcs/vanara-gold-walking.png', vanaraGoldWalkingGeometry, { cols: 8, y: 1, duration: 4});

const vanaraGrayGeometry: FrameDimensions = {w: 18, h: 26, content: {x: 1, y: 11, w: 16, h: 16}};
const vanaraGrayUpAnimation: FrameAnimation = createAnimation('gfx/npcs/vanara-gray-facing.png', vanaraGrayGeometry, { x: 2});
const vanaraGrayDownAnimation: FrameAnimation = createAnimation('gfx/npcs/vanara-gray-facing.png', vanaraGrayGeometry, { x: 0});
const vanaraGrayLeftAnimation: FrameAnimation = createAnimation('gfx/npcs/vanara-gray-facing.png', vanaraGrayGeometry, { x: 3});
const vanaraGrayRightAnimation: FrameAnimation = createAnimation('gfx/npcs/vanara-gray-facing.png', vanaraGrayGeometry, { x: 1});
const vanaraGrayWalkingGeometry: FrameDimensions = {w: 20, h: 28, content: {x: 2, y: 12, w: 16, h: 16}};
const vanaraGrayWalkUpAnimation: FrameAnimation = createAnimation('gfx/npcs/vanara-gray-walking.png', vanaraGrayWalkingGeometry, { cols: 8, y: 2, duration: 4});
const vanaraGrayWalkDownAnimation: FrameAnimation = createAnimation('gfx/npcs/vanara-gray-walking.png', vanaraGrayWalkingGeometry, { cols: 8, y: 0, duration: 4});
const vanaraGrayWalkLeftAnimation: FrameAnimation = createAnimation('gfx/npcs/vanara-gray-walking.png', vanaraGrayWalkingGeometry, { cols: 8, y: 3, duration: 4});
const vanaraGrayWalkRightAnimation: FrameAnimation = createAnimation('gfx/npcs/vanara-gray-walking.png', vanaraGrayWalkingGeometry, { cols: 8, y: 1, duration: 4});

const vanaraRedGeometry: FrameDimensions = {w: 18, h: 26, content: {x: 1, y: 11, w: 16, h: 16}};
const vanaraRedUpAnimation: FrameAnimation = createAnimation('gfx/npcs/vanara-red-facing.png', vanaraRedGeometry, { x: 2});
const vanaraRedDownAnimation: FrameAnimation = createAnimation('gfx/npcs/vanara-red-facing.png', vanaraRedGeometry, { x: 0});
const vanaraRedLeftAnimation: FrameAnimation = createAnimation('gfx/npcs/vanara-red-facing.png', vanaraRedGeometry, { x: 3});
const vanaraRedRightAnimation: FrameAnimation = createAnimation('gfx/npcs/vanara-red-facing.png', vanaraRedGeometry, { x: 1});
const vanaraRedWalkingGeometry: FrameDimensions = {w: 20, h: 28, content: {x: 2, y: 12, w: 16, h: 16}};
const vanaraRedWalkUpAnimation: FrameAnimation = createAnimation('gfx/npcs/vanara-red-walking.png', vanaraRedWalkingGeometry, { cols: 8, y: 2, duration: 4});
const vanaraRedWalkDownAnimation: FrameAnimation = createAnimation('gfx/npcs/vanara-red-walking.png', vanaraRedWalkingGeometry, { cols: 8, y: 0, duration: 4});
const vanaraRedWalkLeftAnimation: FrameAnimation = createAnimation('gfx/npcs/vanara-red-walking.png', vanaraRedWalkingGeometry, { cols: 8, y: 3, duration: 4});
const vanaraRedWalkRightAnimation: FrameAnimation = createAnimation('gfx/npcs/vanara-red-walking.png', vanaraRedWalkingGeometry, { cols: 8, y: 1, duration: 4});

export const guyAnimations: ActorAnimations = {
    idle: {
        up: guyUpAnimation,
        down: guyDownAnimation,
        left: guyLeftAnimation,
        right: guyRightAnimation,
    },
    move: {
        up: guyWalkUpAnimation,
        down: guyWalkDownAnimation,
        left: guyWalkLeftAnimation,
        right: guyWalkRightAnimation,
    },
};

export const momAnimations: ActorAnimations = {
    still: {
        up: momUpAnimation,
        down: momDownAnimation,
        left: momLeftAnimation,
        right: momRightAnimation,
    },
    idle: {
        up: momIdleUpAnimation,
        down: momIdleDownAnimation,
        left: momIdleLeftAnimation,
        right: momIdleRightAnimation,
    },
    move: {
        up: momWalkUpAnimation,
        down: momWalkDownAnimation,
        left: momWalkLeftAnimation,
        right: momWalkRightAnimation,
    },
};

export const vanaraPurpleAnimations: ActorAnimations = {
    idle: {
        up: vanaraPurpleUpAnimation,
        down: vanaraPurpleDownAnimation,
        left: vanaraPurpleLeftAnimation,
        right: vanaraPurpleRightAnimation,
    },
    move: {
        up: vanaraPurpleWalkUpAnimation,
        down: vanaraPurpleWalkDownAnimation,
        left: vanaraPurpleWalkLeftAnimation,
        right: vanaraPurpleWalkRightAnimation,
    },
};

export const vanaraBlackAnimations: ActorAnimations = {
    idle: {
        up: vanaraBlackUpAnimation,
        down: vanaraBlackDownAnimation,
        left: vanaraBlackLeftAnimation,
        right: vanaraBlackRightAnimation,
    },
    move: {
        up: vanaraBlackWalkUpAnimation,
        down: vanaraBlackWalkDownAnimation,
        left: vanaraBlackWalkLeftAnimation,
        right: vanaraBlackWalkRightAnimation,
    },
};

export const vanaraBlueAnimations: ActorAnimations = {
    idle: {
        up: vanaraBlueUpAnimation,
        down: vanaraBlueDownAnimation,
        left: vanaraBlueLeftAnimation,
        right: vanaraBlueRightAnimation,
    },
    move: {
        up: vanaraBlueWalkUpAnimation,
        down: vanaraBlueWalkDownAnimation,
        left: vanaraBlueWalkLeftAnimation,
        right: vanaraBlueWalkRightAnimation,
    },
};

export const vanaraBrownAnimations: ActorAnimations = {
    idle: {
        up: vanaraBrownUpAnimation,
        down: vanaraBrownDownAnimation,
        left: vanaraBrownLeftAnimation,
        right: vanaraBrownRightAnimation,
    },
    move: {
        up: vanaraBrownWalkUpAnimation,
        down: vanaraBrownWalkDownAnimation,
        left: vanaraBrownWalkLeftAnimation,
        right: vanaraBrownWalkRightAnimation,
    },
};

export const vanaraGoldAnimations: ActorAnimations = {
    idle: {
        up: vanaraGoldUpAnimation,
        down: vanaraGoldDownAnimation,
        left: vanaraGoldLeftAnimation,
        right: vanaraGoldRightAnimation,
    },
    move: {
        up: vanaraGoldWalkUpAnimation,
        down: vanaraGoldWalkDownAnimation,
        left: vanaraGoldWalkLeftAnimation,
        right: vanaraGoldWalkRightAnimation,
    },
};

export const vanaraGrayAnimations: ActorAnimations = {
    idle: {
        up: vanaraGrayUpAnimation,
        down: vanaraGrayDownAnimation,
        left: vanaraGrayLeftAnimation,
        right: vanaraGrayRightAnimation,
    },
    move: {
        up: vanaraGrayWalkUpAnimation,
        down: vanaraGrayWalkDownAnimation,
        left: vanaraGrayWalkLeftAnimation,
        right: vanaraGrayWalkRightAnimation,
    },
};

export const vanaraRedAnimations: ActorAnimations = {
    idle: {
        up: vanaraRedUpAnimation,
        down: vanaraRedDownAnimation,
        left: vanaraRedLeftAnimation,
        right: vanaraRedRightAnimation,
    },
    move: {
        up: vanaraRedWalkUpAnimation,
        down: vanaraRedWalkDownAnimation,
        left: vanaraRedWalkLeftAnimation,
        right: vanaraRedWalkRightAnimation,
    },
};

export const zoroAnimations: ActorAnimations = {
    idle: {
        up: zoroUpAnimation,
        down: zoroDownAnimation,
        left: zoroLeftAnimation,
        right: zoroRightAnimation,
    },
    move: {
        up: zoroWalkUpAnimation,
        down: zoroWalkDownAnimation,
        left: zoroWalkLeftAnimation,
        right: zoroWalkRightAnimation,
    },
};
