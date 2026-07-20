import {isFieldSceneActive} from 'app/scenes/field/showFieldScene';
import {isObjectInCurrentSection} from 'app/utils/sections';
import {playSound, stopSound} from 'app/utils/sounds';

export function playAreaSound(state: GameState, area: AreaInstance, key: string): AudioInstance | undefined {
    // Area sounds should only be played when the field scene is active on the stack.
    // Having this check prevents some background processes from accidentally triggering sounds.
    if (!isFieldSceneActive(state)) {
        return;
    }
    if (!key || state.areaSet?.current !== area) {
        return;
    }
    return playSound(key);
}

export function playObjectSound(state: GameState, object: ObjectInstance | EffectInstance, key: string): AudioInstance | undefined {
    // Area sounds should only be played when the field scene is active on the stack.
    // Having this check prevents some background processes from accidentally triggering sounds.
    if (!isFieldSceneActive(state)) {
        return;
    }
    if (!key || !object.area || state.areaSet?.current !== object.area) {
        return;
    }
    if (!isObjectInCurrentSection(state, object)) {
        return;
    }
    return playSound(key);
}

export function stopAreaSound(state: GameState, instance: AudioInstance) {
    if (!instance) {
        return;
    }
    stopSound(instance);
}
