import { findObjectInstanceById } from 'app/utils/findObjectInstanceById';
import { returnToSpawnLocation } from 'app/utils/returnToSpawnLocation';
import { SPAWN_LOCATION_TITLE } from 'app/content/spawnLocations';
import { Teleporter } from 'app/content/objects/teleporter';

export function initializeTitle(state: GameState) {
    state.hero.savedData.spawnLocation = SPAWN_LOCATION_TITLE;
    state.scene = 'title';
    state.hero.savedData.passiveTools.spiritSight = 1;
    returnToSpawnLocation(state);
    state.camera = { x: 46, y: 230 };

    state.hero.action = 'attack';
    state.hero.animationTime = 180;
    const jadeChampion = findObjectInstanceById(state.hero.area, 'jadeChampion') as NPC;
    jadeChampion.changeToAnimation('thrust');
    jadeChampion.animationTime = 300;

    // uncomment these lines to hide the characters from the title screen
    // state.hero.x = -500;
    // jadeChampion.x = -540;

    const titleTeleporter = findObjectInstanceById(state.hero.area, 'titleTeleporter') as Teleporter;
    titleTeleporter.actualRadius = 110;
}
