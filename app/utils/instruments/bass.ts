import {audioContext} from 'app/utils/sounds';
import {instruments} from 'app/utils/instruments/instrumentHash';
import {getWaveformGain} from 'app/utils/instruments/waveformGain';

// A punchy low voice for ostinato/bassline parts: a sawtooth carries the harmonic "growl",
// a sine an octave below adds sub-bass weight, and a lowpass keeps the overall tone warm
// rather than buzzy so it sits under the lead instrument instead of competing with it.
function playBassNote({frequency, volume, time, destination, duration}: InstrumentPlayNoteParams) {
    const filterNode = audioContext.createBiquadFilter();
    filterNode.type = 'lowpass';
    filterNode.frequency.value = Math.min(1200, frequency * 6 + 200);
    filterNode.connect(destination);

    const attackTime = 0.005;
    const releaseTime = Math.min(0.06, duration * 0.2);
    const voices: Array<[number, OscillatorType, number]> = [
        [frequency, 'sawtooth', 1],
        [frequency / 2, 'sine', 0.6],
    ];
    const normalizedVolume = volume / voices.length;
    for (const [oscFrequency, oscType, oscVolume] of voices) {
        const voiceVolume = oscVolume * normalizedVolume * getWaveformGain(oscType);
        const gainNode = audioContext.createGain();
        gainNode.gain.setValueAtTime(0, time);
        gainNode.gain.linearRampToValueAtTime(voiceVolume, time + attackTime);
        gainNode.gain.setValueAtTime(voiceVolume, time + duration - releaseTime);
        gainNode.gain.linearRampToValueAtTime(0, time + duration);
        const oscillator = audioContext.createOscillator();
        oscillator.type = oscType;
        oscillator.frequency.value = oscFrequency;
        oscillator.connect(gainNode);
        oscillator.start(time);
        oscillator.stop(time + duration);
        oscillator.onended = () => {
            oscillator.disconnect(gainNode);
            gainNode.disconnect(filterNode);
        };
        gainNode.connect(filterNode);
    }
    setTimeout(() => {
        filterNode.disconnect(destination);
    }, 1000 * (time - audioContext.currentTime + duration));
}

instruments.bass = {
    playNote: playBassNote
};
