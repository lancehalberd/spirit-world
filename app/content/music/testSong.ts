import {musicTrackHash} from 'app/utils/music/musicTrackHash';

// A short 2-bar loop used to exercise the synthesized music track player end to end.
// Play it from the console with `playMusicTrack('testSong')`, stop with `stopMusicTrack()`.
musicTrackHash.testSong = {
    key: 'testSong',
    bpm: 120,
    loop: true,
    parts: [
        {
            instrument: 'harp',
            notes: [
                {beat: 0, duration: 0.5, note: 'E4'},
                {beat: 0.5, duration: 0.5, note: 'G4'},
                {beat: 1, duration: 0.5, note: 'A4'},
                {beat: 1.5, duration: 0.5, note: 'G4'},
                {beat: 2, duration: 0.5, note: 'E4'},
                {beat: 2.5, duration: 0.5, note: 'D4'},
                {beat: 3, duration: 1, note: 'E4'},
                {beat: 4, duration: 0.5, note: 'A4'},
                {beat: 4.5, duration: 0.5, note: 'C5'},
                {beat: 5, duration: 0.5, note: 'B4'},
                {beat: 5.5, duration: 0.5, note: 'A4'},
                {beat: 6, duration: 0.5, note: 'G4'},
                {beat: 6.5, duration: 0.5, note: 'E4'},
                {beat: 7, duration: 1, note: 'D4'},
            ],
        },
        {
            instrument: 'bell',
            volume: 0.6,
            notes: [
                // A simple two-note pad under each bar; entries sharing a `beat` form a chord.
                {beat: 0, duration: 4, note: 'E4'},
                {beat: 0, duration: 4, note: 'B4'},
                {beat: 4, duration: 4, note: 'A4'},
                {beat: 4, duration: 4, note: 'E5'},
            ],
        },
        {
            instrument: 'hihat',
            volume: 0.5,
            notes: [
                {beat: 0, duration: 0.2, note: 'A4'},
                {beat: 1, duration: 0.2, note: 'A4'},
                {beat: 1.5, duration: 0.2, note: 'A4'},
                {beat: 2, duration: 0.2, note: 'A4'},
                {beat: 3, duration: 0.2, note: 'A4'},
                {beat: 4, duration: 0.2, note: 'A4'},
                {beat: 5, duration: 0.2, note: 'A4'},
                {beat: 6, duration: 0.2, note: 'A4'},
                {beat: 6.5, duration: 0.2, note: 'A4'},
            ],
        },
    ],
};
