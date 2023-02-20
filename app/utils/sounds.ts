import {Howl} from 'howler';

import { GameSound, GameState, HowlerProperties, SoundSettings } from 'app/types';

import { noteFrequencies } from './noteFrequencies';

const sounds = new Map<string, GameSound>();
window['sounds'] = sounds;
let audioUnlocked = false;
export function unlockAudio() {
    audioUnlocked = true;
}

export function requireSound(key, callback = null): GameSound {
    let source, loop, offset, volume, duration, limit, repeatFrom, nextTrack, type = 'default';
    if (typeof key === 'string') {
        [source, offset, volume] = key.split('+');
        key = source;
    } else {
        offset = key.offset;
        volume = key.volume;
        limit = key.limit;
        loop = key.loop;
        source = key.source;
        repeatFrom = key.repeatFrom;
        nextTrack = key.nextTrack;
        type = key.type || type;
        key = key.key || source;
    }
    if (sounds.has(key)) return sounds.get(key);
    if (offset) [offset, duration] = String(offset).split(':').map(Number);
    if (type === 'bgm') {
        const howlerProperties: HowlerProperties = {
            src: [`${source}`],
            html5: true,
            loop: false,
            volume: volume / 50,
            // Stop the track when it finishes fading out.
            onfade: function () {
                //console.log('finished fade', newSound.props.src, newSound.shouldPlay, newSound.howl.volume());
                // console.log(id, 'fadein', currentTrackSource, key, this.volume());
                // Documentation says this only runs when fade completes,
                // but it seems to run at the start and end of fades.
                if (!newSound.shouldPlay) {
                    //console.log('Stopping from onFade ', newSound.props.src);
                    newSound.howl.stop();
                    // this.volume(volume / 50);
                }
            },
            onplay() {
                //console.log('onplay', newSound.props.src, newSound.shouldFadeIn);
                if (newSound.soundSettings.muteTracks) {
                    newSound.howl.mute(true);
                } else if (newSound.shouldFadeIn) {
                    //console.log('newSound.howl.fade', newSound.props.volume * newSound.soundSettings.globalVolume);
                    newSound.howl.mute(false);
                    newSound.howl.fade(0, newSound.props.volume * newSound.soundSettings.globalVolume, 1000);
                } else {
                    newSound.howl.mute(false);
                    newSound.howl.volume(newSound.props.volume * newSound.soundSettings.globalVolume);
                }
            },
            onplayerror: function (error) {
                //console.log('onplayerror', newSound.props.src, error);
            },
            onload: function () {
                if (callback) {
                    callback(newSound);
                }
            },
        };
        howlerProperties.onend = function() {
            //console.log('onend repeatFrom', repeatFrom, newSound.props.src, key);
            newSound.shouldFadeIn = false;
            newSound.howl.seek((repeatFrom || 0) / 1000);
            newSound.howl.play();
        };
        // A track can specify another track source to automatically transition to without crossfade.
        if (nextTrack) {
            howlerProperties.onend = function() {
                //console.log('onend nextTrack', repeatFrom, newSound.props.src, key);
                newSound.howl.stop();
                playingTracks = [];
                window['playingTracks'] = playingTracks;
                playTrack(nextTrack, 0, newSound.soundSettings, false, false);
            };
            // Make sure the next track is preloaded.
            if (!musicTracks[nextTrack]) {
                requireSound(musicTracks[nextTrack]);
            }
        }
        const newSound: GameSound = {
            howl: new Howl(howlerProperties),
            props: howlerProperties,
            nextTrack,
        }
        sounds.set(key, newSound);
        return newSound;
    } else {
        const howlerProperties: HowlerProperties = {
            src: [`${source}`],
            loop: loop || false,
            volume: (volume || 1) / 50,
            onplay: function () {
                if (newSound.activeInstances === 0) {
                    playingSounds.add(newSound);
                }
                newSound.activeInstances++;
                audioUnlocked = true;
                //console.log('playing sound', newSound.activeInstances);
            },
            onstop: function () {
                newSound.activeInstances--;
                //console.log('stopped sound', newSound.activeInstances);
                if (newSound.activeInstances === 0) {
                    playingSounds.delete(newSound);
                }
            },
            onend: function () {
                newSound.activeInstances--;
                //console.log('finished sound', newSound.activeInstances);
                if (newSound.activeInstances === 0) {
                    playingSounds.delete(newSound);
                }
            },
            onload: function () {
                if (callback) {
                    callback(newSound);
                }
            },
        };
        if (offset || duration) {
            if (!duration) {
                console.log('missing duration for sound sprite.', key, offset, duration);
                debugger;
            }
            howlerProperties.sprite = {
                sprite: [offset, duration],
            };
        }
        const newSound: GameSound = {
            howl: new Howl(howlerProperties),
            activeInstances: 0,
            instanceLimit: limit || 5,
            props: howlerProperties,
            nextTrack,
        }
        if (howlerProperties.sprite) {
            newSound.spriteName = 'sprite';
        }
        sounds.set(key, newSound);
        return newSound;
    }
}

