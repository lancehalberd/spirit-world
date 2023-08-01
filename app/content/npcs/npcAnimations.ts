import { createAnimation, omniAnimation } from 'app/utils/animations';



// This box is taller than it needs as a hack to make it easy to interact with when it is on the pedestal.
const lightningBeastGeometry: FrameDimensions = { w: 79, h: 60, content: { x: 5, y: 6, w: 64, h: 64} };
const lightningBeastSleepingAnimation: FrameAnimation = createAnimation('gfx/npcs/stormbeastsleep.png', lightningBeastGeometry, { cols: 2, duration: 50});
export const lightningBeastAnimations: ActorAnimations = {
    idle: omniAnimation(lightningBeastSleepingAnimation),
};

