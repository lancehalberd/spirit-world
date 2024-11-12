import { noteFrequencies } from './noteFrequencies';

const sounds = new Map<string, GameSound>();
window.sounds = sounds;

// This was being used to unlock audio on player interaction, but maybe this isn't necessary any more?
// We should test this on other browsers.
let audioUnlocked = false;
export function unlockAudio() {
    if (!audioUnlocked) {
        audioContext.createOscillator().start(audioContext.currentTime);
        audioUnlocked = true;
    }
}
// At least in firefox, audioContext.currentTime won't advance until playback is enabled.
export function isAudioUnlocked() {
    return audioContext.currentTime > 0;
}

interface BaseSoundDefinition {
    source: string
    volume?: number
    offset?: number
    duration?: number
    customDelay?: number
    limit?: number
    repeatFrom?: number
}
interface SoundEffectDefinition extends BaseSoundDefinition {
    key: string
    instanceLimit?: number
    loop?: boolean
}
interface TrackDefinition extends BaseSoundDefinition {
    key: TrackKey
    nextTrack?: TrackKey
}

export function requireSoundEffect({
    key, source, offset, duration, customDelay, volume, instanceLimit = 5, loop = false, repeatFrom,
}: SoundEffectDefinition): GameSound {
    const sound = sounds.get(key);
    if (sound) {
        return sound;
    }
    // Note that since sounds are cached by key, if the same key is used with different options,
    // it will be returned with the options first used for that key.
    const newSound: GameSound = {
        key,
        volume: volume / 50,
        offset,
        repeatFrom,
        customDelay,
        duration,
        loop,
        instanceLimit,
        instances: [],
    };
    // Add the audio buffer to the sound as soon as it is loaded.
    assignAudioBuffer(newSound, source);
    sounds.set(key, newSound);
    return newSound;
}
export function requireTrack({
    key, source, offset, duration, customDelay, volume, repeatFrom, nextTrack,
}: TrackDefinition): GameSound {
    const sound = sounds.get(key);
    if (sound) {
        return sound;
    }
    const newSound: GameSound = {
        key,
        volume: volume / 50,
        offset,
        repeatFrom,
        customDelay,
        duration,
        instances: [],
        nextTrack,
        loop: !nextTrack
    };
    // Add the audio buffer to the sound as soon as it is loaded.
    assignAudioBuffer(newSound, source);
    sounds.set(key, newSound);
    return newSound;
}

const audioBufferPromises = new Map<string, Promise<AudioBuffer>>();
// Assigns an audio buffer to a GameSound, loading it if necessary and caching the result for future calls.
async function assignAudioBuffer(sound: GameSound, source: string) {
    let audioBufferPromise = audioBufferPromises.get(source);
    if (!audioBufferPromise) {
        audioBufferPromise = fetch(source).then(res => res.arrayBuffer())
            .then(arrayBuffer => audioContext.decodeAudioData(arrayBuffer))
            .then(audioBuffer => audioBuffer);
        audioBufferPromises.set(source, audioBufferPromise);
    }
    sound.audioBuffer = await audioBufferPromise;
}

