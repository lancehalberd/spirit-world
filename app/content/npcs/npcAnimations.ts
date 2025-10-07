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
const stormBeastGeometry: FrameDimensions = { w: 79, h: 60, content: { x: 5, y: 6, w: 64, h: 64} };
const stormBeastSleepingAnimation: FrameAnimation = createAnimation('gfx/npcs/stormbeastsleep.png', stormBeastGeometry, { cols: 2, duration: 50});
export const stormBeastAnimations: ActorAnimations = {
    idle: omniAnimation(stormBeastSleepingAnimation),
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

Size reduction and image corrections by Hillary Spratt

Authors: Benjamin K. Smith (BenCreating), bluecarrot16, TheraHedwig, Evert, MuffinElZangano, Durrani, Pierre Vigier (pvigier), ElizaWy, Matthew Krohn (makrohn), Johannes Sjölund (wulax), Stephen Challener (Redshrike), JaidynReiman, Yamilian, Michael Whitlock (bigbeargames)

- body/bodies/female/amber.png: by Benjamin K. Smith (BenCreating), bluecarrot16, TheraHedwig, Evert, MuffinElZangano, Durrani, Pierre Vigier (pvigier), ElizaWy, Matthew Krohn (makrohn), Johannes Sjölund (wulax), Stephen Challener (Redshrike). License(s): OGA-BY 3.0, CC-BY-SA 3.0, GPL 3.0. see details at https://opengameart.org/content/lpc-character-bases
    - https://opengameart.org/content/liberated-pixel-cup-lpc-base-assets-sprites-map-tiles
    - https://opengameart.org/content/lpc-medieval-fantasy-character-sprites
    - https://opengameart.org/content/lpc-ladies
    - https://opengameart.org/content/lpc-7-womens-shirts
    - https://opengameart.org/content/lpc-jump-expanded

- head/heads/human/male/amber.png: by bluecarrot16, Benjamin K. Smith (BenCreating), Stephen Challener (Redshrike). License(s): OGA-BY 3.0, CC-BY-SA 3.0, GPL 3.0. original head by Redshrike; tweaks by BenCreating; modular version by bluecarrot16
    - https://opengameart.org/content/liberated-pixel-cup-lpc-base-assets-sprites-map-tiles
    - https://opengameart.org/content/lpc-character-bases

- eyes/human/adult/green.png: by JaidynReiman, Matthew Krohn (makrohn), Stephen Challener (Redshrike). License(s): OGA-BY 3.0, CC-BY-SA 3.0, GPL 3.0. original by Redshrike, mapped to all frames by Matthew Krohn & JaidynReiman
    - https://opengameart.org/content/liberated-pixel-cup-lpc-base-assets-sprites-map-tiles

- hair/braid2/female/raven.png: by Yamilian, bluecarrot16. License(s): CC-BY-SA 3.0, GPL 3.0.
    - https://opengameart.org/content/lpc-heroine
    - https://opengameart.org/content/lpc-hair

- shoulders/plate/female/gold.png: by bluecarrot16, Matthew Krohn (makrohn), Johannes Sjölund (wulax). License(s): CC-BY-SA 3.0, GPL 3.0.
    - https://opengameart.org/content/lpc-medieval-fantasy-character-sprites
    - https://opengameart.org/content/lpc-combat-armor-for-women
    - http://opengameart.org/content/lpc-clothing-updates

- arms/gloves/female/green.png: by Michael Whitlock (bigbeargames), Matthew Krohn (makrohn), Johannes Sjölund (wulax), bluecarrot16. License(s): OGA-BY 3.0, CC-BY-SA 3.0, GPL 3.0. metal gloves by wulax, extended to female base by makrohn, recolors by bigbeargames, adapted to v3 bases by bluecarrot16, added to expanded animations by JaidynReiman
    - https://opengameart.org/content/lpc-medieval-fantasy-character-sprites
    - http://opengameart.org/content/lpc-clothing-updates

- torso/clothes/sleeveless/sleeveless2/female/black.png: by ElizaWy, JaidynReiman. License(s): OGA-BY 3.0. original by ElizaWy; sleeveless adapted from original by JaidynReiman
    - http://opengameart.org/content/lpc-revised-character-basics
    - https://github.com/ElizaWy/LPC/tree/main/Characters/Clothing
    - https://opengameart.org/content/expanded-universal-lpc-spritesheet-idle-run-jump-lpc-revised-combat-and-assets

- torso/armour/plate/female/gold.png: by bluecarrot16, Michael Whitlock (bigbeargames), Matthew Krohn (makrohn), Johannes Sjölund (wulax). License(s): CC-BY-SA 3.0, GPL 3.0.
    - https://opengameart.org/content/lpc-medieval-fantasy-character-sprites
    - https://opengameart.org/content/lpc-combat-armor-for-women
    - http://opengameart.org/content/lpc-clothing-updates

- legs/armour/plate/female/gold.png: by bluecarrot16, Michael Whitlock (bigbeargames), Matthew Krohn (makrohn), Johannes Sjölund (wulax). License(s): OGA-BY 3.0, CC-BY-SA 3.0, GPL 3.0.
    - https://opengameart.org/content/lpc-medieval-fantasy-character-sprites

- feet/boots_rim/universal/female/green.png: by JaidynReiman. License(s): OGA-BY 3.0+, CC-BY 3.0+, GPL 3.0.
    - https://opengameart.org/content/lpc-relm-outfit-pieces-2-kimonos-2-sleeves-2-boots-tabi-socks

- feet/boots_plating/universal/female/gold.png: by JaidynReiman. License(s): OGA-BY 3.0+, CC-BY 3.0+, GPL 3.0.
    - https://opengameart.org/content/lpc-relm-outfit-pieces-2-kimonos-2-sleeves-2-boots-tabi-socks
*/

// for 36x36 frames are Up/Left/Down/Right [0-3]Castx7,  [4-7]WalkWeaponx9, [8]DeathWeaponx10, [9-12]Walkx9, [13]Deathx6
const jadeChampionImage: string = 'gfx/npcs/jadeChampionSwordBasics-36x36-28pxnpc-Sheet.png';
const jadeChampionGeometry: FrameDimensions = {w: 36, h: 36, content: {x: 10, y: 20, w: 16, h: 16}};
// for 108x108 frames for xtra large motions Up/Left/Down/Right [0-3]ThrustWeaponx8
const jadeChampionLargeImage: string = 'gfx/npcs/jadeChampion-swordThrust-108x108-28pxnpc-Sheet.png';
const jadeChampionLargeGeometry: FrameDimensions = {w: 108, h: 108, content: {x: 46, y: 56, w: 16, h: 16}};
export const jadeChampionAnimations: ActorAnimations = {
    idle: {
        up: createAnimation(jadeChampionImage, jadeChampionGeometry, {y: 9}),
        left: createAnimation(jadeChampionImage, jadeChampionGeometry, {y: 10}),
        down: createAnimation(jadeChampionImage, jadeChampionGeometry, {y: 11}),
        right: createAnimation(jadeChampionImage, jadeChampionGeometry, {y: 12}),
    },
    // This is just the first frame of moveSword.
    idleSword: {
        up: createAnimation(jadeChampionImage, jadeChampionGeometry, {y: 4}),
        left: createAnimation(jadeChampionImage, jadeChampionGeometry, {y: 5}),
        down: createAnimation(jadeChampionImage, jadeChampionGeometry, {y: 6}),
        right: createAnimation(jadeChampionImage, jadeChampionGeometry, {y: 7}),
    },
    move: {
        up: createAnimation(jadeChampionImage, jadeChampionGeometry, {y: 9, cols: 9}),
        left: createAnimation(jadeChampionImage, jadeChampionGeometry, {y: 10, cols: 9}),
        down: createAnimation(jadeChampionImage, jadeChampionGeometry, {y: 11, cols: 9}),
        right: createAnimation(jadeChampionImage, jadeChampionGeometry, {y: 12, cols: 9}),
    },
    moveSword: {
        up: createAnimation(jadeChampionImage, jadeChampionGeometry, {y: 4, cols: 9}),
        left: createAnimation(jadeChampionImage, jadeChampionGeometry, {y: 5, cols: 9}),
        down: createAnimation(jadeChampionImage, jadeChampionGeometry, {y: 6, cols: 9}),
        right: createAnimation(jadeChampionImage, jadeChampionGeometry, {y: 7, cols: 9}),
    },
    death: {
        up: createAnimation(jadeChampionImage, jadeChampionGeometry, {y: 13, cols: 10, duration: 5}, { loop: false }),
        left: createAnimation(jadeChampionImage, jadeChampionGeometry, {y: 13, cols: 10, duration: 5}, { loop: false }),
        down: createAnimation(jadeChampionImage, jadeChampionGeometry, {y: 13, cols: 10, duration: 5}, { loop: false }),
        right: createAnimation(jadeChampionImage, jadeChampionGeometry, {y: 13, cols: 10, duration: 5}, { loop: false }),
    },
    deathSword: {
        up: createAnimation(jadeChampionImage, jadeChampionGeometry, {y: 8, cols: 10, duration: 5}, { loop: false }),
        left: createAnimation(jadeChampionImage, jadeChampionGeometry, {y: 8, cols: 10, duration: 5}, { loop: false }),
        down: createAnimation(jadeChampionImage, jadeChampionGeometry, {y: 8, cols: 10, duration: 5}, { loop: false }),
        right: createAnimation(jadeChampionImage, jadeChampionGeometry, {y: 8, cols: 10, duration: 5}, { loop: false }),
    },
    cast: {
        up: createAnimation(jadeChampionImage, jadeChampionGeometry, {y: 0, cols: 7}),
        left: createAnimation(jadeChampionImage, jadeChampionGeometry, {y: 1, cols: 7}),
        down: createAnimation(jadeChampionImage, jadeChampionGeometry, {y: 2, cols: 7}),
        right: createAnimation(jadeChampionImage, jadeChampionGeometry, {y: 3, cols: 7}),
    },
    bow: { // half of the cast animation, for praying, showing respect, thanking someone
        up: createAnimation(jadeChampionImage, jadeChampionGeometry, {y: 0, cols: 3, duration: 5}, { loop: false }),
        left: createAnimation(jadeChampionImage, jadeChampionGeometry, {y: 1, cols: 3, duration: 5}, { loop: false }),
        down: createAnimation(jadeChampionImage, jadeChampionGeometry, {y: 2, cols: 3, duration: 5}, { loop: false }),
        right: createAnimation(jadeChampionImage, jadeChampionGeometry, {y: 3, cols: 3, duration: 5}, { loop: false }),
    },
    thrust: {
        up: createAnimation(jadeChampionLargeImage, jadeChampionLargeGeometry, {y: 0, cols: 8, duration: 5}),
        left: createAnimation(jadeChampionLargeImage, jadeChampionLargeGeometry, {y: 1, cols: 8, duration: 5}),
        down: createAnimation(jadeChampionLargeImage, jadeChampionLargeGeometry, {y: 2, cols: 8, duration: 5}),
        right: createAnimation(jadeChampionLargeImage, jadeChampionLargeGeometry, {y: 3, cols: 8, duration: 5}),
    },
};

// Frames are Up/Left/Down/Right [0-3]Castx7, [4-7]Thrustx8 [8-11]Walkx9, [12-15]Slashx6, [16-19]Shootx13 [20]Deathx6
const grandPriestImage: string = 'gfx/npcs/grandPriest.png';
const grandPriestGeometry: FrameDimensions = {w: 36, h: 36, content: {x: 10, y: 20, w: 16, h: 16}};
export const grandPriestAnimations: ActorAnimations = {
    idle: {
        up: createAnimation(grandPriestImage, grandPriestGeometry, {y: 8}),
        left: createAnimation(grandPriestImage, grandPriestGeometry, {y: 9}),
        down: createAnimation(grandPriestImage, grandPriestGeometry, {y: 10}),
        right: createAnimation(grandPriestImage, grandPriestGeometry, {y: 11}),
    },
    move: {
        up: createAnimation(grandPriestImage, grandPriestGeometry, {y: 8, cols: 9}),
        left: createAnimation(grandPriestImage, grandPriestGeometry, {y: 9, cols: 9}),
        down: createAnimation(grandPriestImage, grandPriestGeometry, {y: 10, cols: 9}),
        right: createAnimation(grandPriestImage, grandPriestGeometry, {y: 11, cols: 9}),
    },
    cast: {
        up: createAnimation(grandPriestImage, grandPriestGeometry, {y: 0, cols: 7}),
        left: createAnimation(grandPriestImage, grandPriestGeometry, {y: 1, cols: 7}),
        down: createAnimation(grandPriestImage, grandPriestGeometry, {y: 2, cols: 7}),
        right: createAnimation(grandPriestImage, grandPriestGeometry, {y: 3, cols: 7}),
    },
    bow: { // half of the cast animation, for praying, showing respect, thanking someone
        up: createAnimation(grandPriestImage, grandPriestGeometry, {y: 0, cols: 3, duration: 5}, { loop: false }),
        left: createAnimation(grandPriestImage, grandPriestGeometry, {y: 1, cols: 3, duration: 5}, { loop: false }),
        down: createAnimation(grandPriestImage, grandPriestGeometry, {y: 2, cols: 3, duration: 5}, { loop: false }),
        right: createAnimation(grandPriestImage, grandPriestGeometry, {y: 3, cols: 3, duration: 5}, { loop: false }),
    },
};

// Frames are Up/Left/Down/Right [0-3]Castx7, [4-7]Thrustx8 [8-11]Walkx9, [12-15]Slashx6, [16-19]Shootx13 [20]Deathx6
const paleLadyPriestImage: string = 'gfx/npcs/ladyPriest-white.png';
const paleLadyPriestGeometry: FrameDimensions = {w: 36, h: 36, content: {x: 10, y: 20, w: 16, h: 16}};
export const paleLadyPriestAnimations: ActorAnimations = {
    idle: {
        up: createAnimation(paleLadyPriestImage, paleLadyPriestGeometry, {y: 8}),
        left: createAnimation(paleLadyPriestImage, paleLadyPriestGeometry, {y: 9}),
        down: createAnimation(paleLadyPriestImage, paleLadyPriestGeometry, {y: 10}),
        right: createAnimation(paleLadyPriestImage, paleLadyPriestGeometry, {y: 11}),
    },
    move: {
        up: createAnimation(paleLadyPriestImage, paleLadyPriestGeometry, {y: 8, cols: 9}),
        left: createAnimation(paleLadyPriestImage, paleLadyPriestGeometry, {y: 9, cols: 9}),
        down: createAnimation(paleLadyPriestImage, paleLadyPriestGeometry, {y: 10, cols: 9}),
        right: createAnimation(paleLadyPriestImage, paleLadyPriestGeometry, {y: 11, cols: 9}),
    },
    cast: {
        up: createAnimation(paleLadyPriestImage, paleLadyPriestGeometry, {y: 0, cols: 7}),
        left: createAnimation(paleLadyPriestImage, paleLadyPriestGeometry, {y: 1, cols: 7}),
        down: createAnimation(paleLadyPriestImage, paleLadyPriestGeometry, {y: 2, cols: 7}),
        right: createAnimation(paleLadyPriestImage, paleLadyPriestGeometry, {y: 3, cols: 7}),
    },
    bow: { // half of the cast animation, for praying, showing respect, thanking someone
        up: createAnimation(paleLadyPriestImage, paleLadyPriestGeometry, {y: 0, cols: 3, duration: 5}, { loop: false }),
        left: createAnimation(paleLadyPriestImage, paleLadyPriestGeometry, {y: 1, cols: 3, duration: 5}, { loop: false }),
        down: createAnimation(paleLadyPriestImage, paleLadyPriestGeometry, {y: 2, cols: 3, duration: 5}, { loop: false }),
        right: createAnimation(paleLadyPriestImage, paleLadyPriestGeometry, {y: 3, cols: 3, duration: 5}, { loop: false }),
    },
};

// Frames are Up/Left/Down/Right [0-3]Castx7, [4-7]Thrustx8 [8-11]Walkx9, [12-15]Slashx6, [16-19]Shootx13 [20]Deathx6
const midGuyPriestImage: string = 'gfx/npcs/guyPriest-tan.png';
const midGuyPriestGeometry: FrameDimensions = {w: 36, h: 36, content: {x: 10, y: 20, w: 16, h: 16}};
export const midGuyPriestAnimations: ActorAnimations = {
    idle: {
        up: createAnimation(midGuyPriestImage, midGuyPriestGeometry, {y: 8}),
        left: createAnimation(midGuyPriestImage, midGuyPriestGeometry, {y: 9}),
        down: createAnimation(midGuyPriestImage, midGuyPriestGeometry, {y: 10}),
        right: createAnimation(midGuyPriestImage, midGuyPriestGeometry, {y: 11}),
    },
    move: {
        up: createAnimation(midGuyPriestImage, midGuyPriestGeometry, {y: 8, cols: 9}),
        left: createAnimation(midGuyPriestImage, midGuyPriestGeometry, {y: 9, cols: 9}),
        down: createAnimation(midGuyPriestImage, midGuyPriestGeometry, {y: 10, cols: 9}),
        right: createAnimation(midGuyPriestImage, midGuyPriestGeometry, {y: 11, cols: 9}),
    },
    cast: {
        up: createAnimation(midGuyPriestImage, midGuyPriestGeometry, {y: 0, cols: 7}),
        left: createAnimation(midGuyPriestImage, midGuyPriestGeometry, {y: 1, cols: 7}),
        down: createAnimation(midGuyPriestImage, midGuyPriestGeometry, {y: 2, cols: 7}),
        right: createAnimation(midGuyPriestImage, midGuyPriestGeometry, {y: 3, cols: 7}),
    },
    bow: { // half of the cast animation, for praying, showing respect, thanking someone
        up: createAnimation(midGuyPriestImage, midGuyPriestGeometry, {y: 0, cols: 3, duration: 5}, { loop: false }),
        left: createAnimation(midGuyPriestImage, midGuyPriestGeometry, {y: 1, cols: 3, duration: 5}, { loop: false }),
        down: createAnimation(midGuyPriestImage, midGuyPriestGeometry, {y: 2, cols: 3, duration: 5}, { loop: false }),
        right: createAnimation(midGuyPriestImage, midGuyPriestGeometry, {y: 3, cols: 3, duration: 5}, { loop: false }),
    },
};


const archeologistImage: string = 'gfx/npcs/archeologist.png';
const archeologistGeometry: FrameDimensions = {w: 36, h: 36, content: {x: 10, y: 20, w: 16, h: 16}};
export const archeologistAnimations: ActorAnimations = {
    idle: {
        up: createAnimation(archeologistImage, archeologistGeometry, {y: 0}),
        left: createAnimation(archeologistImage, archeologistGeometry, {y: 1}),
        down: createAnimation(archeologistImage, archeologistGeometry, {y: 2}),
        right: createAnimation(archeologistImage, archeologistGeometry, {y: 3}),
    },
    move: {
        up: createAnimation(archeologistImage, archeologistGeometry, {y: 8, cols: 8}),
        left: createAnimation(archeologistImage, archeologistGeometry, {y: 9, cols: 8}),
        down: createAnimation(archeologistImage, archeologistGeometry, {y: 10, cols: 8}),
        right: createAnimation(archeologistImage, archeologistGeometry, {y: 11, cols: 8}),
    },
    flourish: omniAnimation(createAnimation(archeologistImage, archeologistGeometry, {y: 0, cols: 7})),
};

// These NPCs currently only have south frames.
const merchantImage: string = 'gfx/npcs/travelMerchant.png';
const merchantGeometry: FrameDimensions = {w: 36, h: 36, content: {x: 10, y: 20, w: 16, h: 16}};
export const merchantAnimations: ActorAnimations = {
    idle: omniAnimation(createAnimation(merchantImage, merchantGeometry, {y: 2})),
};

const blacksmithOneImage: string = 'gfx/npcs/blacksmithOne.png';
const blacksmithOneGeometry: FrameDimensions = {w: 36, h: 36, content: {x: 10, y: 20, w: 16, h: 16}};
export const blacksmithOneAnimations: ActorAnimations = {
    idle: omniAnimation(createAnimation(blacksmithOneImage, blacksmithOneGeometry, {y: 2})),
};

const blacksmithTwoImage: string = 'gfx/npcs/blacksmithTwo.png';
const blacksmithTwoGeometry: FrameDimensions = {w: 36, h: 36, content: {x: 10, y: 20, w: 16, h: 16}};
export const blacksmithTwoAnimations: ActorAnimations = {
    idle: omniAnimation(createAnimation(blacksmithTwoImage, blacksmithTwoGeometry, {y: 2})),
};