const playingSounds = new Set<GameSound>();
export function playSound(key, soundSettings: SoundSettings) {
    const sound = requireSound(key);

    if (sound.activeInstances >= sound.instanceLimit) {
        return;
    }
    const muted = soundSettings.muteSounds;
    const now = Date.now();
    const customDelay = sound.customDelay || 40;
    if (sound.canPlayAfter && sound.canPlayAfter > now) {
        // Don't play the sound if more than the instance limit are queued into
        // the future.
        const delay = sound.canPlayAfter - now;
        if (delay <= sound.instanceLimit * customDelay) {
            setTimeout(() => playSound(key, soundSettings), delay);
        }
        return sound;
    }
    sound.canPlayAfter = now + customDelay;
    try {
        if (sound.howl) {
            sound.howl.mute(muted);
            if (sound.spriteName) {
                sound.howl.play(sound.spriteName);
            } else {
                sound.howl.play();
            }
        } else if (sound.play && !muted) {
            sound.play();
        }
    } catch(e) {
        console.log(e);
        debugger;
    }
    return sound;
}
export function stopSound(sound: GameSound): void {
    if (sound.howl) {
        sound.howl.stop();
    } else {
        // no logic for stopping non howl sounds.
    }
}
window['stopSound'] = stopSound;


let playingTracks: GameSound[] = [], trackIsPlaying = false;
window['playingTracks'] = playingTracks;


