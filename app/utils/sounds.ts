import {Howl/*, Howler*/} from 'howler';


/* globals setTimeout, Set, Map */
const sounds = new Map();
window['sounds'] = sounds;

export function requireSound(key, callback = null) {
    let source, offset, volume, duration, limit, repeatFrom, nextTrack, type = 'default';
    if (typeof key === 'string') {
        [source, offset, volume] = key.split('+');
        key = source;
    } else {
        offset = key.offset;
        volume = key.volume;
        limit = key.limit;
        source = key.source;
        repeatFrom = key.repeatFrom;
        nextTrack = key.nextTrack;
        type = key.type || type;
        key = key.key || source;
    }
    if (sounds.has(key)) return sounds.get(key);
    if (offset) [offset, duration] = String(offset).split(':').map(Number);
    let newSound: any = {};
    if (type === 'bgm') {
        const howlerProperties: any = {
            src: [source],
            loop: true,
            volume: volume / 50,
            // Stop the track when it finishes fading out.
            onfade: function () {
                //console.log('finished fade', newSound.props.src, newSound.shouldPlay, this.volume());
                // console.log(id, 'fadein', currentTrackSource, key, this.volume());
                // Documentation says this only runs when fade completes,
                // but it seems to run at the start and end of fades.
                if (!newSound.shouldPlay) {
                    //console.log('Stopping from onFade ', newSound.props.src);
                    this.stop();
                    // this.volume(volume / 50);
                }
            },
            onplay: function () {
                trackIsPlaying = true;
            },
            onload: function () {
                if (callback) {
                    callback(newSound);
                }
            },
        };
        if (repeatFrom) {
            howlerProperties.onend = function() {
                // console.log('onend', repeatFrom, currentTrackSource, key);
                // Only repeat the track on end if it matches
                // the current track source still.
                // I don't think this was necessary but leaving it in comments in case.
                //if (playingTracks.includes(newSound)) {
                this.seek((repeatFrom || 0) / 1000);
                //}
            };
        }
        // A track can specify another track source to automatically transition to without crossfade.
        if (nextTrack) {
            howlerProperties.onend = function() {
                playTrack(nextTrack, 0, this.mute(), false, false);
                this.stop();
            };
        }
        newSound.howl = new Howl(howlerProperties);
        newSound.props = howlerProperties;
        newSound.nextTrack = nextTrack;
    } else {
        const howlerProperties: any = {
            src: [source],
            loop: false,
            volume: (volume || 1) / 50,
            onplay: function () {
                if (newSound.activeInstances === 0) {
                    playingSounds.add(newSound);
                }
                newSound.activeInstances++;
                //console.log('playing sound', newSound.activeInstances);
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
            newSound.spriteName = 'sprite';
        }
        newSound.howl = new Howl(howlerProperties),
        newSound.activeInstances = 0;
        newSound.instanceLimit = limit || 5;
        newSound.props = howlerProperties;
    }
    sounds.set(key, newSound);
    return newSound;
}

const playingSounds = new Set<any>();
export function playSound(key, muted = false) {
    const sound = requireSound(key);
    if (sound.activeInstances >= sound.instanceLimit) return;
    const now = Date.now();
    const customDelay = sound.customDelay || 40;
    if (sound.canPlayAfter && sound.canPlayAfter > now) {
        // Don't play the sound if more than the instance limit are queued into
        // the future.
        const delay = sound.canPlayAfter - now;
        if (delay <= sound.instanceLimit * customDelay) {
            setTimeout(() => playSound(key, muted), delay);
        }
        return;
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
}

let playingTracks = [], trackIsPlaying = false;
window['playingTracks'] = playingTracks;
export function playTrack(source, timeOffset, muted = false, fadeOutOthers = true, crossFade = true) {
    const sound = requireSound(source);
    if (!sound.howl || !sound.howl.duration()) {
        return false;
    }
    // Do nothing if the sound is already playing.
    if (playingTracks.includes(sound) || sound.howl.playing()) {
        return sound;
    }
    // Do nothing if the sound has transitioned to the next track.
    // This allows treating preventing restarting the sound when the source is still the original track.
    // This currently only supports one instance of nextTrack set per sound.
    if (sound.nextTrack) {
        const nextTrackSound = requireSound(sound.nextTrack);
        if (playingTracks.includes(nextTrackSound) || nextTrackSound.howl.playing()) {
            return nextTrackSound;
        }
    }
    //console.log('playTrack', playingTracks, source, sound);
    trackIsPlaying = false;
    if (fadeOutOthers) {
        if (crossFade) fadeOutPlayingTracks();
        else stopTrack();
    }

    const volume = sound.props.volume;
    let offset = (timeOffset / 1000);
    if (sound.howl.duration()) {
        offset = offset % sound.howl.duration();
    }
    // console.log(timeOffset, sound.howl.duration(), offset);
    sound.howl.seek(offset);
    sound.howl.play();
    sound.shouldPlay = true;
    // console.log({volume});
    // console.log('fade in new track', sound);
    //console.log('Fade in ' + sound.props.src);
    if (crossFade) sound.howl.fade(0, volume, 1000);
    else sound.howl.volume(volume);
    sound.howl.mute(muted);
    playingTracks.push(sound);
    return sound;
}

function fadeOutPlayingTracks(currentTracks = []) {
    const keepPlayingTracks = [];
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

function stopTrack() {
    trackIsPlaying = false;
    for (const playingTrack of playingTracks) {
        // console.log('Stopping from stopTrack ', playingTrack.props.src);
        playingTrack.howl.stop();
    }
    playingTracks = [];
    window['playingTracks'] = playingTracks;
}
export function isPlayingTrack() {
    return trackIsPlaying;
}

/*export function muteSounds() {
    for (const sound of playingSounds) sound.howl.mute(true);
}
export function unmuteSounds() {
    for (const sound of playingSounds) sound.howl.mute(false);
}
export function muteTrack() {
    for (const playingTrack of playingTracks) {
        playingTrack.howl.mute(true);
    }
}
export function unmuteTrack() {
    for (const playingTrack of playingTracks) {
        playingTrack.howl.mute(false);
    }
}

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
var audioContext = new (window.AudioContext || window['webkitAudioContext'])();

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

sounds.set('reflect', {
    play() {
        playBeeps([2000, 8000, 4000], .01, .1, {});
    }
});
sounds.set('wand', {
    play() {
        playBeeps([1200, 400], 0.01, .1, {smooth: true, taper: true, swell: true, distortion: true});
    }
})

