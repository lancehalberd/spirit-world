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

    const gainNode = audioContext.createGain();
    // `.value =` takes effect at the real current time, which (thanks to the lookahead
    // scheduler) is normally earlier than `time` - so it alone would leave the ramp below
    // anchored to a stale, too-early reference point. The explicit setValueAtTime pins the
    // ramp's actual start; `.value =` just covers the ~1ms gap before that anchor fires, since
    // GainNode.gain otherwise defaults to 1, not `volume`.
    gainNode.gain.value = volume;
    gainNode.gain.setValueAtTime(volume, time + 0.001);
    gainNode.gain.linearRampToValueAtTime(0, time + duration);

    source.connect(filterNode);
    filterNode.connect(gainNode);
    gainNode.connect(destination);
    source.start(time, getRandomNoiseOffset());
    source.stop(time + duration);
    source.onended = () => {
        source.disconnect(filterNode);
        filterNode.disconnect(gainNode);
        gainNode.disconnect(destination);
    };
}

instruments.hihat = {
    playNote: playHihatSound,
    defaultAuditionDuration: 0.15,
};