const musicTracks = {
    // Tracks from Nick
    // Used in various caves
    caveTheme: {key: 'caveTheme', type: 'bgm', source: 'bgm/Spirit 1.mp3', volume: 10 },
    // Used on the title screen and world map
    mainTheme: {key: 'mainTheme', type: 'bgm', source: 'bgm/Spirit 4.2_demo.mp3', volume: 5 },
    // Used for holy city, but a bit to relaxed for that.
    waterfallVillageTheme: {key : 'waterfallVillage', type: 'bgm', source: 'bgm/Spirit 21.A_demo.mp3', volume: 5},
    vanaraForestTheme: {key: 'vanaraForestTheme', type: 'bgm', source: 'bgm/Spirit 16_concept.mp3', volume: 5 },
    tombTheme: {key: 'tombTheme', type: 'bgm', source: 'bgm/Spirit 5.2_demo.mp3', volume: 5 },
    // Used for Vanara ship dungeons like cocoon, helix and forest temple.
    cocoonTheme: {key: 'cocoonTheme', type: 'bgm', source: 'bgm/Spirit 6 Demo.mp3', volume: 5 },
    vanaraDreamTheme: {key: 'vanaraDreamTheme', type: 'bgm', source: 'bgm/Spirit 18_concept.mp3', volume: 5 },
    helixTheme: {key: 'helixTheme', type: 'bgm', source: 'bgm/Spirit 13.2_demo.mp3', volume: 5 },
    waterfallTowerTheme: {key: 'waterfallTowerTheme', type: 'bgm', source: 'bgm/Public Surface_concept.mp3', volume: 5 },
    forgeTheme: {key: 'forgeTheme', type: 'bgm', source: 'bgm/Public Surface.b_concept.mp3', volume: 5 },
    craterTheme: {key: 'craterTheme', type: 'bgm', source: 'bgm/Fatty Richness_demo.mp3', volume: 5 },
    // Used for the tower after it is activated.
    towerTheme: {key: 'towerTheme', type: 'bgm', source: 'bgm/Spirit 15.4.mp3', volume: 5 },
    skyTheme: {key: 'skyTheme', type: 'bgm', source: 'bgm/Spirit 14_demo.mp3', volume: 5 },
    // Used for the lake temple
    lakeTheme: {key: 'lakeTheme', type: 'bgm', source: 'bgm/Spirit 9 Demo.mp3', volume: 5 },
    // Used for holy city, but a bit to relaxed for that.
    village: {key : 'village', type: 'bgm', source: 'bgm/Spirit 21_demo.mp3', volume: 5},
    // Used for summoner ruins.
    ruins: {key : 'ruins', type: 'bgm', source: 'bgm/Spirit 22_concept.mp3', volume: 5},

    // Tracks from Leon
    // For War Temple and other dungeons
    dungeonTheme: {key: 'dungeonTheme', type: 'bgm', source: 'bgm/SpiritQuestSong_Leon1.mp3', volume: 10 },
    idleTheme: {key: 'idleTheme', type: 'bgm', source: 'bgm/IdleMusic.mp3', volume: 20 },
    bossIntro: {key: 'bossIntro', type: 'bgm', source: 'bgm/SpookyThemeIntro.mp3', volume: 20, nextTrack: 'bossA' },
    bossA: {key: 'bossA', type: 'bgm', source: 'bgm/SpookyThemeA.mp3', volume: 20, nextTrack: 'bossB' },
    bossB: {key: 'bossB', type: 'bgm', source: 'bgm/SpookyThemeB.mp3', volume: 20, nextTrack: 'bossA' },
};
export type TrackKey = keyof typeof musicTracks;
export function playTrack(trackKey: TrackKey, timeOffset, soundSettings: SoundSettings, fadeOutOthers = true, crossFade = true) {
    if (!audioUnlocked) {
        return;
    }
    const sound = requireSound(musicTracks[trackKey]);
    if (!sound.howl || !sound.howl.duration()) {
        return false;
    }
    // Do nothing if the sound is already playing.
    if (playingTracks.includes(sound)) {
        return sound;
    }
    // Do nothing if the sound has transitioned to the next track.
    // This allows treating preventing restarting the sound when the source is still the original track.
    // This currently only supports one instance of nextTrack set per sound.
    /*if (sound.nextTrack) {
        const nextTrackSound = requireSound(musicTracks[sound.nextTrack]);
        if (playingTracks.includes(nextTrackSound) || nextTrackSound.howl.playing()) {
            return nextTrackSound;
        }
    }*/
    //console.log('playTrack', playingTracks, source, sound);
    trackIsPlaying = false;
    if (fadeOutOthers) {
        if (crossFade) fadeOutPlayingTracks();
        else stopTrack();
    }

    let offset = (timeOffset / 1000);
    if (sound.howl.duration()) {
        offset = offset % sound.howl.duration();
    }
    //console.log('play', sound.props.src, timeOffset, sound.howl.duration(), offset);
    //sound.howl.seek(offset);
    sound.soundSettings = soundSettings;
    sound.howl.seek(offset);
    sound.howl.play();
    sound.shouldPlay = true;
    // console.log({volume});
    // console.log('fade in new track', sound);
    //console.log('Fade in ' + sound.props.src);
    if (crossFade) {
        //console.log('fade in', sound.props.src, sound.howl.volume(), sound.howl.seek(), volume);
        sound.shouldFadeIn = true;
    } else {
        //console.log('hard start', volume);
        sound.howl.volume(sound.props.volume * soundSettings.globalVolume);
        sound.shouldFadeIn = false;
    }
    sound.howl.mute(soundSettings.muteTracks);
    playingTracks.push(sound);
    return sound;
}

function fadeOutPlayingTracks(currentTracks: GameSound[] = []) {
    const keepPlayingTracks: GameSound[] = [];
    for (const trackToFadeOut of playingTracks) {
        if (currentTracks.includes(trackToFadeOut)) {
            keepPlayingTracks.push(trackToFadeOut);
            continue;
        }
        trackToFadeOut.shouldPlay = false;
        if (trackToFadeOut.howl.volume()) {
            //console.log('Fade out ' + trackToFadeOut.props.src, trackToFadeOut.howl.volume());
            trackToFadeOut.howl.fade(trackToFadeOut.howl.volume(), 0, 1000);
        } else {
            //console.log('Fade directly stop ' + trackToFadeOut.props.src, trackToFadeOut.howl.volume());
            trackToFadeOut.howl.stop();
        }
    }
    playingTracks = keepPlayingTracks;
    window['playingTracks'] = playingTracks;
}

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

