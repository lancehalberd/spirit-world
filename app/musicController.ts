import { getFullZoneLocation } from 'app/utils/getFullZoneLocation';
import {isObjectInCurrentSection} from 'app/utils/sections';
import {
    fadeOutPlayingTracks,
    isATrackPlaying,
    playSound,
    playTrack,
    stopSound,
    updateAudio,
} from 'app/utils/sounds';

export const updateMusic = (state: GameState): void => {
    if (!state?.gameHasBeenInitialized) {
        return;
    }
    updateAudio(state);
    if (state.scene === 'prologue' || state.scene === 'intro') {
        playTrack('dungeonTheme', state.prologueTime / 1000);
        return;
    }
    if (state.scene !== 'game') {
        playTrack('mainTheme', 0);
        return;
    }
    if (state.scriptEvents.overrideMusic) {
        playTrack(state.scriptEvents.overrideMusic, 0);
        return;
    }
    if (state.arState.active) {
        playTrack('towerTheme', 0);
        return;
    }
    const allBosses = [...state.areaInstance.enemies, ...state.alternateAreaInstance.enemies].filter(
        e => e.status !== 'gone' && e.definition.type === 'boss'
        && e.isFromCurrentSection(state)
    ) as Enemy[];
    const revealedBoss = allBosses.filter(boss => boss.healthBarTime > 100);
    // The modeTime check her is to make sure that the boss music plays long enough to continue
    // if one boss is defeated and spawns a second boss, like with the Balloon Megapede boss.
    const livingBosses = allBosses.filter(boss => !boss.isDefeated || boss.modeTime <= 100);
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
    if (revealedBoss.length || livingBosses.length) {
        if (!livingBosses.length) {
            // Fade out the boss music once the last boss is defeated.
            if (isATrackPlaying()) {
                fadeOutPlayingTracks();
            }
        } else if (revealedBoss.length) {
            playTrack('bossIntro', 0);
        }
    } else if (location.zoneKey === 'overworld') {
        if (!location.isSpiritWorld
            && location.areaGridCoords.x === 2 && location.areaGridCoords.y === 2
        ) {
            playTrack('ruins', 0);
        } else if (!location.isSpiritWorld
            && location.areaGridCoords.x === 2 && location.areaGridCoords.y === 0
        ) {
            playTrack('village', 0);
        } else {
            playTrack('mainTheme', 0);
        }
    } else if (location.zoneKey === 'underwater') {
        if (!location.isSpiritWorld
            && location.areaGridCoords.x === 2 && location.areaGridCoords.y === 0
        ) {
            playTrack('village', 0);
        }  else {
            playTrack('mainTheme', 0);
        }
    } else if (location.zoneKey === 'forest' || location.zoneKey === 'forestWater') {
        if (location.isSpiritWorld) {
            playTrack('ruins', 0);
        } else if (location.areaGridCoords.x === 1 && location.areaGridCoords.y === 1) {
            playTrack('vanaraForestTheme', 0);
        } else {
            playTrack('forestTheme', 0);
        }
    } else if (location.zoneKey === 'treeVillage') {
        if (location.isSpiritWorld) {
            playTrack('dungeonTheme', 0);
        } else {
            playTrack('vanaraForestTheme', 0);
        }
    } else if (location.zoneKey === 'sky') {
        if (location.isSpiritWorld) {
            playTrack('vanaraDreamTheme', 0);
        } else {
            playTrack('skyTheme', 0);
        }
    } else if (location.zoneKey === 'grandTemple' || location.zoneKey === 'jadePalace') {
        playTrack('vanaraDreamTheme', 0);
    } else if (location.zoneKey === 'dream') {
        playTrack('vanaraDreamTheme', 0);
    }  else if (location.zoneKey === 'peachCave'
        || location.zoneKey === 'peachCaveWater'
        || location.zoneKey === 'lakeTunnel'
    ) {
        playTrack('caveTheme', 0);
    } else if (location.zoneKey === 'riverTemple'
        || location.zoneKey === 'riverTempleWater'
    ) {
        playTrack('lakeTheme', 0);
    } else if (location.zoneKey === 'tomb') {
        playTrack('tombTheme', 0);
    } else if (location.zoneKey === 'holyCityInterior') {
        playTrack('village', 0);
    } else if (location.zoneKey === 'waterfallCave' || location.zoneKey === 'waterfallCaveWater') {
        playTrack('waterfallVillageTheme', 0);
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
            playTrack('ruins', 0);
        } else {
            playTrack('dungeonTheme', 0);
        }
    } else if (location.zoneKey === 'cocoon') {
        playTrack('cocoonTheme', 0);
    } else if (location.zoneKey === 'helix') {
        playTrack('helixTheme', 0);
    } else if (location.zoneKey === 'forestTemple') {
        if (location.isSpiritWorld) {
            playTrack('dungeonTheme', 0);
        } else {
        playTrack('vanaraForestTheme', 0);
        }
    } else if (location.zoneKey === 'waterfallTower') {
        playTrack('waterfallTowerTheme', 0);
    } else if (location.logicalZoneKey === 'gauntlet') {
        playTrack('tombTheme', 0);
    } else if (location.logicalZoneKey === 'forge') {
        playTrack('forgeTheme', 0);
    } else if (location.zoneKey === 'skyPalace') {
        playTrack('skyPalaceTheme', 0);
    } else if (location.logicalZoneKey === 'holySanctum') {
        playTrack('helixTheme', 0);
    } else if (location.zoneKey === 'crater') {
        playTrack('craterTheme', 0);
    } else if (location.zoneKey === 'staffTower') {
        // Play a different track when the tower is activated later.
        const towerIsOn = !!state.savedState.objectFlags.elementalBeastsEscaped;
        if (towerIsOn) {
            playTrack('towerTheme', 0);
        } else {
            playTrack('caveTheme', 0);
        }
    } else if (location.zoneKey === 'caves') {
        if (location.areaGridCoords.x === 1 && location.areaGridCoords.y === 0) {
            // This is the fertility temple / no tools cave.
            playTrack('idleTheme', 0);
        } else {
            playTrack('caveTheme', 0);
        }
    } else if (location.zoneKey === 'lab') {
        playTrack('labTheme', 0);
    } else if (location.zoneKey === 'tree') {
        playTrack('helixTheme', 0);
    } else if (location.zoneKey === 'void') {
        playTrack('vanaraDreamTheme', 0);
    } else if (location.zoneKey === 'bellCave' ) {
        playTrack('caveTheme', 0);
    } else {
        playTrack('idleTheme', 0);
    }
}

