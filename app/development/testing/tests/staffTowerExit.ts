import {lateDungeonSpawnLocations} from 'app/content/spawnStates';
import {applySpawnLocationToState} from 'app/development/contextMenu/setState';
import {screenshotTests} from 'app/development/testing/screenshotTests';
import {GAME_KEY} from 'app/gameConstants';
import {sceneHash} from 'app/scenes/sceneHash';
import {clearKeyboardState} from 'app/userInput';

// Safety caps so a future regression that breaks the transition (e.g. the hero getting stuck,
// or the zone transition never starting/completing) fails fast instead of hanging.
const MAX_WALK_FRAMES = 120;
const MAX_TRANSITION_FRAMES = 150;

// Simulates updating the scene holding the down key to make the player move down/south.
function stepFrameWalkingDown(state: GameState) {
    clearKeyboardState(state);
    state.keyboard.gameKeyValues[GAME_KEY.DOWN] = 1;
    state.keyboard.gameKeysDown.add(GAME_KEY.DOWN);
    sceneHash.field.update(state, true);
}

const {location, savedState} = lateDungeonSpawnLocations['Tower Lower'];

// Regression test for a bug where exiting Staff Tower into the overworld displayed the wrong
// area section. Walks the player down through the tower's lower entrance door and takes the
// screenshot immediately after the resulting zone transition finishes.
screenshotTests.staffTowerOverworldExit = {
    setup(state: GameState) {
        // SPAWN_STAFF_LOWER_ENTRANCE faces 'up' (as if just having entered); face back down
        // toward the door so walking down carries the player back out of it.
        applySpawnLocationToState(state, {...location, d: 'down'}, savedState);

        // Walk down into the door until it triggers the zone transition back to the overworld.
        let frames = 0;
        while (!state.transitionState && frames < MAX_WALK_FRAMES) {
            stepFrameWalkingDown(state);
            frames++;
        }
        if (!state.transitionState) {
            console.error('staffTowerOverworldExit setup: zone transition never started.');
            return;
        }

        // Keep stepping through the wipe out/in until the transition finishes so the screenshot
        // captures the overworld the moment gameplay becomes visible again.
        frames = 0;
        while (state.transitionState && frames < MAX_TRANSITION_FRAMES) {
            sceneHash.field.update(state, true);
            frames++;
        }
        if (state.transitionState) {
            console.error('staffTowerOverworldExit setup: zone transition never finished.');
        }
    },
};
