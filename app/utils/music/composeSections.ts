// A small authoring helper: write a section's notes starting at beat 0, then use this to place
// copies of it wherever needed in a part's full note list - repeated back-to-back (AABB),
// alternating with another section (ABAB), or in any other order. Sections are just plain data
// here, unlike the mp3-based `nextTrack` chain (app/utils/sounds.ts), where each "next" track is
// a separate audio file and repeating a section means having two copies of that file on disk -
// composing note arrays like this has no equivalent limitation, and needs no music-track-player
// engine support: it's resolved once, when the track definition is authored.
export function offsetNotes(notes: NoteEvent[], beatOffset: number): NoteEvent[] {
    return notes.map(note => ({...note, beat: note.beat + beatOffset}));
}

// Flattens an ordered list of section placements into the single notes array a MusicPart's
// `notes` field needs (see MusicSectionPlacement, app/utils/music/musicTrackHash.ts). This is
// the placements-based equivalent of manually writing
// `[...sectionA, ...offsetNotes(sectionB, X), ...]` by hand - used both by track files authored
// directly against named MusicSection objects and by the track viewer, which recomputes a part's
// `notes` this way after any edit to a section or placement.
export function composePlacements(placements: MusicSectionPlacement[]): NoteEvent[] {
    return placements.flatMap(({section, offset}) => offsetNotes(section.notes, offset));
}

// Fills in `part.notes` from `part.placements` if it isn't already set - a plain conditional
// assignment, not a getter, so reading `part.notes` elsewhere is always just a normal field read
// with no hidden computation. Call this at the point something is about to need `part.notes`
// (currently just musicTrackPlayer.ts's playMusicTrack, right before it starts scheduling); once
// populated, `part.notes` stays populated until an edit explicitly invalidates it by reassigning
// it (see recomposePart, app/development/trackViewer.ts, which does the same
// `composePlacements(part.placements)` assignment unconditionally, to force a refresh after a
// section/placement was just edited).
export function populatePartNotes(part: MusicPart): void {
    if (!part.notes) {
        part.notes = composePlacements(part.placements ?? []);
    }
}
