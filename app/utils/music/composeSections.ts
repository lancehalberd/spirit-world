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