// This is used for any sounds loaded into audio buffers.
function startAudioBufferSound(sound: GameSound, seekTime: number, startTime: number): AudioInstance|false {
    const instance: AudioInstance = {
        sound,
        sourceNode: audioContext.createBufferSource(),
        gainNode: audioContext.createGain(),
        startTime,
    };
    instance.sourceNode.connect(instance.gainNode);
    instance.sourceNode.buffer = sound.audioBuffer;
    // Merged
    const offset = sound.offset || 0;
    const repeatFrom = sound.repeatFrom || offset;
    // This is the time in the audio buffer where the sound is scheduled to end or repeat.
    const bufferEndTime = sound.duration ? (offset + sound.duration) : sound.audioBuffer.duration;
    const firstDuration = bufferEndTime - offset;
    const otherDurations =  bufferEndTime - repeatFrom;
    // The time that playbook should start from in the audio buffer. This will be updated based
    // on the seek time, offset, and looping behavior of the sound.
    if (sound.loop) {
        instance.sourceNode.loop = true;
        if (sound.duration) {
            instance.sourceNode.loopEnd = bufferEndTime;
        }
        if (repeatFrom) {
            instance.sourceNode.loopStart = repeatFrom;
        }
        // We probably wouldn't need all this custom logic if stopped supporting an initial offset
        // time. Probably the buffer source already takes into account looping + loopStart if you
        // start at a time value larger than the initial duration.
        let bufferStartTime = seekTime;
        if (bufferStartTime >= firstDuration) {
            bufferStartTime -= firstDuration;
            bufferStartTime = repeatFrom + bufferStartTime % otherDurations;
        } else {
            bufferStartTime = offset + bufferStartTime;
        }
        instance.sourceNode.start(startTime, bufferStartTime);
    } else {
        const bufferStartTime = offset + seekTime;
        const duration = bufferEndTime - bufferStartTime;
        // If this sound does not loop, do not play anything if
        // the seek time is larger than the duration of the sound.
        if (duration <= 0) {
            return false;
        }
        instance.endTime = startTime + duration;
        instance.sourceNode.start(startTime, bufferStartTime);
        instance.sourceNode.stop(instance.endTime)
    }

    sound.instances.push(instance);
    return instance;
}

export function playSound(key: string, seekTime: number = 0, force = false, startTime = audioContext.currentTime): AudioInstance | undefined {
    const sound = sounds.get(key);
    if (!sound) {
        throw new Error('Tried to play missing sound ' + key);
        return;
    }
    const currentTime = audioContext.currentTime;
    // Synth sounds don't support instances yet.
    // Clean up references to any instances that should have completed.
    sound.instances = sound.instances.filter(instance => instance.endTime && instance.endTime >= currentTime);
    // Ignore this sound if we have already scheduled the maximum number of simultaneous effects.
    const instanceLimit = sound.instanceLimit ?? 5;

    if (sound.instances.length >= instanceLimit) {
        return;
    }
    const delay = sound.customDelay ?? 0.04;
    const targetTime = Math.max(sound.canPlayAfter || 0, startTime);
    sound.canPlayAfter = targetTime + delay;
    try {
        if (sound.audioBuffer) {
            const instance = startAudioBufferSound(sound, seekTime, targetTime);
            if (!instance) {
                return;
            }
            const volume = Math.min(1, sound.volume);
            instance.gainNode.connect(soundEffectGainNode);
            instance.gainNode.gain.setValueAtTime(volume, targetTime);
            return instance;
        } else if (sound.play) {
            const instance: AudioInstance = {
                sound,
                startTime: targetTime,
                endTime: targetTime + sound.duration,
            };
            sound.instances.push(instance);
            sound.play(soundEffectGainNode, targetTime);
            return instance;
        }
    } catch(e) {
        console.log(e);
        debugger;
    }
}
export function stopSound(instance?: AudioInstance, time = audioContext.currentTime): void {
    if (!instance) {
        return;
    }
    instance.stopTime = time;
    instance.sourceNode.stop(time);
    const index = instance.sound.instances.indexOf(instance);
    if (index >= 0) {
        instance.sound.instances.splice(index);
    }
}
window['stopSound'] = stopSound;


let playingTracks: GameSound[] = [];
let fadingTracks: GameSound[] = [];
export function getPlayingTracks(): GameSound[] {
    return playingTracks;
}
window['playingTracks'] = playingTracks;