export function stopTrack() {
    trackIsPlaying = false;
    for (const playingTrack of playingTracks) {
        //console.log('Stopping from stopTrack ', playingTrack.props.src);
        playingTrack.howl.stop();
    }
    playingTracks = [];
    window['playingTracks'] = playingTracks;
}
export function isATrackPlaying() {
    return trackIsPlaying;
}
export function isTrackPlaying(trackKey: TrackKey): boolean {
    const sound = requireSound(musicTracks[trackKey]);
    return playingTracks.includes(sound);
}

const preloadSounds = () => {
    [
        {key: 'menuTick', source: 'sfx/Cube click_odrive.wav', volume: 10, offset: '0:200', limit: 2},
        {key: 'switch', source: 'sfx/Diamond 1_odrive_bip.wav', volume: 10, limit: 2},
        {key: 'smallSwitch', source: 'sfx/Cube click 2_Ocrive.wav', volume: 10, limit: 2},
        {key: 'rollingBall', source: 'sfx/rollingBall.wav',
            offset: '0:1400', loop: true, volume: 10, limit: 2
        },
        {key: 'rollingBallHit', source: 'sfx/rollingBallHit.wav', volume: 10, limit: 2},
        {key: 'rollingBallSocket', source: 'sfx/rollingBallSocket.wav', volume: 10, limit: 2},
        {key: 'cloneExplosion', source: 'sfx/cloneExplosion.wav', volume: 10, limit: 2},
        //{key: 'enemyHit', source: 'sfx/cloneExplosion.wav',
        //     offset: '200:300', volume: 10, limit: 2},
        {key: 'enemyHit', source: 'sfx/enemyDeath.wav',
             offset: '300:200', volume: 20, limit: 2},
        {key: 'bossDeath', source: 'sfx/enemyDeath.wav',
             offset: '170:300', volume: 20, limit: 2},
        {key: 'enemyDeath', source: 'sfx/enemy death.wav', volume: 5, limit: 2},
        {key: 'getMoney', source: 'sfx/coin wood c.wav',
            offset: '0:250', volume: 10, limit: 2},
        {key: 'blockAttack', source: 'sfx/coin wood c.wav',
            offset: '0:100', volume: 10, limit: 3},
        {key: 'pickUpObject', source: 'sfx/Tricube 1_odrive.wav', volume: 50, limit: 1},
        {key: 'bushShatter', source: 'sfx/Cube 2_odrive.wav', volume: 15, limit: 3},
        {key: 'rockShatter', source: 'sfx/3x3_odrive.wav', volume: 15, limit: 2},
        {key: 'doorClose', source: 'sfx/Cube-24_odrive.wav', volume: 10, limit: 1},
        {key: 'doorOpen', source: 'sfx/cube-24.slide_odrive.wav', volume: 10, limit: 1},
        {key: 'chakramHold', source: 'sfx/chakram 5.wav', volume: 1 / 2, offset: '60:100', limit: 1},
        {key: 'chakramCharge1', source: 'sfx/chakram 5.wav', volume: 1 / 2, offset: '60:100', limit: 1},
        //{key: 'weakChakram', source: 'sfx/chakram 5.wav', volume: 1 / 2, offset: '0:80', limit: 2},
        //{key: 'normalChakram', source: 'sfx/chakram 5.wav', volume: 2, limit: 2},
        //{key: 'strongChakram', source: 'sfx/chakram 5.wav', volume: 5, limit: 2},
        {key: 'weakChakram', source: 'sfx/chakram sweep.wav', volume: 1, limit: 2},
        {key: 'normalChakram', source: 'sfx/chakram sweep.wav', volume: 3, limit: 2},
        {key: 'strongChakram', source: 'sfx/chakram sweep.wav', volume: 5, limit: 2},
        {key: 'secretChime', source: 'sfx/chime 14_1.wav', volume: 4, limit: 2},
        {key: 'bigSuccessChime', source: 'sfx/chime 06.wav', offset: '0:2000', volume: 4, limit: 2},
        {key: 'smallSuccessChime', source: 'sfx/chime 15.wav', offset: '0:2000', volume: 4, limit: 2},
    ].forEach(sound => requireSound(sound));
};
preloadSounds();


