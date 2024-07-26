import { saveSettings } from 'app/utils/saveSettings';
import { setSoundSettings } from 'app/utils/sounds';

export { setSoundSettings } from 'app/utils/sounds';

export function toggleAllSounds(state: GameState) {
    state.settings.muteAllSounds = !state.settings.muteAllSounds;
    state.settings.muteMusic = false;
    state.settings.muteSounds = false;
    updateSoundSettings(state);
    // Update the audio toggle in the html page.
    window['refreshSoundControls'](state.settings);
    saveSettings(state);
}
// This needs to be exposed to the audio toggle in the html page.
window['toggleAllSounds'] = toggleAllSounds;

export function setGlobalVolume(state: GameState, globalVolume: number) {
    state.settings.globalVolume = globalVolume;
    updateSoundSettings(state);
    // Update the audio toggle in the html page.
    window['refreshSoundControls'](state.settings);
    saveSettings(state);
}
// This needs to be exposed to the audio toggle in the html page.
window['setGlobalVolume'] = setGlobalVolume;

export function getSoundSettings(state: GameState): SoundSettings {
    const muteTracks = (state.settings.muteAllSounds || state.settings.muteMusic || state.showControls || false);
    const muteSounds = (state.settings.muteAllSounds || state.settings.muteSounds || state.showControls || false);
    const globalVolume = (state.settings.globalVolume ?? 1) * (state.paused ? 0.3 : 1);
    return {
        muteTracks,
        muteSounds,
        musicVolume: muteTracks ? 0 : (globalVolume * (state.settings.musicVolume ?? 1)),
        soundVolume: muteSounds ? 0 : (globalVolume * (state.settings.soundVolume ?? 1)),
    };
}

export function updateSoundSettings(state: GameState) {
    setSoundSettings(getSoundSettings(state));
}
