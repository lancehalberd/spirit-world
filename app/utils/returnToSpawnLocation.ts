import { enterLocation } from 'app/utils/enterLocation';

import { GameState } from 'app/types';

export function returnToSpawnLocation(state: GameState) {
    state.hero.life = state.hero.maxLife;
    // Only fill the magic bar if the hero has some magic regen.
    if (state.hero.magicRegen) {
        state.hero.magic = state.hero.maxMagic;
    }
    state.defeatState.defeated = false;
    // Clear out any state/flags that shouldn't be kept on the hero.
    state.hero.pickUpTile = null;
    state.hero.pickUpObject = null;
    state.hero.grabObject = null;
    state.hero.grabTile = null;
    state.hero.action = null;
    state.hero.invulnerableFrames = 0;
    state.hero.hasBarrier = false;
    state.hero.isInvisible = false;
    state.hero.activeStaff = null;
    state.hero.frozenDuration = 0;
    state.hero.burnDuration = 0;
    state.hero.vx = 0;
    state.hero.vy = 0;
    state.hero.vz = 0;
    state.hero.d = state.hero.spawnLocation.d;
    enterLocation(state, state.hero.spawnLocation, true, null, true);
    state.fadeLevel = (state.areaInstance.dark || 0) / 100;
}
