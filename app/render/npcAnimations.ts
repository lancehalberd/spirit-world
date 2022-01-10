import { createAnimation } from 'app/utils/animations';

import { ActorAnimations, FrameAnimation, FrameDimensions } from 'app/types';

const momGeometry: FrameDimensions = {w: 21, h: 32, content: {x: 2, y: 16, w: 16, h: 16}};
const momUpAnimation: FrameAnimation = createAnimation('gfx/npcs/21x32-mom.png', momGeometry, { x: 2});
const momDownAnimation: FrameAnimation = createAnimation('gfx/npcs/21x32-mom.png', momGeometry, { x: 0});
const momLeftAnimation: FrameAnimation = createAnimation('gfx/npcs/21x32-mom.png', momGeometry, { x: 3});
const momRightAnimation: FrameAnimation = createAnimation('gfx/npcs/21x32-mom.png', momGeometry, { x: 1});
const momWalkUpAnimation: FrameAnimation = createAnimation('gfx/npcs/21x32-mom.png', momGeometry, { cols: 4, y: 3, duration: 4});
const momWalkDownAnimation: FrameAnimation = createAnimation('gfx/npcs/21x32-mom.png', momGeometry, { cols: 4, y: 0, duration: 4});
const momWalkLeftAnimation: FrameAnimation = createAnimation('gfx/npcs/21x32-mom.png', momGeometry, { cols: 4, y: 2, duration: 4});
const momWalkRightAnimation: FrameAnimation = createAnimation('gfx/npcs/21x32-mom.png', momGeometry, { cols: 4, y: 1, duration: 4});

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

export const momAnimations: ActorAnimations = {
    idle: {
        up: momUpAnimation,
        down: momDownAnimation,
        left: momLeftAnimation,
        right: momRightAnimation,
    },
    move: {
        up: momWalkUpAnimation,
        down: momWalkDownAnimation,
        left: momWalkLeftAnimation,
        right: momWalkRightAnimation,
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
