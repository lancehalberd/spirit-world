import { getFullZoneLocation } from 'app/utils/getFullZoneLocation';
import {
    fadeOutPlayingTracks,
    isATrackFadingOut,
    isATrackPlaying,
    isTrackPlaying,
    playSound as playSoundProper,
    playTrack,
} from 'app/utils/sounds';

export { stopSound } from 'app/utils/sounds';
import { getSoundSettings } from 'app/utils/soundSettings';
export const updateMusic = (state: GameState): void => {
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
    // The modeTime check her is to make sure that the boss music plays long enough to continue
    // if one boss is defeated and spawns a second boss, like with the Balloon Megapede boss.
    const livingBosses = bosses.filter(boss => !boss.isDefeated || boss.modeTime <= 100);
    /*
    // The logic for playing the boss music is a bit brittle and will sometimes restart if
    // a boss changes from material to spirit world. Uncomment these lines if this happens
    // to inspect what the state is when the boss music is restarting.
    if (isTrackPlaying('bossIntro') || isTrackPlaying('bossA') || isTrackPlaying('bossB')) {
        if (!bosses.length || !livingBosses.length) {
            debugger;
        }
    }
    */
    const location = getFullZoneLocation(state.location);
    if (bosses.length) {
        if (!livingBosses.length) {
            // Fade out the boss music once the last boss is defeated.
            if (isATrackPlaying()) {
                fadeOutPlayingTracks();
            }
        } else {
            // The boss track is several different pieces, so we want to make sure not to restart the intro
            // when any of them are still playing. Note that the tracks will automatically transition
            // because of built in logic so we don't need to add logic to play the other tracks.
            // Eventually it might be fun to add logic here to manipulate which sections play based on
            // how the fight is going, for example more intense music when the boss is enraged.
            if (!isTrackPlaying('bossIntro') && !isTrackPlaying('bossA') && !isTrackPlaying('bossB')) {
                if (isATrackPlaying()) {
                    // If other tracks are still playing fade them out.
                    fadeOutPlayingTracks();
                } else if (!isATrackFadingOut()) {
                    // Once all tracks are faded out, start the boss music without fading in.
                    playTrack('bossIntro', 0, soundSettings, false, false);
                }
            }
        }
    } else if (location.zoneKey === 'overworld') {
        if (!location.isSpiritWorld
            && location.areaGridCoords.x === 0 && location.areaGridCoords.y === 2
        ) {
            playTrack('vanaraForestTheme', 0, soundSettings);
        } else if (!location.isSpiritWorld
            && location.areaGridCoords.x === 2 && location.areaGridCoords.y === 2
        ) {
            playTrack('ruins', 0, soundSettings);
        } else if (!location.isSpiritWorld
            && location.areaGridCoords.x === 2 && location.areaGridCoords.y === 0
        ) {
            playTrack('village', 0, soundSettings);
        } else {
            playTrack('mainTheme', 0, soundSettings);
        }
    } else if (location.zoneKey === 'underwater') {
        if (!location.isSpiritWorld
            && location.areaGridCoords.x === 2 && location.areaGridCoords.y === 0
        ) {
            playTrack('village', 0, soundSettings);
        }  else {
            playTrack('mainTheme', 0, soundSettings);
        }
    }  else if (location.zoneKey === 'treeVillage') {
        if (location.isSpiritWorld) {
            playTrack('dungeonTheme', 0, soundSettings);
        } else {
            playTrack('vanaraForestTheme', 0, soundSettings);
        }
    } else if (location.zoneKey === 'sky') {
        if (location.isSpiritWorld) {
            playTrack('vanaraDreamTheme', 0, soundSettings);
        } else {
            playTrack('skyTheme', 0, soundSettings);
        }
    } else if (location.zoneKey === 'grandTemple' || location.zoneKey === 'jadePalace') {
        playTrack('vanaraDreamTheme', 0, soundSettings);
    } else if (location.zoneKey === 'peachCave'
        || location.zoneKey === 'peachCaveWater'
        || location.zoneKey === 'lakeTunnel'
    ) {
        playTrack('caveTheme', 0, soundSettings);
    } else if (location.zoneKey === 'riverTemple'
        || location.zoneKey === 'riverTempleWater'
    ) {
        playTrack('lakeTheme', 0, soundSettings);
    } else if (location.zoneKey === 'tomb') {
        playTrack('tombTheme', 0, soundSettings);
    } else if (location.zoneKey === 'holyCityInterior') {
        playTrack('village', 0, soundSettings);
    } else if (location.zoneKey === 'waterfallCave' ) {
        playTrack('waterfallVillageTheme', 0, soundSettings);
    } else if (location.zoneKey === 'warTemple') {
        // Don't change music during transitions since the logic below that depends on x/y locations
        // may be invalid during transitions.
        if (state.nextAreaInstance || state.nextAreaSection) {
            return;
        }
        // There is one frame after the transition finishes where the coordinates can be out
        // of range, but work correctly if taken mod 512.
        const x = (location.x + 512) % 512;
        const y = (location.y + 512) % 512;
        // War Temple technically includes a lot of areas in the ruins around it, but I only
        // want to use the dungeon theme for the dungeon areas proper.
        if (!location.isSpiritWorld && location.floor === 0 &&
            (
                // Top row
                (location.areaGridCoords.y === 0 && y < 256)
                // Bottom tiles
                || location.areaGridCoords.y === 2
                // Right edge
                || (location.areaGridCoords.x === 2 && x > 256)
                // Bottom section of middle right tile
                || (y > 256 && location.areaGridCoords.x === 2 && location.areaGridCoords.y === 1)
            )
        ) {
            playTrack('ruins', 0, soundSettings);
        } else {
            playTrack('dungeonTheme', 0, soundSettings);
        }
    } else if (location.zoneKey === 'cocoon') {
        playTrack('cocoonTheme', 0, soundSettings);
    } else if (location.zoneKey === 'helix') {
        playTrack('helixTheme', 0, soundSettings);
    } else if (location.zoneKey === 'forestTemple') {
        playTrack('dungeonTheme', 0, soundSettings);
    } else if (location.zoneKey === 'waterfallTower') {
        playTrack('waterfallTowerTheme', 0, soundSettings);
    } else if (location.logicalZoneKey === 'gauntlet') {
        playTrack('tombTheme', 0, soundSettings);
    } else if (location.logicalZoneKey === 'forge') {
        playTrack('forgeTheme', 0, soundSettings);
    } else if (location.zoneKey === 'skyPalace') {
        playTrack('lakeTheme', 0, soundSettings);
    } else if (location.logicalZoneKey === 'holySanctum') {
        playTrack('helixTheme', 0, soundSettings);
    } else if (location.zoneKey === 'crater') {
        playTrack('craterTheme', 0, soundSettings);
    } else if (location.zoneKey === 'staffTower') {
        // Play a different track when the tower is activated later.
        const towerIsOn = !!state.savedState.objectFlags.elementalBeastsEscaped;
        if (towerIsOn) {
            playTrack('towerTheme', 0, soundSettings);
        } else {
            playTrack('caveTheme', 0, soundSettings);
        }
    } else if (location.zoneKey === 'caves') {
        if (location.areaGridCoords.x === 1 && location.areaGridCoords.y === 0) {
            // This is the fertility temple / no tools cave.
            playTrack('idleTheme', 0, soundSettings);
        } else {
            playTrack('caveTheme', 0, soundSettings);
        }
    } else if (location.zoneKey === 'lab') {
        playTrack('forgeTheme', 0, soundSettings);
    } else if (location.zoneKey === 'tree') {
        playTrack('helixTheme', 0, soundSettings);
    } else if (location.zoneKey === 'void') {
        playTrack('vanaraDreamTheme', 0, soundSettings);
    } else if (location.zoneKey === 'bellCave' ) {
        playTrack('caveTheme', 0, soundSettings);
    } else {
        playTrack('idleTheme', 0, soundSettings);
    }
}

export function playSound(state: GameState, key: string) {
    return playSoundProper(key, getSoundSettings(state));
}

export function playAreaSound(state: GameState, area: AreaInstance, key: string): any {
    // Do not play area sound effects during the various title scenes. We run updated code
    // during these scenes to render the location in the background, but we shouldn't be
    // playing any sound effects.
    if (state.scene === 'title' || state.scene === 'chooseGameMode' ||
        state.scene === 'deleteSavedGame' || state.scene === 'deleteSavedGameConfirmation'
    ) {
        return;
    }
    if (!key || state.areaInstance !== area) {
        return;
    }
    return playSound(state, key);
}
