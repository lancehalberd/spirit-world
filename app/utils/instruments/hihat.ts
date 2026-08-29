import {instruments} from 'app/utils/instruments/instrumentHash';
import {playSimpleSound} from 'app/utils/instruments/playSimpleSound'

// Frequencies etc from http://joesul.li/van/synthesizing-hi-hats/
const hiHatFrequencies = [2, 3, 4.16, 5.43, 6.79, 8.21];
function getHiHatFrequencies(baseFrequency: number): number[] {
    return hiHatFrequencies.map(n => baseFrequency * n);
}

function playHihatSound({frequency, volume, time, destination, duration}: InstrumentPlayNoteParams) {
    playSimpleSound({
        frequencies: getHiHatFrequencies(frequency),
        duration,
        destination,
        time,
        volume,
        oscillatorType: 'square',
        attackTime: 0.002,
        fadeTime: duration - 0.005,
        bandpassFrequency: 10000,
        highpassFrequency: 7000,
    });
}

instruments.hihat = {
    playNote: playHihatSound
};