export function playAreaSound(state: GameState, area: AreaInstance, key: string): AudioInstance | undefined {
    // Do not play area sound effects during the various title scenes. We run updated code
    // during these scenes to render the location in the background, but we shouldn't be
    // playing any sound effects.
    if (state.scene != 'game') {
        return;
    }
    if (!key || state.areaInstance !== area) {
        return;
    }
    const audioInstance = playSound(key);
    if (audioInstance?.sound.loop) {
        state.loopingSoundEffects.push(audioInstance);
    }
    return audioInstance;
}

export function playObjectSound(state: GameState, object: ObjectInstance | EffectInstance, key: string): AudioInstance | undefined {
    // Do not play area sound effects during the various title scenes. We run updated code
    // during these scenes to render the location in the background, but we shouldn't be
    // playing any sound effects.
    if (state.scene != 'game') {
        return;
    }
    if (!key || !object.area || state.areaInstance !== object.area) {
        return;
    }
    if (!isObjectInCurrentSection(state, object)) {
        return;
    }
    const audioInstance = playSound(key);
    if (audioInstance?.sound.loop) {
        state.loopingSoundEffects.push(audioInstance);
    }
    return audioInstance;
}

export function stopAreaSound(state: GameState, instance: AudioInstance) {
    if (!instance) {
        return;
    }
    const index = state.loopingSoundEffects.indexOf(instance);
    if (index >= 0) {
        state.loopingSoundEffects.splice(index, 1);
    }
    stopSound(instance);
}