/*
export function getSoundDuration(key) {
    const sound = requireSound(key);
    if (sound.duration) {
        return sound.duration;
    }
    if (!sound.howl || !sound.howl.duration()) {
        return false;
    }
    sound.duration = sound.howl.duration();
    return sound.duration;
}*/

window['playSound'] = playSound;
window['playTrack'] = playTrack;
window['stopTrack'] = stopTrack;
window['requireSound'] = requireSound;

// Safari uses webkitAudioContext instead of AudioContext.
const audioContext: AudioContext = new (window.AudioContext || window['webkitAudioContext'])();

function makeDistortionCurve(amount) {
  var k = typeof amount === 'number' ? amount : 50,
    n_samples = 44100,
    curve = new Float32Array(n_samples),
    deg = Math.PI / 180,
    i = 0,
    x;
  for ( ; i < n_samples; ++i ) {
    x = i * 2 / n_samples - 1;
    curve[i] = ( 3 + k ) * x * 20 * deg / ( Math.PI + k * Math.abs(x) );
  }
  return curve;
};
var distortionCurve = makeDistortionCurve(100);

function playBeeps(frequencies, volume, duration, {smooth=false, swell=false, taper=false, distortion=false}) {
    frequencies = Float32Array.from(frequencies);
    const oscillator = audioContext.createOscillator();
    oscillator.type = 'square';
    if (smooth) oscillator.frequency.setValueCurveAtTime(frequencies, audioContext.currentTime, duration);
    else {
        for (var i = 0; i < frequencies.length; i++) {
            oscillator.frequency.setValueAtTime(frequencies[i], audioContext.currentTime + duration * i / frequencies.length);
        }
    }
    let lastNode:AudioNode = oscillator;
    if (distortion) {
        const distortionNode = audioContext.createWaveShaper();
        distortionNode.curve = distortionCurve;
        distortionNode.oversample = '4x';
        lastNode.connect(distortionNode);
        lastNode = distortionNode;
    }

    const gainNode = audioContext.createGain();
    if (swell) {
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(volume, audioContext.currentTime + duration * .1);
    } else {
        gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
    }
    if (taper) {
        gainNode.gain.setValueAtTime(volume, audioContext.currentTime + duration * .9);
        // gainNode.gain.setTargetAtTime(0, audioContext.currentTime, duration / 10);
        gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + duration);
    }
    lastNode.connect(gainNode);
    lastNode = gainNode;


    lastNode.connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + duration);
}

function playBellSound(frequencies, volume, duration) {
    const combinedGainedNode = audioContext.createGain();
    combinedGainedNode.connect(audioContext.destination);
    combinedGainedNode.gain.value = volume;

    const currentTime = audioContext.currentTime;
    frequencies = Float32Array.from(frequencies);
    const attackTime = 0.003;
    let frequencyVolume = 0.5;
    let fadeDuration = duration - attackTime;
    for (const frequency of frequencies) {
        const gainNode = audioContext.createGain();
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(frequencyVolume, audioContext.currentTime + attackTime);
        gainNode.gain.setValueAtTime(frequencyVolume, audioContext.currentTime + attackTime);
        gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + attackTime + fadeDuration);
        const oscillator = audioContext.createOscillator();
        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';
        oscillator.connect(gainNode);
        oscillator.start(currentTime);
        oscillator.stop(currentTime + duration);
        frequencyVolume *= 0.5;
        fadeDuration *= 0.75;
        gainNode.connect(combinedGainedNode);
    }
}

sounds.set('reflect', {
    play() {
        playBeeps([2000, 8000, 4000], .01, .1, {});
    }
});
sounds.set('wand', {
    play() {
        playBeeps([1200, 400], 0.01, .1, {smooth: true, taper: true, swell: true, distortion: true});
    }
});

// Frequencies from https://www.computermusicresource.com/Simple.bell.tutorial.html
const bellFrequencies = [0.56, 0.92, 1.19, 1.71, 2, 2.74, 3, 3.76, 4.07];

function getBellFrequencies(baseFrequency: number): number[] {
    return bellFrequencies.map(n => baseFrequency * n);
}

const notes = Object.keys(noteFrequencies);

notes.forEach((noteName) => {
    sounds.set(`bell${noteName}`, {
        play() {
            playBellSound(getBellFrequencies(noteFrequencies[noteName]), 0.2, 2);
        }
    });
});
