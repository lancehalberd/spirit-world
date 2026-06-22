import {findTextCue} from 'app/content/effects/textCue';
import {dungeonMaps} from 'app/content/sections';
import {isSceneActive, pushScene, sceneHash} from 'app/scenes/sceneHash';
import {canOpenMenu} from 'app/state';
import {updateSoundSettings} from 'app/utils/soundSettings';

export function showMapScene(state: GameState) {
    if (canOpenMenu(state)) {
        const textCue = findTextCue(state);
        if (textCue?.isMapCue) {
            textCue.fadeOut();
        }
        const dungeonMap = dungeonMaps[state.areaSection?.definition.mapId];
        if (dungeonMap) {
            sceneHash.map.floorIndex = Object.keys(dungeonMap.floors).indexOf(state.areaSection.definition.floorId);
            if (sceneHash.map.floorIndex < 0) {
                console.error('Could not find map floor', state.areaSection.definition.floorId, 'in', Object.keys(dungeonMap.floors));
                sceneHash.map.floorIndex = 0;
                debugger;
            }
        }
        pushScene(state, sceneHash.map);
        updateSoundSettings(state);
    }
}

export function isMapSceneInStack(state: GameState) {
    return state.sceneStack.includes(sceneHash.map);
}

export function isMapSceneActive(state: GameState) {
    return isSceneActive(state, sceneHash.map);
}
