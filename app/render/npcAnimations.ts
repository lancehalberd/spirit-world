import { createAnimation } from 'app/utils/animations';

import { ActorAnimations, FrameAnimation, FrameDimensions } from 'app/types';

const momGeometry: FrameDimensions = {w: 32, h: 48, content: {x: 6, y: 32, w: 20, h: 20}};
const momUpAnimation: FrameAnimation = createAnimation('gfx/npcs/mom.png', momGeometry, { x: 2});
const momDownAnimation: FrameAnimation = createAnimation('gfx/npcs/mom.png', momGeometry, { x: 0});
const momLeftAnimation: FrameAnimation = createAnimation('gfx/npcs/mom.png', momGeometry, { x: 3});
const momRightAnimation: FrameAnimation = createAnimation('gfx/npcs/mom.png', momGeometry, { x: 1});

const momWalkUpAnimation: FrameAnimation = createAnimation('gfx/npcs/mom.png', momGeometry, { cols: 4, y: 3, duration: 4});
const momWalkDownAnimation: FrameAnimation = createAnimation('gfx/npcs/mom.png', momGeometry, { cols: 4, y: 0, duration: 4});
const momWalkLeftAnimation: FrameAnimation = createAnimation('gfx/npcs/mom.png', momGeometry, { cols: 4, y: 2, duration: 4});
const momWalkRightAnimation: FrameAnimation = createAnimation('gfx/npcs/mom.png', momGeometry, { cols: 4, y: 1, duration: 4});


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

/*
export const guyAnimations: ActorAnimations = {
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
};
*/
