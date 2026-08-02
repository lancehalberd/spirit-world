import {earlyDungeonSpawnLocations} from 'app/content/spawnStates';
import {screenshotTests} from 'app/development/testing/screenshotTests';
import {applySpawnLocationToState} from 'app/development/contextMenu/setState';
import {showMapScene} from 'app/scenes/map/showMapScene';

screenshotTests.overworldMap = {
    setup(state: GameState) {
        const overworldState = earlyDungeonSpawnLocations['Overworld'];
        applySpawnLocationToState(state, overworldState.location, overworldState.savedState);
        showMapScene(state);
    },
};
