import {audioContext} from 'app/utils/sounds';
import {instruments} from 'app/utils/instruments/instrumentHash';
import {createWhiteNoiseSource, getRandomNoiseOffset} from 'app/utils/instruments/noiseBuffer';
import {getWaveformGain} from 'app/utils/instruments/waveformGain';

// Two components, matching the common "drum body + snares" split for synthesized snares:
// - A pitched "body": two triangle oscillators (a fifth-ish apart, ratio ~1.89) through a
//   soft-clip waveshaper for a bit of edge, standing in for the drum shell/skin resonance.
// - White noise through a highpass filter for the snares' buzz. This needs to be real noise,
//   not a stack of oscillators: an earlier version of this file approximated noise with detuned
//   square waves (like the hihat used to), which is periodic/tonal and reads as metallic rather
//   than a snappy hiss - see `noiseBuffer.ts`.
// Sources:
// - https://dev.to/kabisasoftware/browser-beats-ii-synthesizing-a-snare-drum-and-a-hi-hat-463h (body/noise split, frequency ratio, filter cutoff)
// - https://developer.mozilla.org/en-US/docs/Web/API/BaseAudioContext/createWaveShaper (distortion curve formula)
function makeDistortionCurve(amount: number): Float32Array {
    const samples = 44100;
    const curve = new Float32Array(samples);
    const deg = Math.PI / 180;
    for (let i = 0; i < samples; i++) {
        const x = (i * 2) / samples - 1;
        curve[i] = ((3 + amount) * x * 20 * deg) / (Math.PI + amount * Math.abs(x));
    }
    return curve;
}
const distortionCurve = makeDistortionCurve(50);
const bodyFrequencyRatios = [1, 1.89];
const bodyWaveformGain = getWaveformGain('triangle');

function playSnareSound({frequency, volume, time, destination, duration}: InstrumentPlayNoteParams) {
    const bodyDuration = Math.min(duration, 0.1);
    for (const ratio of bodyFrequencyRatios) {
        const oscillator = audioContext.createOscillator();
        oscillator.type = 'triangle';
        oscillator.frequency.value = frequency * ratio;
        const shaper = audioContext.createWaveShaper();
        shaper.curve = distortionCurve;
        const gainNode = audioContext.createGain();
        gainNode.gain.setValueAtTime(volume * 0.5 * bodyWaveformGain, time);
        gainNode.gain.linearRampToValueAtTime(0, time + bodyDuration);
        oscillator.connect(shaper);
        shaper.connect(gainNode);
        gainNode.connect(destination);
        oscillator.start(time);
        oscillator.stop(time + bodyDuration);
        oscillator.onended = () => {
            oscillator.disconnect(shaper);
            shaper.disconnect(gainNode);
            gainNode.disconnect(destination);
        };
    }

    const noiseDuration = Math.min(duration, 0.2);
    const noiseSource = createWhiteNoiseSource();
    const filterNode = audioContext.createBiquadFilter();
    filterNode.type = 'highpass';
    filterNode.frequency.value = 2000;
    const noiseGain = audioContext.createGain();
    noiseGain.gain.setValueAtTime(volume, time);
    noiseGain.gain.linearRampToValueAtTime(0, time + noiseDuration);
    noiseSource.connect(filterNode);
    filterNode.connect(noiseGain);
    noiseGain.connect(destination);
    noiseSource.start(time, getRandomNoiseOffset());
    noiseSource.stop(time + noiseDuration);
    noiseSource.onended = () => {
        noiseSource.disconnect(filterNode);
        filterNode.disconnect(noiseGain);
        noiseGain.disconnect(destination);
    };
}

instruments.snare = {
    playNote: playSnareSound
};
