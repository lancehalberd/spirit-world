import { createHumanNpcActorAnimations } from 'app/development/npcBuilder';
import { createAnimation, omniAnimation } from 'app/utils/animations';


export const manAnimations: ActorAnimations = createHumanNpcActorAnimations({
    skin: 2,
    hairColor: 1,
    hairStyle: 0,
    eyeColor: 2,
    lipColor: 2,
    shirt: 0,
    pants: 0,
    shoes: 0,
});

export const boyAnimations: ActorAnimations = createHumanNpcActorAnimations({
    isChild: true,
    skin: 3,
    hairColor: 0,
    hairStyle: 1,
    eyeColor: 3,
    lipColor: 3,
    shirt: 1,
    pants: 1,
    shoes: -1,
});

export const womanAnimations: ActorAnimations = createHumanNpcActorAnimations({
    isWoman: true,
    skin: 0,
    hairColor: 3,
    hairStyle: 0,
    eyeColor: 0,
    lipColor: 0,
    shirt: 1,
    pants: 0,
    shoes: 1,
});

export const girlAnimations: ActorAnimations = createHumanNpcActorAnimations({
    isWoman: true,
    isChild: true,
    skin: 1,
    hairColor: 2,
    hairStyle: 1,
    eyeColor: 1,
    lipColor: 1,
    shirt: 1,
    pants: -1,
    shoes: -1,
});


// This box is taller than it needs as a hack to make it easy to interact with when it is on the pedestal.
const lightningBeastGeometry: FrameDimensions = { w: 79, h: 60, content: { x: 5, y: 6, w: 64, h: 64} };
const lightningBeastSleepingAnimation: FrameAnimation = createAnimation('gfx/npcs/stormbeastsleep.png', lightningBeastGeometry, { cols: 2, duration: 50});
export const lightningBeastAnimations: ActorAnimations = {
    idle: omniAnimation(lightningBeastSleepingAnimation),
};


const crystalDragonGeometry: FrameDimensions = { w: 80, h: 80, content: { x: 12, y: 50, w: 57, h: 28} };
const crystalDragonIdleAnimation: FrameAnimation = createAnimation('gfx/npcs/crystalDragonFinal.png', crystalDragonGeometry, { cols: 2, duration: 33});
export const crystalDragonAnimations: ActorAnimations = {
    idle: omniAnimation(crystalDragonIdleAnimation),
};


const momImage: string = 'gfx/npcs/mother.png';
const momGeometry: FrameDimensions = {w: 18, h: 26, content: {x: 1, y: 11, w: 16, h: 16}};
const momDownAnimation: FrameAnimation = createAnimation(momImage, momGeometry);
const momIdleDownAnimation: FrameAnimation = createAnimation(momImage, momGeometry, { cols: 2, duration: 4});

export const momAnimations: ActorAnimations = {
    still: omniAnimation(momDownAnimation),
    idle: omniAnimation(momIdleDownAnimation),
};

const fatherImage: string = 'gfx/npcs/father.png';
const fatherGeometry: FrameDimensions = {w: 18, h: 26, content: {x: 1, y: 11, w: 16, h: 16}};
const fatherDownAnimation: FrameAnimation = createAnimation(fatherImage, fatherGeometry);
const fatherIdleDownAnimation: FrameAnimation = createAnimation(fatherImage, fatherGeometry, { cols: 2, duration: 4});

export const fatherAnimations: ActorAnimations = {
    still: omniAnimation(fatherDownAnimation),
    idle: omniAnimation(fatherIdleDownAnimation),
};

//const testGeometry: FrameDimensions = {w: 14, h: 26};
//const testDownAnimation: FrameAnimation = createAnimation('gfx/staging/human.png', testGeometry, {left: 252});
//window['debugCanvas'](testDownAnimation.frames[0], 2);

/*export const testAnimations: ActorAnimations = {
    still: omniAnimation(testDownAnimation),
    idle: omniAnimation(testDownAnimation),
};
*/
