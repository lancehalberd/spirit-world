import { findObjectInstanceById } from 'app/utils/findObjectInstanceById';
import { returnToSpawnLocation } from 'app/utils/returnToSpawnLocation';
import { SPAWN_LOCATION_TITLE } from 'app/content/spawnLocations';

export function initializeTitle(state: GameState) {
    state.hero.savedData.spawnLocation = SPAWN_LOCATION_TITLE;
    state.scene = 'title';
    state.hero.savedData.passiveTools.spiritSight = 1;
    state.hero.action = 'attack';
    returnToSpawnLocation(state);
    state.camera = { x: 46, y: 230 };

    state.hero.action = 'kneel';
    const jadeChampion = findObjectInstanceById(state.hero.area, 'jadeChampion') as NPC;
    jadeChampion.changeToAnimation('attack');
    jadeChampion.animationTime = 0;
    console.log({jadeChampion});
}