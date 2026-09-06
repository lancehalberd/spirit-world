import {musicTrackHash} from 'app/utils/music/musicTrackHash';

// A reflective solo-piano piece: an 8-beat intro (plays once) into two contrasting 16-beat
// sections that alternate (ABAB...) once the loop starts. Section A sits in A minor with
// sustained block chords under a mostly-stepwise melody; section B moves to the relative major
// (C major) with a brighter arpeggiated accompaniment, before its last chord (F) leads back into
// A minor for the loop. A and C major share a key signature, so the A<->B pivot needs no
// accidentals - deliberately easy to make sound intentional rather than jarring.
// Two piano voices ("melody" and "accompaniment") are just two MusicParts both using the
// `piano` instrument - the note/track system has no separate notion of "one polyphonic
// instrument," each simultaneous voice is its own part.
//
// Authored as named MusicSection objects placed into each part's timeline (see
// MusicSection/MusicSectionPlacement, app/utils/music/musicTrackHash.ts) so the track viewer
// (app/development/trackViewer.ts) can show/edit each section instead of one flat note list.

const introMelody: MusicSection = {
    key: 'introMelody',
    notes: [
        {beat: 4.5, beats: 1, note: 'C5'},
        {beat: 6, beats: 0.5, note: 'A4'},
        {beat: 6.5, beats: 0.5, note: 'G4'},
        {beat: 7, beats: 1, note: 'F4'},
    ],
};
const introAccompaniment: MusicSection = {
    key: 'introAccompaniment',
    notes: [
        {beat: 0, beats: 0.5, note: 'A2'},
        {beat: 0.5, beats: 0.5, note: 'E3'},
        {beat: 1, beats: 0.5, note: 'A3'},
        {beat: 1.5, beats: 0.5, note: 'E3'},
        {beat: 2, beats: 0.5, note: 'A2'},
        {beat: 2.5, beats: 0.5, note: 'E3'},
        {beat: 3, beats: 0.5, note: 'A3'},
        {beat: 3.5, beats: 0.5, note: 'E3'},
        {beat: 4, beats: 0.5, note: 'F2'},
        {beat: 4.5, beats: 0.5, note: 'C3'},
        {beat: 5, beats: 0.5, note: 'F3'},
        {beat: 5.5, beats: 0.5, note: 'C3'},
        {beat: 6, beats: 0.5, note: 'F2'},
        {beat: 6.5, beats: 0.5, note: 'C3'},
        {beat: 7, beats: 0.5, note: 'F3'},
        {beat: 7.5, beats: 0.5, note: 'C3'},
    ],
};

// Section A - A minor, i-VI-III-VII, sustained pad under a stepwise melody.
const sectionAMelody: MusicSection = {
    key: 'sectionAMelody',
    notes: [
        {beat: 0, beats: 1, note: 'C5'},
        {beat: 1, beats: 0.5, note: 'B4'},
        {beat: 1.5, beats: 0.5, note: 'A4'},
        {beat: 2, beats: 1, note: 'G4'},
        {beat: 3, beats: 1, note: 'A4'},
        {beat: 4, beats: 1, note: 'C5'},
        {beat: 5, beats: 0.5, note: 'A4'},
        {beat: 5.5, beats: 0.5, note: 'G4'},
        {beat: 6, beats: 1, note: 'F4'},
        {beat: 7, beats: 1, note: 'E4'},
        {beat: 8, beats: 0.5, note: 'E4'},
        {beat: 8.5, beats: 0.5, note: 'G4'},
        {beat: 9, beats: 1, note: 'C5'},
        {beat: 10, beats: 0.5, note: 'B4'},
        {beat: 10.5, beats: 0.5, note: 'A4'},
        {beat: 11, beats: 1, note: 'G4'},
        {beat: 12, beats: 0.5, note: 'G4'},
        {beat: 12.5, beats: 0.5, note: 'A4'},
        {beat: 13, beats: 1, note: 'B4'},
        {beat: 14, beats: 1, note: 'A4'},
        {beat: 15, beats: 1, note: 'G4'},
    ],
};
const sectionAAccompaniment: MusicSection = {
    key: 'sectionAAccompaniment',
    notes: [
        {beat: 0, beats: 4, note: 'A2'},
        {beat: 0, beats: 4, note: 'E3'},
        {beat: 4, beats: 4, note: 'F2'},
        {beat: 4, beats: 4, note: 'C3'},
        {beat: 8, beats: 4, note: 'C3'},
        {beat: 8, beats: 4, note: 'G3'},
        {beat: 12, beats: 4, note: 'G2'},
        {beat: 12, beats: 4, note: 'D3'},
    ],
};