// This is called every frame during the game.
export function updateAudio(state: GameState) {
    const currentTime = audioContext.currentTime;
    // Schedule the next track to play if necessary.
    for (const currentTrack of playingTracks) {
        // Remove any instances that have completed.
        currentTrack.instances = currentTrack.instances.filter(instance => !instance.endTime || instance.endTime > currentTime);
        if (!currentTrack.nextTrack) {
            continue;
        }
        for (const instance of currentTrack.instances) {
            const nextTrack = requireTrack(musicTracks[currentTrack.nextTrack]);
            if (instance.endTime < currentTime + 0.2) {
                if (!nextTrack.instances.length) {
                    // console.log('Scheduling next track', currentTrack.nextTrack, instance.endTime);
                    const track = playTrack(currentTrack.nextTrack, 0, false, false, instance.endTime);
                    if (track) {
                        track.baseTrack = currentTrack.baseTrack || currentTrack.trackKey;
                    }
                }
            }
        }
    }
    for (let i = 0; i < state.loopingSoundEffects.length; i++) {
        const soundEffect = state.loopingSoundEffects[i];
        const areSoundEffectsPaused = state.paused;
        if (areSoundEffectsPaused && !soundEffect.stopTime) {
            stopSound(soundEffect);
        } else if (!areSoundEffectsPaused && soundEffect.stopTime) {
            const seekTime = currentTime - soundEffect.startTime;
            let instance: AudioInstance|false;
            if (seekTime >= 0) {
                // Force sounds to play on resume so that we don't introduce an extra delay on them.
                instance = playSound(soundEffect.sound.key, seekTime, true);
            } else {
                // If seekTime is negative, it means the sound was stopped before it started playing so
                // it is still scheduled to play in the future.
                instance = playSound(soundEffect.sound.key, 0, true, currentTime - seekTime);
            }
            if (instance) {
                // If a new instance was created, overwrite the existing instance in place so
                // that existing references to it get the updated instance.
                //for (const key in instance) {
                //    soundEffect[key] = instance[key];
                //}
                Object.assign(soundEffect, instance);
                delete soundEffect.stopTime;
            } else {
                // If the new instance didn't start for some reason, just remove it from the array.
                console.log('Looping instance failed to start again', soundEffect);
                state.loopingSoundEffects.splice(i--, 1);
            }
        }
    }
    // Remove tracks with no instances left.
    playingTracks = playingTracks.filter(track => track.instances.length);
}

