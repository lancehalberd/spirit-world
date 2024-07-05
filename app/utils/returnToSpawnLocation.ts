import { isRandomizer } from 'app/gameConstants';
import { appendScript, wait } from 'app/scriptEvents';
import { enterLocation } from 'app/utils/enterLocation';


export function returnToSpawnLocation(state: GameState) {
    state.hero.life = state.hero.savedData.maxLife;
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
    state.hero.d = state.hero.savedData.spawnLocation.d;
    // Clear any script events that may have lingered from a previous state.
    // Do this before entering the new location, which may trigger new events.
    state.scriptEvents.queue = [];
    state.scriptEvents.activeEvents = [];
    enterLocation(state, state.hero.savedData.spawnLocation, true, null, true);
    state.fadeLevel = (state.areaInstance.dark || 0) / 100;


    // Don't display hints in randomizer mode.
    if (isRandomizer) {
        return;
    }

    // Ad hoc system for displaying hints when defeated by the Helix Rival.
    if (state.location.zoneKey === 'lakeTunnel'
        && state.savedState.objectFlags.helixRivalIntro
        && !state.savedState.objectFlags.helixRivalBoss
    ) {
        wait(state, 40);
        appendScript(state, `
             None of your attacks can reach the Spirit World.
            {|}You must find a way to turn your opponent's attacks against them!
        `);
    }
}
