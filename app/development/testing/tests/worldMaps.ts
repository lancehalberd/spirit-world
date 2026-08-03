import {earlyDungeonSpawnLocations} from 'app/content/spawnStates';
import {applySpawnLocationToState} from 'app/development/contextMenu/setState';
import {screenshotTests} from 'app/development/testing/screenshotTests';
import {showMapScene} from 'app/scenes/map/showMapScene';

// Screenshot tests for the overworld map screen, covering all 6 combinations of the 3 overworld
// zones (overworld, sky, forest) and 2 worlds (material, spirit). Kept in one file since they
// all share the same setup shape and only differ by which zone/world they spawn into.
const {location: overworldLocation, savedState} = earlyDungeonSpawnLocations['Overworld'];

const worldMapLocations: {[goldenName: string]: ZoneLocation} = {
    overworldMap: overworldLocation,
    overworldMapSpirit: {...overworldLocation, isSpiritWorld: true},
    skyMap: {
        zoneKey: 'sky', floor: 0, areaGridCoords: {x: 0, y: 0},
        isSpiritWorld: false, x: 176, y: 104, d: 'down',
    },
    skyMapSpirit: {
        zoneKey: 'sky', floor: 0, areaGridCoords: {x: 0, y: 0},
        isSpiritWorld: true, x: 176, y: 104, d: 'down',
    },
    forestMap: {
        zoneKey: 'forest', floor: 0, areaGridCoords: {x: 0, y: 0},
        isSpiritWorld: false, x: 256, y: 256, d: 'down',
    },
    forestMapSpirit: {
        zoneKey: 'forest', floor: 0, areaGridCoords: {x: 0, y: 0},
        isSpiritWorld: true, x: 256, y: 256, d: 'down',
    },
};

for (const goldenName in worldMapLocations) {
    const location = worldMapLocations[goldenName];
    screenshotTests[goldenName] = {
        setup(state: GameState) {
            applySpawnLocationToState(state, location, savedState);
            showMapScene(state);
            // renderOverworldMap blinks the hero position icon and quest markers on/off based on
            // `state.time % 1000 <= 600` (app/scenes/map/renderMap.ts). Push state.time past that
            // window so the map renders deterministically with no icon/marker in the golden.
            state.time = 700;
        },
    };
}