const musicTracks: {[key in string]: TrackDefinition} = {
    // Tracks from Nick
    // Used in various caves
    caveTheme: {key: 'caveTheme', source: 'bgm/Spirit 1.mp3', volume: 20 },
    // Used on the title screen and world map
    mainTheme: {key: 'mainTheme', source: 'bgm/Spirit 4.2_demo.mp3', volume: 10 },
    // Used for holy city, but a bit to relaxed for that.
    waterfallVillageTheme: {key : 'waterfallVillageTheme', source: 'bgm/Spirit 21.A_demo.mp3', volume: 10},
    vanaraForestTheme: {key: 'vanaraForestTheme', source: 'bgm/Spirit 16_concept.mp3', volume: 10 },
    tombTheme: {key: 'tombTheme', source: 'bgm/Spirit 5.2_demo.mp3', volume: 10 },
    // Used for Vanara ship dungeons like cocoon, helix and forest temple.
    cocoonTheme: {key: 'cocoonTheme', source: 'bgm/Spirit 6 Demo.mp3', volume: 10 },
    vanaraDreamTheme: {key: 'vanaraDreamTheme', source: 'bgm/Spirit 18_concept.mp3', volume: 10 },
    helixTheme: {key: 'helixTheme', source: 'bgm/Spirit 13.2_demo.mp3', volume: 10 },
    waterfallTowerTheme: {key: 'waterfallTowerTheme', source: 'bgm/Public Surface_concept.mp3', volume: 10 },
    forgeTheme: {key: 'forgeTheme', source: 'bgm/Public Surface.b_concept.mp3', volume: 10 },
    craterTheme: {key: 'craterTheme', source: 'bgm/Fatty Richness_demo.mp3', volume: 10 },
    // Used for the tower after it is activated.
    towerTheme: {key: 'towerTheme', source: 'bgm/Spirit 15.4.mp3', volume: 10 },
    skyTheme: {key: 'skyTheme', source: 'bgm/Spirit 14_demo.mp3', volume: 10 },
    // Used for the lake temple
    lakeTheme: {key: 'lakeTheme', source: 'bgm/ocean.mp3', volume: 8 },
    skyPalaceTheme: {key: 'skyPalaceTheme', source: 'bgm/Spirit 9 Demo.mp3', volume: 10 },
    // Used for holy city, but a bit to relaxed for that.
    village: {key : 'village', source: 'bgm/Spirit 21_demo.mp3', volume: 10},
    // Used for summoner ruins.
    ruins: {key : 'ruins', source: 'bgm/Spirit 22_concept.mp3', volume: 10},

    // Tracks from Leon
    // For War Temple and other dungeons
    dungeonTheme: {key: 'dungeonTheme', source: 'bgm/SpiritQuestSong_Leon1.mp3', volume: 20 },
    idleTheme: {key: 'idleTheme', source: 'bgm/IdleMusic.mp3', volume: 20 },
    bossIntro: {key: 'bossIntro', source: 'bgm/SpookyThemeIntro.mp3', volume: 40, nextTrack: 'bossA' },
    bossA: {key: 'bossA', source: 'bgm/SpookyThemeA.mp3', volume: 40, nextTrack: 'bossB' },
    bossB: {key: 'bossB', source: 'bgm/SpookyThemeB.mp3', volume: 40, nextTrack: 'bossA' },
};
// Immediately load the theme for the prologue scene.
requireTrack(musicTracks.dungeonTheme);
// Also load the theme for the title scene.
requireTrack(musicTracks.mainTheme);
export function playTrack(trackKey: TrackKey, seekTime: number, fadeOutOthers = true, crossFade = true, startTime = audioContext.currentTime): GameSound|false {
    const sound = requireTrack(musicTracks[trackKey]);
    if (!isAudioUnlocked()) {
        return false;
    }
    if (!sound.audioBuffer) {
        return false;
    }
    // Do nothing if the sound is already playing.
    if (isTrackPlaying(trackKey)) {
        return sound;
    }
    //console.log('playTrack', playingTracks, source, sound);
    if (fadeOutOthers) {
        if (crossFade) fadeOutPlayingTracks([], startTime);
        else stopTrack(startTime);
    }
    // From playTrack
    const instance = startAudioBufferSound(sound, seekTime, startTime);
    if (!instance) {
        return false;
    }
    const volume = Math.min(1, sound.volume);
    instance.gainNode.connect(trackGainNode);
    if (crossFade) {
        instance.gainNode.gain.setValueAtTime(0, startTime);
        instance.gainNode.gain.linearRampToValueAtTime(volume, startTime + 1);
    } else {
        instance.gainNode.gain.setValueAtTime(volume, startTime);
    }
    playingTracks.push(sound);
    return sound;
}

export function setSoundSettings(soundSettings: SoundSettings) {
    trackGainNode.gain.setValueAtTime(soundSettings.musicVolume, audioContext.currentTime);
    soundEffectGainNode.gain.setValueAtTime(soundSettings.soundVolume, audioContext.currentTime);
}

export function fadeOutPlayingTracks(currentTracks: GameSound[] = [], time: number = audioContext.currentTime) {
    const keepPlayingTracks: GameSound[] = [];
    for (const trackToFadeOut of playingTracks) {
        if (currentTracks.includes(trackToFadeOut)) {
            keepPlayingTracks.push(trackToFadeOut);
            continue;
        }
        // This will cause the track to stop playing the next time a fade completes.
        for (const instance of trackToFadeOut.instances) {
            instance.gainNode.gain.linearRampToValueAtTime(instance.gainNode.gain.value, time);
            instance.gainNode.gain.linearRampToValueAtTime(0, time + 1);
            instance.sourceNode.stop(time + 1);
        }
        // Remove references to tracks that are fading out and scheduled to stop.
        trackToFadeOut.instances = [];
    }
    playingTracks = keepPlayingTracks;
    window['playingTracks'] = playingTracks;
}

