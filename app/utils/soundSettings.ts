import { saveSettings } from 'app/utils/saveSettings';
import { getPlayingTracks } from 'app/utils/sounds';

export function toggleAllSounds(state: GameState) {
    state.settings.muteAllSounds = !state.settings.muteAllSounds;
    state.settings.muteMusic = false;
    state.settings.muteSounds = false;
    updateSoundSettings(state);
    // Update the audio toggle in the html page.
    window['refreshMuteButton'](state.settings.muteAllSounds);
    saveSettings(state);
}
// This needs to be exposed to the audio toggle in the html page.
window['toggleAllSounds'] = toggleAllSounds;

export function getSoundSettings(state: GameState): SoundSettings {
    const muteTracks = (state.settings.muteAllSounds || state.settings.muteMusic || false);
    const muteSounds = (state.settings.muteAllSounds || state.settings.muteSounds || false);
    return {
        muteTracks,
        muteSounds,
        globalVolume: state.paused ? 0.3 : 1,
    };
}

export function setSoundSettings(soundSettings: SoundSettings) {
    const playingTracks = getPlayingTracks();
    for (const playingTrack of playingTracks) {
        //console.log('Stopping from stopTrack ', playingTrack.props.src);
        playingTrack.soundSettings = soundSettings;
        playingTrack.howl.mute(soundSettings.muteTracks);
        // In case the last mute interrupted a fade in, set the track to its full volume on unmute.
        if (!soundSettings.muteTracks) {
            playingTrack.howl.volume(playingTrack.props.volume * soundSettings.globalVolume);
        }
    }
}

export function updateSoundSettings(state: GameState) {
    setSoundSettings(getSoundSettings(state));
}
