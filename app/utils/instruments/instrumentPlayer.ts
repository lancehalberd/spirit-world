import {instruments} from 'app/utils/instruments/instrumentHash';
import {noteFrequencies} from 'app/utils/noteFrequencies';
import {audioContext} from 'app/utils/sounds';

interface PlayNoteParams {
    destination: AudioNode
    time: number
    instrument: InstrumentName
    noteOrFrequency: Note|number
    volume: number
    duration: number
}
export function playNote(
    {
        destination = audioContext.destination,
        time = audioContext.currentTime,
        instrument,
        noteOrFrequency = 'A4',
        volume = 1,
        duration = 1,
    }: PlayNoteParams
) {
    const playNote = instruments[instrument]?.playNote;
    if (!playNote) {
        throw Error(`No player defined for instrument: ${instrument}`);
    }
    const frequency = (typeof noteOrFrequency === 'number') ? noteOrFrequency : noteFrequencies[noteOrFrequency];
    playNote({destination, time, frequency, volume, duration});
}
window['playNote'] = playNote;