export function stopTrack(time: number) {
    for (const playingTrack of playingTracks) {
        for (const instance of playingTrack.instances) {
            instance.sourceNode.stop(time);
        }
        playingTrack.instances = [];
    }
    playingTracks = [];
    window['playingTracks'] = playingTracks;
}
// Tracks may still be fading out when this returns false. Check isATrackFadingOut as well to avoid this.
export function isATrackPlaying(): boolean {
    return !!playingTracks.length;
}
export function isATrackFadingOut(): boolean {
    return !!fadingTracks.length;
}
export function isTrackPlaying(trackKey: TrackKey): boolean {
    for (const playingTrack of playingTracks) {
        if (playingTrack.key === trackKey || playingTrack.baseTrack === trackKey) {
            return true;
        }
    }
    return false;
}

const preloadSounds = () => {
    [
        {key: 'menuTick', source: 'sfx/Cube click_odrive.wav', volume: 10, duration: 0.2, limit: 2},
        {key: 'unlock', source: 'sfx/Cube click_odrive.wav', volume: 50, limit: 2},
        {key: 'switch', source: 'sfx/Diamond 1_odrive_bip.wav', volume: 10, limit: 2},
        {key: 'smallSwitch', source: 'sfx/Cube click 2_Ocrive.wav', volume: 10, limit: 2},
        {key: 'keyBlockScraping', source: 'sfx/rollingBall.wav',
            duration: 0.7, volume: 60, limit: 2
        },
        {key: 'rollingBall', source: 'sfx/rollingBall.wav',
            duration: 1.4, loop: true, volume: 20, limit: 2
        },
        {key: 'rollingBallHit', source: 'sfx/rollingBallHit.wav', volume: 30, limit: 2},
        {key: 'rollingBallSocket', source: 'sfx/rollingBallSocket.wav', volume: 30, limit: 2},
        {key: 'cloneExplosion', source: 'sfx/cloneExplosion.wav', volume: 10, limit: 2},
        //{key: 'enemyHit', source: 'sfx/cloneExplosion.wav',
        //     offset: 0.2, duration: 0.3', volume: 10, limit: 2},
        {key: 'enemyHit', source: 'sfx/enemyDeath.wav',
             offset: 0.3, duration: 0.2, volume: 20, limit: 2},
        {key: 'bossDeath', source: 'sfx/enemyDeath.wav',
             offset: 0.17, duration: 0.3, volume: 20, limit: 2},
        {key: 'enemyDeath', source: 'sfx/enemy death.wav', volume: 5, limit: 2, duration: 0.4, customDelay: 0.1},
        {key: 'getMoney', source: 'sfx/coin wood c.wav',
            duration: 0.25, volume: 10, limit: 2},
        {key: 'blockAttack', source: 'sfx/coin wood c.wav',
            duration: 0.1, volume: 20, limit: 3},
        {key: 'pickUpObject', source: 'sfx/Tricube 1_odrive.wav', volume: 100, limit: 1},
        {key: 'bushShatter', source: 'sfx/Cube 2_odrive.wav', volume: 50, limit: 3},
        {key: 'rockShatter', source: 'sfx/3x3_odrive.wav', volume: 50, limit: 2},
        {key: 'doorClose', source: 'sfx/Cube-24_odrive.wav', offset: 0.3, duration: 0.2, volume: 100, limit: 1},
        {key: 'doorOpen', source: 'sfx/cube-24.slide_odrive.wav', volume: 100, limit: 1},
        {key: 'chakramHold', source: 'sfx/chakram 5.wav', volume: 1, offset: 0.06, duration: 0.1, limit: 1},
        {key: 'chakramCharge1', source: 'sfx/chakram 5.wav', volume: 1, offset: 0.06, duration: 0.1, limit: 1},
        //{key: 'weakChakram', source: 'sfx/chakram 5.wav', volume: 1 / 2, offset: 0, duration: 80, limit: 2},
        //{key: 'normalChakram', source: 'sfx/chakram 5.wav', volume: 2, limit: 2},
        //{key: 'strongChakram', source: 'sfx/chakram 5.wav', volume: 5, limit: 2},
        {key: 'weakChakram', source: 'sfx/chakram sweep.wav', volume: 2, limit: 2},
        {key: 'normalChakram', source: 'sfx/chakram sweep.wav', volume: 4, limit: 2},
        {key: 'strongChakram', source: 'sfx/chakram sweep.wav', volume: 8, limit: 2},
        {key: 'secretChime', source: 'sfx/chime 14_1.wav', volume: 4, limit: 2},
        {key: 'bigSuccessChime', source: 'sfx/chime 06.wav', duration: 2, volume: 4, limit: 2},
        {key: 'smallSuccessChime', source: 'sfx/chime 15.wav', duration: 2, volume: 4, limit: 2},
    ].forEach(sound => requireSoundEffect(sound));
};
preloadSounds();

