
// Function for switching between controller clones. When switching we just swap properties between
// state.hero and clones, but certain properties should not be transfered.
export function swapHeroStates(heroA: Hero, heroB: Hero) {
    const allKeys = [...new Set([...Object.keys(heroA), ...Object.keys(heroB)])];
    for (const key of allKeys) {
        if (key === 'magic' || key === 'maxMagic'
            || key === 'life' || key === 'ironSkinCooldown'
            // These are properties only meant to be set on the clone.
            || key === 'cannotSwapTo' || key === 'isUncontrollable' || key === 'explosionTime'
        ) {
            continue;
        }
        // @ts-ignore: no implicity any
        const temp = heroA[key];
        // @ts-ignore: no implicity any
        heroA[key] = heroB[key];
        // @ts-ignore: no implicity any
        heroB[key] = temp;
    }
    // Update chakrams to match their correct owner.
    for (const hero of [heroA, heroB]) {
        if (hero.heldChakram) {
            hero.heldChakram.hero = hero;
        }
        if (hero.activeBarrierBurst) {
            hero.activeBarrierBurst.source = hero;
        }
        for (const chakram of hero.thrownChakrams) {
            chakram.source = hero;
        }
    }
}
