import { query } from 'app/dom';
import { addKeyboardListeners } from 'app/userInput';
import { getState, initializeState } from 'app/state';
import { addKeyboardShortcuts } from 'app/utils/addKeyboardShortcuts';
import { bindMouseListeners } from 'app/utils/mouse';
import { returnToSpawnLocation } from 'app/utils/returnToSpawnLocation';
import { SPAWN_LOCATION_TITLE } from 'app/content/spawnLocations';

export function initializeGame() {
    bindMouseListeners();
    // Depends on items being defined.
    initializeState();
    addKeyboardListeners();
    addKeyboardShortcuts();
    query('.js-loading').style.display = 'none';
    query('.js-gameContent').style.display = '';
    let state = getState();
    state.gameHasBeenInitialized = true;
    // Temporary: show title location initally.
    state.hero.savedData.spawnLocation = SPAWN_LOCATION_TITLE;
    state.scene = 'title';
    returnToSpawnLocation(state);
    state.camera = { x: 46, y: 230 };
    console.log(state.camera);
}
