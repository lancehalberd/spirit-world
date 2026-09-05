import {instruments} from 'app/utils/instruments/instrumentHash';
import {playSimpleSound, vibratoNode} from 'app/utils/instruments/playSimpleSound'


function playZeldaSquare({frequency, volume, time, destination, duration}: InstrumentPlayNoteParams) {
    playSimpleSound({
        frequencies: [frequency],
        volume: volume * 0.25,
        duration,
        time,
        destination,
        oscillatorType: 'square',
        pitchNode: vibratoNode(duration, 8, 1),
        //pitchVibratoFrequency: 8,
        //pitchVibratoGain: 1
    });
}

instruments.zeldaSquare = {
    playNote: playZeldaSquare
};
