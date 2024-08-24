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



/*
Temporary NPC graphics for Jade Champion

Authors: Benjamin K. Smith (BenCreating), bluecarrot16, TheraHedwig, Evert, MuffinElZangano, Durrani, Pierre Vigier (pvigier), ElizaWy, Matthew Krohn (makrohn), Johannes Sjölund (wulax), Stephen Challener (Redshrike), Thane Brimhall (pennomi), JaidynReiman, Yamilian, Nila122, Michael Whitlock (bigbeargames)

- body/bodies/female/amber.png: by Benjamin K. Smith (BenCreating), bluecarrot16, TheraHedwig, Evert, MuffinElZangano, Durrani, Pierre Vigier (pvigier), ElizaWy, Matthew Krohn (makrohn), Johannes Sjölund (wulax), Stephen Challener (Redshrike). License(s): OGA-BY 3.0, CC-BY-SA 3.0, GPL 3.0. see details at https://opengameart.org/content/lpc-character-bases
    - https://opengameart.org/content/liberated-pixel-cup-lpc-base-assets-sprites-map-tiles
    - https://opengameart.org/content/lpc-medieval-fantasy-character-sprites
    - https://opengameart.org/content/lpc-ladies
    - https://opengameart.org/content/lpc-7-womens-shirts
    - https://opengameart.org/content/lpc-jump-expanded

- head/heads/human/female/amber.png: by bluecarrot16, Benjamin K. Smith (BenCreating), Stephen Challener (Redshrike). License(s): OGA-BY 3.0, CC-BY-SA 3.0, GPL 3.0. original head by Redshrike; tweaks by BenCreating; modular version by bluecarrot16
    - https://opengameart.org/content/
    - https://opengameart.org/content/lpc-character-bases

- head/nose/straight/adult/amber.png: by Thane Brimhall (pennomi), Matthew Krohn (makrohn). License(s): GPL 3.0, CC-BY-SA 3.0.
    - https://opengameart.org/content/lpc-base-character-expressions

- eyes/human/adult/green.png: by JaidynReiman, Matthew Krohn (makrohn), Stephen Challener (Redshrike). License(s): OGA-BY 3.0, CC-BY-SA 3.0, GPL 3.0. original by Redshrike, mapped to all frames by Matthew Krohn & JaidynReiman
    - https://opengameart.org/content/liberated-pixel-cup-lpc-base-assets-sprites-map-tiles

- eyes/eyebrows/thin/adult/dark_brown.png: by ElizaWy. License(s): OGA-BY 3.0.
    - https://github.com/ElizaWy/LPC/tree/main/Characters/Hair

- hair/braid2/female/dark_brown.png: by Yamilian, bluecarrot16. License(s): CC-BY-SA 3.0, GPL 3.0.
    - https://opengameart.org/content/lpc-heroine
    - https://opengameart.org/content/lpc-hair

- facial/earrings/simple/left/adult/green.png: by bluecarrot16. License(s): CC-BY-SA 3.0.
    - https://opengameart.org/content/lpc-pirates

- facial/earrings/simple/right/adult/green.png: by bluecarrot16. License(s): CC-BY-SA 3.0.
    - https://opengameart.org/content/lpc-pirates

- shoulders/legion/female/gold.png: by Nila122. License(s): OGA-BY 3.0, CC-BY-SA 3.0, GPL 2.0, GPL 3.0.
    - https://opengameart.org/content/lpc-roman-armor

- arms/armour/plate/female/gold.png: by Michael Whitlock (bigbeargames), Matthew Krohn (makrohn), Johannes Sjölund (wulax). License(s): OGA-BY 3.0, CC-BY-SA 3.0, GPL 3.0.
    - https://opengameart.org/content/lpc-medieval-fantasy-character-sprites
    - https://opengameart.org/content/lpc-combat-armor-for-women
    - http://opengameart.org/content/lpc-clothing-updates

- arms/bracers/female/gold.png: by Matthew Krohn (makrohn), Johannes Sjölund (wulax). License(s): OGA-BY 3.0, CC-BY-SA 3.0, GPL 3.0.
    - https://opengameart.org/content/lpc-medieval-fantasy-character-sprites

- gloves/female/green.png: by Michael Whitlock (bigbeargames), Matthew Krohn (makrohn), Johannes Sjölund (wulax), bluecarrot16. License(s): OGA-BY 3.0, CC-BY-SA 3.0, GPL 3.0.
    - https://opengameart.org/content/lpc-medieval-fantasy-character-sprites
    - http://opengameart.org/content/lpc-clothing-updates

- torso/clothes/longsleeve/longsleeve/female/green.png: by bluecarrot16, ElizaWy, Stephen Challener (Redshrike). License(s): OGA-BY 3.0, CC-BY-SA 3.0, GPL 3.0. original by ElizaWy, edited to v3 bases by bluecarrot16
    - https://opengameart.org/content/liberated-pixel-cup-lpc-base-assets-sprites-map-tiles
    - https://opengameart.org/content/lpc-7-womens-shirts
    - http://opengameart.org/content/lpc-clothing-updates

- torso/armour/plate/female/gold.png: by bluecarrot16, Michael Whitlock (bigbeargames), Matthew Krohn (makrohn), Johannes Sjölund (wulax). License(s): CC-BY-SA 3.0, GPL 3.0.
    - https://opengameart.org/content/lpc-medieval-fantasy-character-sprites
    - https://opengameart.org/content/lpc-combat-armor-for-women
    - http://opengameart.org/content/lpc-clothing-updates

- feet/boots_fold/universal/female/copper.png: by JaidynReiman. License(s): OGA-BY 3.0+, CC-BY 3.0+, GPL 3.0.
    - https://opengameart.org/content/lpc-relm-outfit-pieces-2-kimonos-2-sleeves-2-boots-tabi-socks
*/
// Frames are Up/Left/Down/Right [0-3]Castx7, [4-7]Thrustx8 [8-11]Walkx9, [12-15]Slashx6, [16-19]Shootx13 [20]Deathx6
const jadeChampionImage: string = 'gfx/npcs/jadeChampion.png';
const jadeChampionGeometry: FrameDimensions = {w: 36, h: 36, content: {x: 10, y: 20, w: 16, h: 16}};
export const jadeChampionAnimations: ActorAnimations = {
    idle: {
        up: createAnimation(jadeChampionImage, jadeChampionGeometry, {y: 8}),
        left: createAnimation(jadeChampionImage, jadeChampionGeometry, {y: 9}),
        down: createAnimation(jadeChampionImage, jadeChampionGeometry, {y: 10}),
        right: createAnimation(jadeChampionImage, jadeChampionGeometry, {y: 11}),
    },
    move: {
        up: createAnimation(jadeChampionImage, jadeChampionGeometry, {y: 8, cols: 9}),
        left: createAnimation(jadeChampionImage, jadeChampionGeometry, {y: 9, cols: 9}),
        down: createAnimation(jadeChampionImage, jadeChampionGeometry, {y: 10, cols: 9}),
        right: createAnimation(jadeChampionImage, jadeChampionGeometry, {y: 11, cols: 9}),
    },
    cast: {
        up: createAnimation(jadeChampionImage, jadeChampionGeometry, {y: 0, cols: 7}),
        left: createAnimation(jadeChampionImage, jadeChampionGeometry, {y: 1, cols: 7}),
        down: createAnimation(jadeChampionImage, jadeChampionGeometry, {y: 2, cols: 7}),
        right: createAnimation(jadeChampionImage, jadeChampionGeometry, {y: 3, cols: 7}),
    },
    bow: {
        up: createAnimation(jadeChampionImage, jadeChampionGeometry, {y: 0, cols: 3, duration: 5}, { loop: false }),
        left: createAnimation(jadeChampionImage, jadeChampionGeometry, {y: 1, cols: 3, duration: 5}, { loop: false }),
        down: createAnimation(jadeChampionImage, jadeChampionGeometry, {y: 2, cols: 3, duration: 5}, { loop: false }),
        right: createAnimation(jadeChampionImage, jadeChampionGeometry, {y: 3, cols: 3, duration: 5}, { loop: false }),
    },
};
