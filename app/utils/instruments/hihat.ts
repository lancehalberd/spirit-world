import {instruments} from 'app/utils/instruments/instrumentHash';
import {createWhiteNoiseSource, getRandomNoiseOffset} from 'app/utils/instruments/noiseBuffer';
import {audioContext} from 'app/utils/sounds';

// Real hihats are broadband noise, not a stack of pitched partials. An earlier version of this
// file used detuned square oscillators at inharmonic ratios to approximate noise, which is
// periodic/tonal and reads as metallic/buzzy rather than a clean "tsss" - see `noiseBuffer.ts`.
// Source: https://dev.to/kabisasoftware/browser-beats-ii-synthesizing-a-snare-drum-and-a-hi-hat-463h
function playHihatSound({frequency, volume, time, destination, duration}: InstrumentPlayNoteParams) {
    const source = createWhiteNoiseSource();
    const filterNode = audioContext.createBiquadFilter();
    filterNode.type = 'highpass';
    // `frequency` (the note passed in) gives a little brightness control per note - a higher
    // note reads as a more "open" sounding hat - without changing its fundamentally noisy character.
    filterNode.frequency.value = 5000 + frequency * 4;

    const noiseGain = audioContext.createGain();
    noiseGain.gain.value = 1;
    noiseGain.gain.setValueAtTime(1, time + 0.001);
    noiseGain.gain.linearRampToValueAtTime(0, time + duration);
    //noiseGain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    const gainNode = audioContext.createGain();
    gainNode.gain.value = volume;

    source.connect(noiseGain);
    noiseGain.connect(filterNode);
    filterNode.connect(gainNode);
    gainNode.connect(destination);
    source.start(time, getRandomNoiseOffset());
    source.stop(time + duration);
    source.onended = () => {
        source.disconnect(noiseGain);
        noiseGain.disconnect(filterNode);
        filterNode.disconnect(gainNode);
        gainNode.disconnect(destination);
    };
}

instruments.hihat = {
    playNote: playHihatSound
};