// Section B - relative major (C-G-Am-F), arpeggiated accompaniment, brighter melody. The
// closing F chord (bVI in A minor) leads back into section A's A minor opening on the loop.
const sectionBMelody: MusicSection = {
    key: 'sectionBMelody',
    notes: [
        {beat: 0, beats: 1, note: 'G4'},
        {beat: 1, beats: 0.5, note: 'A4'},
        {beat: 1.5, beats: 0.5, note: 'C5'},
        {beat: 2, beats: 1, note: 'E5'},
        {beat: 3, beats: 1, note: 'D5'},
        {beat: 4, beats: 1, note: 'C5'},
        {beat: 5, beats: 0.5, note: 'B4'},
        {beat: 5.5, beats: 0.5, note: 'A4'},
        {beat: 6, beats: 1, note: 'G4'},
        {beat: 7, beats: 1, note: 'D5'},
        {beat: 8, beats: 1, note: 'C5'},
        {beat: 9, beats: 0.5, note: 'B4'},
        {beat: 9.5, beats: 0.5, note: 'A4'},
        {beat: 10, beats: 0.5, note: 'G4'},
        {beat: 10.5, beats: 0.5, note: 'A4'},
        {beat: 11, beats: 1, note: 'C5'},
        {beat: 12, beats: 1, note: 'A4'},
        {beat: 13, beats: 0.5, note: 'G4'},
        {beat: 13.5, beats: 0.5, note: 'F4'},
        {beat: 14, beats: 1, note: 'E4'},
        {beat: 15, beats: 1, note: 'F4'},
    ],
};
const sectionBAccompaniment: MusicSection = {
    key: 'sectionBAccompaniment',
    notes: [
        {beat: 0, beats: 0.5, note: 'C3'},
        {beat: 0.5, beats: 0.5, note: 'G3'},
        {beat: 1, beats: 0.5, note: 'C4'},
        {beat: 1.5, beats: 0.5, note: 'G3'},
        {beat: 2, beats: 0.5, note: 'C3'},
        {beat: 2.5, beats: 0.5, note: 'G3'},
        {beat: 3, beats: 0.5, note: 'C4'},
        {beat: 3.5, beats: 0.5, note: 'G3'},
        {beat: 4, beats: 0.5, note: 'G2'},
        {beat: 4.5, beats: 0.5, note: 'D3'},
        {beat: 5, beats: 0.5, note: 'G3'},
        {beat: 5.5, beats: 0.5, note: 'D3'},
        {beat: 6, beats: 0.5, note: 'G2'},
        {beat: 6.5, beats: 0.5, note: 'D3'},
        {beat: 7, beats: 0.5, note: 'G3'},
        {beat: 7.5, beats: 0.5, note: 'D3'},
        {beat: 8, beats: 0.5, note: 'A2'},
        {beat: 8.5, beats: 0.5, note: 'E3'},
        {beat: 9, beats: 0.5, note: 'A3'},
        {beat: 9.5, beats: 0.5, note: 'E3'},
        {beat: 10, beats: 0.5, note: 'A2'},
        {beat: 10.5, beats: 0.5, note: 'E3'},
        {beat: 11, beats: 0.5, note: 'A3'},
        {beat: 11.5, beats: 0.5, note: 'E3'},
        {beat: 12, beats: 0.5, note: 'F2'},
        {beat: 12.5, beats: 0.5, note: 'C3'},
        {beat: 13, beats: 0.5, note: 'F3'},
        {beat: 13.5, beats: 0.5, note: 'C3'},
        {beat: 14, beats: 0.5, note: 'F2'},
        {beat: 14.5, beats: 0.5, note: 'C3'},
        {beat: 15, beats: 0.5, note: 'F3'},
        {beat: 15.5, beats: 0.5, note: 'C3'},
    ],
};

const INTRO_LENGTH = 8;
const SECTION_LENGTH = 16;

const melodyPlacements: MusicSectionPlacement[] = [
    {section: introMelody, offset: 0},
    {section: sectionAMelody, offset: INTRO_LENGTH},
    {section: sectionBMelody, offset: INTRO_LENGTH + SECTION_LENGTH},
];
const accompanimentPlacements: MusicSectionPlacement[] = [
    {section: introAccompaniment, offset: 0},
    {section: sectionAAccompaniment, offset: INTRO_LENGTH},
    {section: sectionBAccompaniment, offset: INTRO_LENGTH + SECTION_LENGTH},
];

// Play with `playMusicTrack('memoryTheme')`, stop with `stopMusicTrack()`. To try AABB instead
// of the current ABAB, add another {section: sectionX..., offset: ...} placement per part at the
// appropriate beat offset and extend loopEndBeat to match - no player/engine changes needed,
// sections are just data (or just do this from the track viewer, app/development/trackViewer.ts).
musicTrackHash.memoryTheme = {
    key: 'memoryTheme',
    bpm: 84,
    loop: true,
    loopStartBeat: INTRO_LENGTH,
    parts: [
        {instrument: 'piano', volume: 1, placements: melodyPlacements},
        {instrument: 'piano', volume: 0.8, placements: accompanimentPlacements},
    ],
};
