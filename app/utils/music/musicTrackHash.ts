export const musicTrackHash: {[key: string]: MusicTrackDefinition} = {};

declare global {
    export interface NoteEvent {
        // Note name (e.g. 'A4'). Use `frequency` instead for a raw frequency in Hz.
        note?: Note
        // Exact frequency to use if note is not defined.
        frequency?: number
        // Start offset within the part, in quarter-note beats, measured from the start of the part.
        beat: number
        // Length of the note measured in quarter-note beats.
        beats?: number
        // Length of the note, in seconds
        duration?: number
        // 0-1 volume, defaults to the part's volume. Final volume is note.volume * part.volume.
        volume?: number
    }
    // A reusable "subtrack" of notes in its own local beat space (starting at/near beat 0) - the
    // unit a MusicPart's timeline is assembled from (see MusicSectionPlacement). A section is a
    // plain object identity, not a string key lookup: two placements pointing at the *same*
    // MusicSection object are deliberately sharing it (edit one, both change); giving one
    // placement its own independent copy is just handing it a different MusicSection object with
    // the same starting content (see app/development/trackViewer.ts's "detach" operation). `key`
    // is only for display/export (naming the generated const) - it does not need to be unique
    // across a whole track the way object identity does.
    export interface MusicSection {
        key: string
        notes: NoteEvent[]
    }
    // One placement of a MusicSection within a MusicPart's timeline, at `offset` beats from the
    // start of the part (see composePlacements, app/utils/music/composeSections.ts).
    export interface MusicSectionPlacement {
        section: MusicSection
        offset: number
    }
    // A single-instrument voice. Notes are conventionally listed in non-decreasing `beat` order
    // (simultaneous notes/chords are just multiple entries sharing the same `beat`) for
    // readability and export, but the player itself re-scans on every schedule tick and does not
    // require it (see PartPlaybackState in musicTrackPlayer.ts).
    export interface MusicPart {
        instrument: InstrumentName
        // 0-1 mix level for this part, defaults to 1.
        volume?: number
        // The following fields can define default note/frequency/beats/duration for Note Events in this part.
        note?: Note
        frequency?: number
        beats?: number
        duration?: number
        // The flattened notes the player actually schedules from. A part authored directly (no
        // `placements`) always has this populated by hand. A part authored via `placements`
        // instead leaves this unset until something needs it - see populatePartNotes
        // (app/utils/music/composeSections.ts), called once playback of this part's track starts
        // (musicTrackPlayer.ts's playMusicTrack) so the scheduler can rely on it being present by
        // the time it reads it. recomposePart (app/development/trackViewer.ts) refreshes it after
        // an edit to a placement/section. Nothing computes this implicitly on read (no getter) -
        // every populate/refresh is one of those explicit calls.
        notes?: NoteEvent[]
        // Optional authoring structure recording how `notes` was assembled from named,
        // independently-reusable sections - present when a track was authored that way (see
        // spookyTheme.ts) or once the track viewer has opened this part and synthesized one from
        // its flat `notes`. The player never reads this field; it exists purely for editing/export.
        placements?: MusicSectionPlacement[]
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
        // Defaults to the smallest whole number of beats containing every note's start beat
        // (see getTrackEndBeat in musicTrackPlayer.ts) - deliberately independent of note length,
        // so a note can ring past the loop point without lengthening the loop itself.
        loopEndBeat?: number
    }
}