window.playSound = playSound;
window.playTrack = playTrack;
window.stopTrack = stopTrack;
window.requireTrack = requireTrack;
window.requireSoundEffect = requireSoundEffect;

// Safari uses webkitAudioContext instead of AudioContext.
const audioContext: AudioContext = new (window.AudioContext || window['webkitAudioContext'])();
window['audioContext'] = audioContext;

let pinkNoiseNode: AudioWorkletNode;
async function registerAndCreateAudioWorklets(): Promise<void> {
    await audioContext.audioWorklet.addModule('audio/pink-noise-processor.js');
    pinkNoiseNode = new AudioWorkletNode(audioContext, 'pink-noise');
    window['pinkNoiseNode'] = pinkNoiseNode;
}
registerAndCreateAudioWorklets();

const masterGainNode = audioContext.createGain();
const trackGainNode = audioContext.createGain();
const soundEffectGainNode = audioContext.createGain();
trackGainNode.connect(masterGainNode);
soundEffectGainNode.connect(masterGainNode);
masterGainNode.connect(audioContext.destination);

function playBeeps(inputFrequencies: number[], volume: number, duration: number,
    {
        smooth = false,
        swell = 0,
        taper = 0,
        type = 'square' as OscillatorType,
    },
    destination: AudioNode,
    time = audioContext.currentTime
) {
    const frequencies = Float32Array.from(inputFrequencies);
    const oscillator = audioContext.createOscillator();
    oscillator.type = type;
    if (smooth) {
        oscillator.frequency.setValueCurveAtTime(frequencies, time, duration);
    } else {
        for (var i = 0; i < frequencies.length; i++) {
            oscillator.frequency.setValueAtTime(frequencies[i], time + duration * i / frequencies.length);
        }
    }
    let lastNode:AudioNode = oscillator;

    const gainNode = audioContext.createGain();
    if (swell) {
        gainNode.gain.setValueAtTime(volume / 100, time);
        gainNode.gain.exponentialRampToValueAtTime(volume, time + duration * swell);
        //gainNode.gain.linearRampToValueAtTime(volume, time + duration * swell);
    } else {
        gainNode.gain.setValueAtTime(volume, time);
    }
    if (taper) {
        gainNode.gain.setValueAtTime(volume, time + duration * (1 - taper));
        // gainNode.gain.setTargetAtTime(0, time, duration / 10);
        //gainNode.gain.linearRampToValueAtTime(0, time + duration);
        gainNode.gain.exponentialRampToValueAtTime(volume / 100, time + duration);
    }
    lastNode.connect(gainNode);
    lastNode = gainNode;

    lastNode.connect(destination);
    oscillator.start(time);
    oscillator.stop(time + duration);
}
window['playBeeps'] = playBeeps;


