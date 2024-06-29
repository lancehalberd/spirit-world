
// Function for switching between controller clones. When switching we just swap properties between
// state.hero and clones, but certain properties should not be transfered.
export function swapHeroStates(heroA: Hero, heroB: Hero) {
    const allKeys = [...new Set([...Object.keys(heroA), ...Object.keys(heroB)])];
    for (const key of allKeys) {
        if (key === 'behaviors' || key === 'magic' || key === 'maxMagic'
            || key === 'life' || key === 'ironSkinCooldown'
            || key === 'isUncontrollable' || key === 'explosionTime'
        ) {
            continue;
        }
        const temp = heroA[key];
        heroA[key] = heroB[key];
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
