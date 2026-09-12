import {musicTrackHash} from 'app/utils/music/musicTrackHash';

const bellNotes0: MusicSection = {
    key: 'bellNotes0',
    notes: [
        {beat: 0, beats: 1, note: 'D4'},
        {beat: 1, beats: 1, note: 'F4'},
        {beat: 2, beats: 1, note: 'G4'},
        {beat: 3, beats: 1, note: 'A4'},
        {beat: 4, beats: 1, note: 'G4'},
        {beat: 5, beats: 1, note: 'F4'},
        {beat: 6, beats: 1, note: 'Cs4'},
        {beat: 7, beats: 1, note: 'F4'},
        {beat: 8, beats: 1, note: 'G4'},
        {beat: 9, beats: 1, note: 'Gs4'},
        {beat: 10, beats: 1, note: 'G4'},
        {beat: 11, beats: 1, note: 'F4'},
        {beat: 12, beats: 1, note: 'C4'},
        {beat: 13, beats: 1, note: 'F4'},
        {beat: 14, beats: 1, note: 'G4'},
        {beat: 15, beats: 1, note: 'Gs4'},
        {beat: 16, beats: 1, note: 'G4'},
        {beat: 17, beats: 1, note: 'F4'},
        {beat: 18, beats: 1, note: 'Cs4'},
        {beat: 19, beats: 1, note: 'F4'},
        {beat: 20, beats: 1, note: 'G4'},
        {beat: 21, beats: 1, note: 'A4'},
        {beat: 22, beats: 1, note: 'G4'},
        {beat: 23, beats: 1, note: 'F4'},
    ],
};
const pianoPlacements: MusicSectionPlacement[] = [
    {section: bellNotes0, offset: 0},
];
const bellNotes1: MusicSection = {
    key: 'bellNotes1',
    notes: [
        {beat: 0, beats: 6, note: 'D3'},
        {beat: 0, beats: 6, note: 'F3'},
        {beat: 0, beats: 6, note: 'A3'},
        {beat: 6, beats: 6, note: 'Cs3'},
        {beat: 6, beats: 6, note: 'E3'},
        {beat: 6, beats: 6, note: 'G3'},
        {beat: 12, beats: 6, note: 'C3'},
        {beat: 12, beats: 6, note: 'Ds3'},
        {beat: 12, beats: 6, note: 'G3'},
        {beat: 18, beats: 6, note: 'C3'},
        {beat: 18, beats: 6, note: 'E3'},
        {beat: 18, beats: 6, note: 'A3'},
    ],
};
const zeldaSquarePlacements: MusicSectionPlacement[] = [
    {section: bellNotes1, offset: 0},
];

musicTrackHash.minorMelody = {
    key: 'minorMelody',
    bpm: 180,
    loop: true,
    parts: [
        {
            instrument: 'piano',
            volume: 1,
            placements: pianoPlacements,
        },
        {
            instrument: 'zeldaSquare',
            volume: 1,
            placements: zeldaSquarePlacements,
        },
    ],
};
