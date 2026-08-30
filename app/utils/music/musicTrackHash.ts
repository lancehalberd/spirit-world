export const musicTrackHash: {[key: string]: MusicTrackDefinition} = {};

declare global {
    export interface NoteEvent {
        // Note name (e.g. 'A4') or raw frequency in Hz. Omit to represent a rest.
        note?: Note | number
        // Start offset within the part, in quarter-note beats, measured from the start of the part.
        beat: number
        // Length of the note, in quarter-note beats.
        duration: number
        // 0-1 volume, defaults to the part's volume. Final volume is note.volume * part.volume.
        volume?: number
    }
    // A single-instrument voice. Notes must be listed in non-decreasing `beat` order; simultaneous
    // notes (chords) are just multiple entries sharing the same `beat`.
    export interface MusicPart {
        instrument: InstrumentName
        // 0-1 mix level for this part, defaults to 1.
        volume?: number
        notes: NoteEvent[]
    }
    export interface MusicTrackDefinition {
        key: string
        bpm: number
        parts: MusicPart[]
        // If set, the track repeats the beat range [loopStartBeat, loopEndBeat) indefinitely once
        // it is first reached, so any beats before loopStartBeat play once as an intro.
        loop?: boolean
        // Defaults to 0.
        loopStartBeat?: number
        // Defaults to the end of the last note across all parts.
        loopEndBeat?: number
    }
}