function playBellSound(
    inputFrequencies: number[],
    volume: number,
    duration: number,
    destination: AudioNode,
    time = audioContext.currentTime
) {
    const combinedGainedNode = audioContext.createGain();
    combinedGainedNode.connect(destination);
    combinedGainedNode.gain.value = volume;

    const frequencies = Float32Array.from(inputFrequencies);
    const attackTime = 0.003;
    let frequencyVolume = 0.5;
    let fadeDuration = duration - attackTime;
    for (const frequency of frequencies) {
        const gainNode = audioContext.createGain();
        gainNode.gain.setValueAtTime(0, time);
        gainNode.gain.linearRampToValueAtTime(frequencyVolume, time + attackTime);
        gainNode.gain.setValueAtTime(frequencyVolume, time + attackTime);
        gainNode.gain.linearRampToValueAtTime(0, time + attackTime + fadeDuration);
        const oscillator = audioContext.createOscillator();
        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';
        oscillator.connect(gainNode);
        oscillator.start(time);
        oscillator.stop(time + duration);
        frequencyVolume *= 0.5;
        fadeDuration *= 0.75;
        gainNode.connect(combinedGainedNode);
    }
}

sounds.set('reflect', {
    play(target: AudioNode, time: number) {
        playBeeps([2000, 8000, 4000], .01, this.duration, {}, target, time);
    },
    duration: 0.1,
    instanceLimit: 3,
    instances: [],
});
sounds.set('fall', {
    play(target: AudioNode, time: number) {
        //playBeeps([1350, 900, 600, 400], 0.05, .15, {smooth: true, taper: 0.6, swell: 0.4});
        playBeeps([1350, 900, 600, 400], 0.1, this.duration, {smooth: true, taper: 0.6, swell: 0.4, type: 'sine'}, target, time);
    },
    duration: 0.2,
    instanceLimit: 1,
    instances: [],
});
sounds.set('freeze', {
    play(target: AudioNode, time: number) {
        const x = 1200;
        playBeeps(
            [x, 1.5 * x, 1.25 * x, 1.75 * x, 1.5 * x, 2 * x, 4 * x, 2 * x], 0.08, this.duration,
            {taper: 0.1, swell: 0.1, type: 'triangle'}, target, time
        );
    },
    duration: 0.2,
    instanceLimit: 2,
    instances: [],
});
sounds.set('ouch', {
    play(target: AudioNode, time: number) {
        playBeeps([200, 400, 100, 200], 0.05, this.duration, {smooth: true, taper: 0.2, swell: 0.2, type: 'sawtooth'}, target, time);
    },
    duration: 0.2,
    instanceLimit: 2,
    instances: [],
});
sounds.set('drink', {
    play(target: AudioNode, time: number) {
        playBeeps([200, 100, 400, 800, 600, 2400], 0.03, this.duration, {smooth: true, taper: 0.2, swell: 0.2, type: 'sine'}, target, time);
    },
    duration: 0.2,
    instanceLimit: 2,
    instances: [],
});
sounds.set('heart', {
    play(target: AudioNode, time: number) {
        playBeeps([800, 1400, 2800, 2100], 0.05, this.duration, {smooth: false, taper: 0.2, swell: 0.2, type: 'sine'}, target, time);
    },
    duration: 0.2,
    instanceLimit: 2,
    instances: [],
});
sounds.set('activateCrystalSwitch', {
    play(target: AudioNode, time: number) {
        playBeeps([2400, 3200, 4000], 0.05, this.duration, {smooth: false, taper: 0.2, swell: 0.2, type: 'sine'}, target, time);
    },
    duration: 0.2,
    instanceLimit: 2,
    instances: [],
});
sounds.set('deactivateCrystalSwitch', {
    play(target: AudioNode, time: number) {
        playBeeps([4000, 3200, 2400], 0.05, this.duration, {smooth: false, taper: 0.2, swell: 0.2, type: 'sine'}, target, time);
    },
    duration: 0.1,
    instanceLimit: 2,
    instances: [],
});
sounds.set('createBarrier', {
    play(target: AudioNode, time: number) {
        playBeeps([100, 500], 0.03, 0.3, {smooth: true, taper: 0.2, swell: 0.2, type: 'sine'}, target, time + 0.3);
        // playBeeps([2400, 3200, 4000, 4000, 4000], 0.05, 0.2, {smooth: false, taper: 0.2, swell: 0.2, type: 'square'}, target, time + 0.3);
    },
    duration: 0.6,
    instanceLimit: 2,
    instances: [],
});
sounds.set('barrierBurst', {
    play(target: AudioNode, time: number) {
        target = audioContext.destination
        time = audioContext.currentTime;
        const noiseGainNode = audioContext.createGain();
        noiseGainNode.gain.setValueAtTime(0, time);
        noiseGainNode.gain.linearRampToValueAtTime(0.2, time + 0.1);
        noiseGainNode.gain.linearRampToValueAtTime(0, time + 0.3);

        pinkNoiseNode.connect(noiseGainNode);
        noiseGainNode.connect(target);

        const waveGainNode = audioContext.createGain();
        waveGainNode.gain.setValueAtTime(0.1, time);
        waveGainNode.gain.linearRampToValueAtTime(0, time + 0.1);
        const oscillator = audioContext.createOscillator();
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(500, time);
        oscillator.frequency.linearRampToValueAtTime(50, time + 0.02);
        oscillator.connect(waveGainNode);
        oscillator.start(time);
        oscillator.stop(time + 0.1);

        oscillator.onended = function() {
            pinkNoiseNode.disconnect(noiseGainNode);
        };
    },
    duration: 0.3,
    instanceLimit: 2,
    instances: [],
});

