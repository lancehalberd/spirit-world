import { removeObjectFromArea } from 'app/utils/objects';

import { GameState, Hero } from 'app/types';

export function destroyClone(state: GameState, clone: Hero): void {
    // Cannot destroy a clone if none remain.
    if (!state.hero.clones.length) {
        // Return clone to there last safe location in case they
        // were destroyed for landing in walls.
        clone.d = clone.safeD;
        clone.x = clone.safeX;
        clone.y = clone.safeY;
        return;
    }
    clone.isInvisible = false;
    // Clone staff gets recalled when it is destroyed.
    clone.activeStaff?.recall(state);
    if (clone === state.hero) {
        // If the "clone" destroyed was the hero, then pop the last clone and move the hero to it.
        const lastClone = state.hero.clones.pop();
        state.hero.activeStaff = lastClone.activeStaff;
        state.hero.activeBarrierBurst = lastClone.activeBarrierBurst;
        state.hero.x = lastClone.x;
        state.hero.y = lastClone.y;
        removeObjectFromArea(state, lastClone);
    } else {
        // If a non-hero clone is destroyed we just remove it from the array of clones.
        const index = state.hero.clones.indexOf(clone as any);
        if (index >= 0) {
            state.hero.clones.splice(index, 1);
        }
        removeObjectFromArea(state, clone);
    }
}
