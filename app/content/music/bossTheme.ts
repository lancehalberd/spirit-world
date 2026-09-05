import {musicTrackHash} from 'app/utils/music/musicTrackHash';

// A first pass at a boss-battle loop: driving four-on-the-floor kick + backbeat snare,
// a syncopated (3-3-2 "tresillo") bass ostinato, and a zeldaSquare lead riff, all in
// A Phrygian (A Bb C D E F G) for the half-step A-Bb tension that's a common "villain" cue.
// Play with `playMusicTrack('bossTheme')`, stop with `stopMusicTrack()`.
musicTrackHash.bossTheme = {
    key: 'bossTheme',
    bpm: 150,
    loop: true,
    parts: [
        {
            instrument: 'kick',
            beats: 0.5,
            note: 'A1',
            notes: [
                {beat: 0},
                {beat: 1},
                {beat: 2},
                {beat: 3},
                {beat: 4},
                {beat: 5},
                {beat: 6},
                {beat: 7},
                // Pickup hit driving back into the top of the loop.
                {beat: 7.5, beats: 0.5},
            ],
        },
        {
            instrument: 'snare',
            volume: 0.5,
            notes: [
                {beat: 1, beats: 0.15, note: 'G3'},
                {beat: 3, beats: 0.15, note: 'G3'},
                {beat: 5, beats: 0.15, note: 'G3'},
                {beat: 7, beats: 0.15, note: 'G3'},
            ],
        },
        {
            instrument: 'hihat',
            volume: 0.5,
            duration: .05,
            note: 'C6',
            notes: [
                {beat: 0},
                {beat: 0.5},
                {beat: 1},
                {beat: 1.5},
                {beat: 2},
                {beat: 2.5},
                {beat: 3},
                {beat: 3.5},
                {beat: 4},
                {beat: 4.5},
                {beat: 5},
                {beat: 5.5},
                {beat: 6},
                {beat: 6.5},
                {beat: 7},
                {beat: 7.5},
            ],
        },
        {
            instrument: 'bass',
            volume: 0.5,
            notes: [
                // 3-3-2 eighth-note grouping ("tresillo") per bar, outlining the A Phrygian tonic and bVII/bII.
                {beat: 0, beats: 1.5, note: 'A2'},
                {beat: 1.5, beats: 1.5, note: 'A2'},
                {beat: 3, beats: 1, note: 'G2'},
                {beat: 4, beats: 1.5, note: 'A2'},
                {beat: 5.5, beats: 1.5, note: 'As2'},
                {beat: 7, beats: 1, note: 'G2'},
            ],
        },
        {
            instrument: 'zeldaSquare',
            volume: 0.5,
            notes: [
                {beat: 0, beats: 0.5, note: 'A4'},
                {beat: 0.5, beats: 0.25, note: 'G4'},
                {beat: 0.75, beats: 0.25, note: 'A4'},
                {beat: 1, beats: 0.75, note: 'C5'},
                {beat: 1.75, beats: 0.25, note: 'As4'},
                {beat: 2, beats: 1, note: 'A4'},
                // Beats 3-4 rest, letting the rhythm section carry the bar.
                {beat: 4, beats: 0.5, note: 'A4'},
                {beat: 4.5, beats: 0.25, note: 'G4'},
                {beat: 4.75, beats: 0.25, note: 'F4'},
                {beat: 5, beats: 0.5, note: 'G4'},
                {beat: 5.5, beats: 0.5, note: 'A4'},
                {beat: 6, beats: 0.5, note: 'E4'},
                {beat: 6.5, beats: 0.5, note: 'D4'},
                {beat: 7, beats: 0.25, note: 'E4'},
                {beat: 7.25, beats: 0.25, note: 'F4'},
                // Climbing back up into the loop point.
                {beat: 7.5, beats: 0.5, note: 'G4'},
            ],
        },
    ],
};