sounds.set('barrierShatter', {
    play(target: AudioNode, time: number) {
        const x = 1600;
        playBeeps(
            [2 * x, 4 * x, 2 * x, 1.5 * x, 2 * x, 4 * x, 2 * x, 1.5 * x, 1.75 * x, 1.25 * x], 0.08, this.duration,
            {taper: 0.1, swell: 0.1, type: 'triangle'}, target, time
        );
    },
    duration: 0.2,
    instanceLimit: 2,
    instances: [],
});
sounds.set('arrow', {
    play(target: AudioNode, time: number) {
        playBeeps([20000, 1200, 800], 0.1, 0.1, {smooth: true, taper: 0.5, swell: 0.5, type: 'sine'}, target, time);
    },
    duration: 0.1,
    instanceLimit: 2,
    instances: [],
});
sounds.set('error', {
    play(target: AudioNode, time: number) {
        playBeeps([200, 100, 20, 200, 100, 20], 0.04, this.duration, {smooth: false, taper: 0.2, swell: 0.2, type: 'sawtooth'}, target, time);
    },
    duration: 0.4,
    instanceLimit: 2,
    instances: [],
});

// Frequencies from https://www.computermusicresource.com/Simple.bell.tutorial.html
const bellFrequencies = [0.56, 0.92, 1.19, 1.71, 2, 2.74, 3, 3.76, 4.07];

function getBellFrequencies(baseFrequency: number): number[] {
    return bellFrequencies.map(n => baseFrequency * n);
}

const notes = Object.keys(noteFrequencies) as (keyof typeof noteFrequencies)[];

notes.forEach((noteName) => {
    sounds.set(`bell${noteName}`, {
        play(target: AudioNode, time: number) {
            playBellSound(getBellFrequencies(noteFrequencies[noteName]), 0.2, this.duration, target, time);
        },
        duration: 2,
        instanceLimit: 5,
        instances: [],
    });
});
