import { getState } from 'app/state';
import { isTrackPlaying, playSound as playSoundProper, playTrack } from 'app/utils/sounds';

import { Enemy } from 'app/types';

import { getSoundSettings } from 'app/utils/sounds';

export { stopSound, updateSoundSettings } from 'app/utils/sounds';

export const updateMusic = (): void => {
    const state = getState();
    if (!state?.gameHasBeenInitialized) {
        return;
    }
    const soundSettings = getSoundSettings(state);
    if (state.scriptEvents.overrideMusic) {
        playTrack(state.scriptEvents.overrideMusic, 0, soundSettings);
        return;
    }
    if (state.scene !== 'game') {
        playTrack('mainTheme', 0, soundSettings);
        return;
    }
    const bosses = [...state.areaInstance.enemies, ...state.alternateAreaInstance.enemies].filter(
        e => e.status !== 'gone' && e.healthBarTime > 100 && e.definition.type === 'boss'
        && e.isFromCurrentSection(state)
    ) as Enemy[];
    if (bosses.length) {
        // The boss track is several different pieces, so we want to make sure not to restart the intro
        // when any of them are still playing. Note that the tracks will automatically transition
        // because of built in logic so we don't need to add logic to play the other tracks.
        // Eventually it might be fun to add logic here to manipulate which sections play based on
        // how the fight is going, for example more intense music when the boss is enraged.
        if (!isTrackPlaying('bossIntro') && !isTrackPlaying('bossA') && !isTrackPlaying('bossB')) {
            playTrack('bossIntro', 0, soundSettings);
        }
    } else if (state.location.zoneKey === 'overworld') {
        if (!state.location.isSpiritWorld
            && state.location.areaGridCoords.x === 0 && state.location.areaGridCoords.y === 2) {
            playTrack('vanaraForestTheme', 0, soundSettings);
        } else if (!state.location.isSpiritWorld
            && state.location.areaGridCoords.x === 2 && state.location.areaGridCoords.y === 2) {
            playTrack('ruins', 0, soundSettings);
        } else if (!state.location.isSpiritWorld
            && state.location.areaGridCoords.x === 2 && state.location.areaGridCoords.y === 0) {
            playTrack('village', 0, soundSettings);
        } else {
            playTrack('mainTheme', 0, soundSettings);
        }
    } else if (state.location.zoneKey === 'underwater') {
        playTrack('mainTheme', 0, soundSettings);
    }  else if (state.location.zoneKey === 'treeVillage') {
        playTrack('vanaraForestTheme', 0, soundSettings);
    } else if (state.location.zoneKey === 'sky') {
        if (state.location.isSpiritWorld) {
            playTrack('vanaraDreamTheme', 0, soundSettings);
        } else {
            playTrack('skyTheme', 0, soundSettings);
        }
    } else if (state.location.zoneKey === 'peachCave'
        || state.location.zoneKey === 'peachCaveWater'
        || state.location.zoneKey === 'lakeTunnel'
    ) {
        playTrack('caveTheme', 0, soundSettings);
    } else if (state.location.zoneKey === 'riverTemple'
        || state.location.zoneKey === 'riverTempleWater'
    ) {
        playTrack('lakeTheme', 0, soundSettings);
    } else if (state.location.zoneKey === 'tomb') {
        playTrack('tombTheme', 0, soundSettings);
    } else if (state.location.zoneKey === 'holyCityInterior') {
        playTrack('village', 0, soundSettings);
    } else if (state.location.zoneKey === 'waterfallCave' ) {
        playTrack('idleTheme', 0, soundSettings);
    } else if (state.location.zoneKey === 'warTemple') {
        // War Temple technically includes a lot of areas in the ruins around it, but I only
        // want to use the dungeon theme for the dungeon areas proper.
        if (!state.location.isSpiritWorld && state.location.floor === 0 &&
            (
                // Top row
                (state.location.areaGridCoords.y === 0 && state.location.y < 256)
                // Bottom tiles
                || state.location.areaGridCoords.y === 2
                // Right edge
                || (state.location.areaGridCoords.x === 2 && state.location.x > 256)
                // Bottom section of middle right tile
                || (state.location.y > 256 && state.location.areaGridCoords.x === 2 && state.location.areaGridCoords.y === 1)
            )
        ) {
            playTrack('ruins', 0, soundSettings);
        } else {
            playTrack('dungeonTheme', 0, soundSettings);
        }
    } else if (state.location.zoneKey === 'forestTemple') {
        playTrack('dungeonTheme', 0, soundSettings);
    } else if (state.location.zoneKey === 'cocoon') {
        playTrack('cocoonTheme', 0, soundSettings);
    } else if (state.location.zoneKey === 'helix') {
        playTrack('helixTheme', 0, soundSettings);
    } else if (state.location.zoneKey === 'waterfallTower') {
        playTrack('waterfallTowerTheme', 0, soundSettings);
    } else if (state.location.zoneKey === 'forge') {
        playTrack('forgeTheme', 0, soundSettings);
    } else if (state.location.zoneKey === 'crater') {
        playTrack('craterTheme', 0, soundSettings);
    } else if (state.location.zoneKey === 'staffTower') {
        // Play a different track when the tower is activated later.
        const towerIsOn = !!state.savedState.objectFlags.elementalBeastsEscaped;
        if (towerIsOn) {
            playTrack('towerTheme', 0, soundSettings);
        } else {
            playTrack('caveTheme', 0, soundSettings);
        }
    } else if (state.location.zoneKey === 'caves') {
        if (state.location.areaGridCoords.x === 1 && state.location.areaGridCoords.y === 0) {
            // This is the fertility temple / no tools cave.
            playTrack('idleTheme', 0, soundSettings);
        } else {
            playTrack('caveTheme', 0, soundSettings);
        }
    }
}

export function playSound(key: string) {
    const state = getState();
    return playSoundProper(key, getSoundSettings(state));
}
