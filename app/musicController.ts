import { getState } from 'app/state';
import { isTrackPlaying, playSound as playSoundProper, playTrack } from 'app/utils/sounds';

import { Enemy } from 'app/types';

export { stopSound } from 'app/utils/sounds';


export const updateMusic = (): void => {
    const state = getState();
    if (!state?.gameHasBeenInitialized) {
        return;
    }
    const muted = state.settings.muteAllSounds;
    if (state.scene !== 'game') {
        playTrack('mainTheme', 0, muted);
        return;
    }
    const bosses = [...state.areaInstance.enemies, ...state.alternateAreaInstance.enemies].filter(
        e => e.status !== 'gone' && e.healthBarTime > 0 && e.definition.type === 'boss' && e.isFromCurrentSection(state)
    ) as Enemy[];
    if (bosses.length) {
        // The boss track is several different pieces, so we want to make sure not to restart the intro
        // when any of them are still playing. Note that the tracks will automatically transition
        // because of built in logic so we don't need to add logic to play the other tracks.
        // Eventually it might be fun to add logic here to manipulate which sections play based on
        // how the fight is going, for example more intense music when the boss is enraged.
        if (!isTrackPlaying('bossIntro') && !isTrackPlaying('bossA') && !isTrackPlaying('bossB')) {
            playTrack('bossIntro', 28000, muted);
        }
    } else if (state.location.zoneKey === 'overworld'
        || state.location.zoneKey === 'sky'
        || state.location.zoneKey === 'underwater'
    ) {
        playTrack('mainTheme', 0, muted);
    } else if (state.location.zoneKey === 'peachCave'
        || state.location.zoneKey === 'peachCaveWater'
        || state.location.zoneKey === 'riverTemple'
        || state.location.zoneKey === 'riverTempleWater'
        || state.location.zoneKey === 'lakeTunnel'
    ) {
        playTrack('caveTheme', 0, muted);
    } else if (state.location.zoneKey === 'tomb' || state.location.zoneKey === 'waterfallTower') {
        playTrack('tombTheme', 0, muted);
    } else if (state.location.zoneKey === 'waterfallCave'
        || state.location.zoneKey === 'holyCityInterior'
        || state.location.zoneKey === 'treeVillage'
    ) {
        playTrack('idleTheme', 0, muted);
    } else if (state.location.zoneKey === 'warTemple' || state.location.zoneKey === 'forestTemple') {
        playTrack('dungeonTheme', 0, muted);
    } else if (state.location.zoneKey === 'cocoon'
        || state.location.zoneKey === 'helix'
        || state.location.zoneKey === 'crater'
    ) {
        playTrack('cocoonTheme', 0, muted);
    } else if (state.location.zoneKey === 'staffTower') {
        // Play a different track when the tower is activated later.
        playTrack('caveTheme', 0, muted);
    } else if (state.location.zoneKey === 'caves') {
        if (state.location.areaGridCoords[0] === 1 && state.location.areaGridCoords[1] === 0) {
            // This is the fertility temple.
            playTrack('idleTheme', 0, muted);
        } else {
            playTrack('caveTheme', 0, muted);
        }
    }
}

export function playSound(key: string) {
    const state = getState();
    return playSoundProper(key, state.settings.muteAllSounds);
}
