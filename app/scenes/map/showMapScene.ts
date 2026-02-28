import {dungeonMaps} from 'app/content/sections';
import {isSceneActive, pushScene, sceneHash} from 'app/scenes/sceneHash';
import {canPauseGame} from 'app/state';
import {updateSoundSettings} from 'app/utils/soundSettings';

/*
            && !(
                state.messagePage?.frames?.length
                || state.defeatState.defeated
                || state.scriptEvents.blockFieldUpdates
            )
*/
export function showMapScene(state: GameState) {
    if (canPauseGame(state)) {
        const dungeonMap = dungeonMaps[state.areaSection?.definition.mapId];
        if (dungeonMap) {
            state.menuIndex = Object.keys(dungeonMap.floors).indexOf(state.areaSection.definition.floorId);
            if (state.menuIndex < 0) {
                console.error('Could not find map floor', state.areaSection.definition.floorId, 'in', Object.keys(dungeonMap.floors));
                state.menuIndex = 0;
                debugger;
            }
        }
        pushScene(state, sceneHash.map);
        updateSoundSettings(state);
    }
}

export function isMapSceneActive(state: GameState) {
    return isSceneActive(state, sceneHash.map);
}
