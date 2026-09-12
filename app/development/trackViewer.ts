import {editingState} from 'app/development/editingState';
import {tagElement} from 'app/dom';
import {exportMusicTrackToClipboard, toIdentifier} from 'app/development/exportMusicTrack';
import {getState} from 'app/state';
import {instruments} from 'app/utils/instruments/instrumentHash';
import {playNote} from 'app/utils/instruments/instrumentPlayer';
import {noteFrequencies, notes} from 'app/utils/noteFrequencies';
import {composePlacements} from 'app/utils/music/composeSections';
import {audioContext, fadeOutPlayingTracks, trackViewerGainNode} from 'app/utils/sounds';
import {musicTrackHash} from 'app/utils/music/musicTrackHash';
import {
    getMusicTrackPlaybackPosition, isMusicTrackPaused, pauseMusicTrack, playMusicTrack,
    resumeMusicTrack, seekMusicTrackPlayback, setPlaybackMutedParts, stopMusicTrack,
} from 'app/utils/music/musicTrackPlayer';

// A piano-roll style debug/editing tool for note-based music tracks
// (app/utils/music/musicTrackHash.ts), so a track can be inspected/heard part-by-part and fixed
// up directly instead of guessing from ear alone what's wrong. Supports: viewing all parts on a
// shared beat/pitch grid with a live playhead (drag the loop ruler bar to seek it), hiding/muting
// individual parts, adding/selecting/dragging/resizing/deleting/copying notes (single or
// multi-selected - see the SELECTION comment below), and exporting the track back out as pasteable
// TS source.
//
// Opened/closed with shift+M while the level editor is active (see addKeyboardShortcuts.ts).
// While open, editingState.trackViewerKey tells musicController to suppress normal zone/boss BGM
// (see musicController.ts) so the inspected track has the speakers to itself; the track itself
// plays via the normal playMusicTrack/updateMusicTrackPlayback path, untouched by that gate.
//
// SECTIONS: a MusicPart's playable `notes` are (re)computed from `part.placements` - an ordered
// list of {section, offset} entries, each section a small reusable "subtrack" of notes in its own
// local beat space (see MusicSection/MusicSectionPlacement, musicTrackHash.ts). Two placements can
// point at the *same* MusicSection object (spookyTheme.ts's `themeMelody` is placed twice) - edit
// one, both update, since it's the same object. A part with no placements yet (i.e. authored as a
// flat note array) gets a single default placement synthesized the first time it's opened here
// (see normalizeTrackPlacements) so every part always has *some* section to add notes into.
//
// SELECTION: click-drag on empty grid space draws a rectangle and selects every note it overlaps
// (see selectionDragState/onDocumentSelectionDragMove); a plain click with no drag just selects
// whatever single note (if any) is under the cursor, same as before multi-select existed. Selection
// is restricted to a single part for now (selectedPartIndex/selectedNotes) - rectangle-selecting
// always reads from the *active* part, matching what right-click-add and the section toolbar act
// on. Dragging any already-selected note moves the whole selection together (see the `group` field
// on DragState); copy/cut/paste (see copySelectedNotes/pasteClipboardNotes) always reads from the
// selection's part and always writes into whatever part is active at paste time, not back into the
// note's original part - the natural next step (multi-part selection, paste-back-to-origin) is the
// same shape as the tile-layer copy/paste problem elsewhere in the editor, deferred for now since
// this tool only supports single-part selection.
//
// Seeking the playhead used to be a click-drag on the grid itself; that gesture now belongs to
// rectangle-select, so seeking moved to the loop-range ruler bar instead (any click there that
// isn't on one of its two drag handles - see renderLoopRuler).
//
// LIVE EDITING: note add/delete/move/resize never restarts playback. musicTrackPlayer's scheduler
// re-scans each part's notes by beat every tick rather than trusting a persisted index (see
// PartPlaybackState in musicTrackPlayer.ts), specifically so replacing `part.notes` out from under
// a running playback - which is exactly what recomposePart does after every edit - can't desync
// it: already-scheduled notes finish playing, and the next tick just picks up whatever the array
// now contains.

const ROW_HEIGHT = 14;
const RULER_HEIGHT = 16;
const LOOP_RULER_HEIGHT = 14;
const PIANO_KEYS_WIDTH = 64;
// Smallest allowed gap between loopStartBeat and loopEndBeat when dragging their handles - purely
// to keep the loop from collapsing to zero/negative length, not a musically meaningful minimum.
const LOOP_MIN_GAP_BEATS = 1;
const ZOOM_MIN = 4;
const ZOOM_MAX = 64;
const ZOOM_STEP = 4;
// New/dragged notes snap to a sixteenth-note grid - fine precision is still available by typing
// exact values into the beat/length inputs in the edit row.
const BEAT_SNAP = 0.25;
const MIN_NOTE_BEATS = 0.05;
// A dragged note only resizes within this many px of its left/right edge, and only moves in the
// middle - with an unconditional >=5px-from-center "always move" band so short notes never lose
// the ability to be moved just because their edges are close together.
const RESIZE_EDGE_PX = 4;
const RESIZE_CENTER_EXCLUSION_PX = 5;
// Always-blank beats rendered past the last actual content (or the loop end, whichever is
// further), so there's somewhere to right-click-add a note when extending the final section of a
// part or track - unlike a gap *between* two sections (see the toolbar's "insert beats"), nothing
// mechanically marks where the last section "ends", so this is the only room to grow into without
// first adding a note somewhere else to stake out the space.
const TRAILING_BLANK_BEATS = 16;
// Minimum vertical range always shown (chromatic index, see notes/noteFrequencies.ts) - C2 to C6,
// four octaves - regardless of whether the track has any notes in it yet. A fixed floor rather
// than shrinking to fit content (which used to make the window shrink vertically the moment a
// first note was placed) - vertical space is cheap here, so there's little benefit to a tighter
// fit, and a stable range is less disorienting to work in than one that resizes under you. Actual
// content is still allowed to widen *beyond* this floor (see the Math.min/max below) - it's a
// minimum, not a hard clamp.
const DEFAULT_MIN_PITCH_INDEX = 24;
const DEFAULT_MAX_PITCH_INDEX = 72;
// How strongly to dim a note that isn't in the *active part's* active section (see
// getActivePlacement/drawGridContents) - every other part's notes are dimmed unconditionally, since
// only one part/section pair is ever "active" at a time. A visual cue so a note that's technically
// in the wrong section (e.g. pasted/added while a different section was intended) stands out as an
// outlier rather than blending in, since a single such note can otherwise silently balloon that
// section's ruler band and playhead-match range (see getPlacementBeatRange) far beyond where it
// actually belongs.
const INACTIVE_SECTION_ALPHA = 0.35;
const PART_COLORS = [
    '#4FC3F7', '#FF8A65', '#AED581', '#BA68C8',
    '#FFD54F', '#4DB6AC', '#F06292', '#90A4AE',
];

let panelElement: HTMLElement = null;
let scrollElement: HTMLElement = null;
let playheadElement: HTMLElement = null;
let positionLabel: HTMLElement = null;
let zoomLabel: HTMLElement = null;
let sectionNameInput: HTMLInputElement = null;
// {element, placement} for every band currently drawn in the active part's ruler, so
// refreshSectionIndicator can toggle the highlight each frame without a full renderPanel.
let rulerBandElements: {element: HTMLElement, placement: MusicSectionPlacement}[] = [];

// Loop-range drag handles (see renderLoopRuler) - live-updated during a drag without a full
// renderPanel, same reasoning as the note-drag path.
let loopStartHandle: HTMLElement = null;
let loopEndHandle: HTMLElement = null;
let loopRegionElement: HTMLElement = null;
// Which handle (if any) is currently being dragged, and the loop-end value to fall back to while
// dragging if the track has never had an explicit loopEndBeat (see getEffectiveLoopBounds).
let loopDragMode: 'start' | 'end' = null;
let loopDragDefaultEnd = 0;

// Whether the mouse is held down over the piano keyboard sidebar, so notes can be auditioned by
// dragging across keys (to find a pitch by ear) in addition to a plain click - see renderPianoKeys.
let isPianoKeyPointerDown = false;

let pixelsPerBeat = 32;
// Tracked so renderPanel can rescale a preserved scroll position when zoom changes - otherwise the
// same raw scrollLeft would point at a different beat after pixelsPerBeat changes.
let lastPixelsPerBeat = pixelsPerBeat;
// Whether the horizontal scroll should keep following the playhead. Turned off the moment the user
// scrolls manually (see the 'scroll' listener in renderPanel), turned back on with a fresh resume.
let followPlayhead = true;
// Set right before a programmatic scrollLeft change so the 'scroll' listener can tell it apart
// from the user grabbing the scrollbar/trackpad-scrolling, which is what should actually disable
// followPlayhead.
let isAutoScrolling = false;
// Seeded once, the first time the viewer is opened, from the game's current (unmuted) music
// volume - see openTrack. The slider in the header can move it independently after that.
let trackViewerVolumeInitialized = false;

// View/audition/editing state for the currently open track - reset whenever a different track is
// opened (see openTrack).
let hiddenPartIndices: Set<number> = new Set();
let mutedPartIndices: Set<number> = new Set();
let activePartIndex = 0;
// Which placement (by index into that part's `placements` array) new notes get added to and the
// section toolbar (new/duplicate/detach/remove/rename) acts on, per part.
let activePlacementIndexByPart: Map<number, number> = new Map();
// The part every currently-selected note belongs to, and the selected notes themselves (empty when
// nothing's selected) - see the file-level SELECTION comment. Always use clearSelection() to empty
// this rather than assigning selectedNotes = [] directly, so selectedPartIndex stays in sync.
let selectedPartIndex: number = null;
let selectedNotes: NoteEvent[] = [];
// Notes copied/cut via copySelectedNotes/cutSelectedNotes, beat-shifted so the earliest one is at
// beat 0 - pasteClipboardNotes re-anchors them at the current playhead position in whatever part is
// active at paste time. Deliberately not reset by openTrack/closeTrackViewer - a copy should survive
// switching tracks, same as a real clipboard.
let noteClipboard: NoteEvent[] = [];

function clearSelection(): void {
    selectedPartIndex = null;
    selectedNotes = [];
}

interface NoteHitRegion {
    partIndex: number
    placement: MusicSectionPlacement
    note: NoteEvent
    x: number
    y: number
    w: number
    h: number
}
// Rebuilt every time the grid is drawn; used to hit-test clicks/drags against drawn notes.
let noteHitRegions: NoteHitRegion[] = [];

interface DragState {
    mode: 'move' | 'resize-left' | 'resize-right'
    partIndex: number
    placement: MusicSectionPlacement
    note: NoteEvent
    part: MusicPart
    startCanvasX: number
    startCanvasY: number
    startBeat: number
    startBeats: number
    startPitchIndex: number
    // The pitch index last auditioned (see auditionNote) during this drag, so a 'move' drag only
    // replays the note when the pitch actually changes rather than on every mousemove tick.
    lastAuditionedPitchIndex: number
    moved: boolean
    // Present only for a 'move' drag started on a note that's already part of a multi-note
    // selection - every entry (including the dragged note itself) is carried by the same
    // global-beat/pitch delta as the drag progresses (see onDocumentMouseMove), so the whole
    // selection moves together instead of just the note under the cursor. A per-note snapshot
    // rather than reading placement.offset live because different selected notes can belong to
    // different placements (different sections), each with its own offset.
    group?: {note: NoteEvent, placement: MusicSectionPlacement, startGlobalBeat: number, startPitchIndex: number}[]
}
let dragState: DragState = null;

// A rectangle-select drag in progress on empty grid space (see attachCanvasInteractions' mousedown
// and onDocumentSelectionDragMove) - canvas coordinates of the drag's start and current point.
// selectionDragRect is what drawGridContents actually renders each frame; kept separate from
// selectionDragState (which also tracks "is a drag active at all") so a drag that never moves can
// still be told apart from a plain click (see onDocumentSelectionDragUp).
interface SelectionDragState {
    startCanvasX: number
    startCanvasY: number
}
let selectionDragState: SelectionDragState = null;
let selectionDragRect: {x0: number, y0: number, x1: number, y1: number} = null;

// Set while dragging on the loop ruler bar (see renderLoopRuler), so the playhead scrubs
// continuously with the mouse instead of only jumping once on release (see
// onDocumentScrubMove/onDocumentScrubEnd).
let isScrubbingPlayhead = false;

// Cached grid geometry, set once per renderPanel call and reused by the live-drag redraw path
// (redrawGrid) so dragging doesn't have to rebuild the surrounding DOM (legend, ruler, edit row,
// a fresh 108-option pitch <select>, ...) on every mousemove.
let gridCanvas: HTMLCanvasElement = null;
let gridContext: CanvasRenderingContext2D = null;
let gridMinIndex = 0;
let gridMaxIndex = 0;
let gridWidth = 0;
let gridHeight = 0;

export function isTrackViewerOpen(): boolean {
    return !!editingState.trackViewerKey;
}

export function toggleTrackViewer(): void {
    if (editingState.trackViewerKey) {
        closeTrackViewer();
    } else {
        const firstKey = Object.keys(musicTrackHash)[0];
        if (firstKey) {
            openTrack(firstKey);
        }
    }
}

export function closeTrackViewer(): void {
    if (!editingState.trackViewerKey) {
        return;
    }
    editingState.trackViewerKey = undefined;
    stopMusicTrack(0);
    panelElement?.remove();
    panelElement = playheadElement = positionLabel = zoomLabel = scrollElement = sectionNameInput = null;
    gridCanvas = gridContext = null;
    clearSelection();
    dragState = null;
    selectionDragState = null;
    selectionDragRect = null;
    noteHitRegions = [];
    rulerBandElements = [];
    loopStartHandle = loopEndHandle = loopRegionElement = null;
    loopDragMode = null;
}

// Ensures every part of `definition` has a `placements` list, synthesizing a single default
// section+placement from any part that's still just a flat note array (i.e. one authored the old
// way, or one never opened in this tool before) so there's always *some* section to add notes
// into. Doesn't touch `part.notes` - the viewer reads placements/sections directly for display
// (see renderPanel/drawGridContents), and playback populates `notes` itself on demand (see
// populatePartNotes, composeSections.ts) - so there's nothing here that needs it. Safe to call
// repeatedly.
function normalizeTrackPlacements(definition: MusicTrackDefinition): void {
    definition.parts.forEach((part, i) => {
        if (!part.placements || !part.placements.length) {
            const section: MusicSection = {key: `${part.instrument}Notes${i}`, notes: part.notes ?? []};
            part.placements = [{section, offset: 0}];
        }
    });
}

// Removes a whole MusicPart and re-keys every bit of per-part-index state (hidden/muted sets,
// the active-placement-per-part map, the current selection, activePartIndex itself) so it still
// points at the same *parts* afterward - removing part N shifts every later part's index down by
// one, and nothing above would otherwise know to follow along. Does not restart playback itself -
// see the restartPlaybackPreservingPosition call at this function's call site.
function removePartAt(definition: MusicTrackDefinition, partIndex: number): void {
    definition.parts.splice(partIndex, 1);
    hiddenPartIndices = reindexSetAfterRemoval(hiddenPartIndices, partIndex);
    mutedPartIndices = reindexSetAfterRemoval(mutedPartIndices, partIndex);
    // setPlaybackMutedParts attaches the Set *by reference* to the live playback - reindexing just
    // above created a new Set object, so it has to be reattached or the live playback would keep
    // muting by the old (now-stale) indices until the next restart.
    setPlaybackMutedParts(mutedPartIndices);
    const reindexedPlacements = new Map<number, number>();
    for (const [index, value] of activePlacementIndexByPart) {
        if (index < partIndex) {
            reindexedPlacements.set(index, value);
        } else if (index > partIndex) {
            reindexedPlacements.set(index - 1, value);
        }
    }
    activePlacementIndexByPart = reindexedPlacements;
    if (selectedPartIndex != null) {
        if (selectedPartIndex === partIndex) {
            clearSelection();
        } else if (selectedPartIndex > partIndex) {
            selectedPartIndex -= 1;
        }
    }
    activePartIndex = Math.max(0, Math.min(activePartIndex, definition.parts.length - 1));
}

function reindexSetAfterRemoval(indices: Set<number>, removedIndex: number): Set<number> {
    const result = new Set<number>();
    for (const index of indices) {
        if (index < removedIndex) {
            result.add(index);
        } else if (index > removedIndex) {
            result.add(index - 1);
        }
    }
    return result;
}

// Creates a new, empty track (no parts yet - see the legend's "+ Part" button) and opens it.
function createNewTrack(): void {
    const name = window.prompt('New track name:', 'newTrack');
    if (!name) {
        return;
    }
    // Track keys end up as a `musicTrackHash.<key>` property access both live and in exported
    // source (see exportMusicTrack.ts), so this needs to be a valid identifier, not just unique.
    const usedKeys = new Set(Object.keys(musicTrackHash));
    const baseKey = toIdentifier(name);
    let key = baseKey;
    let suffix = 2;
    while (usedKeys.has(key)) {
        key = `${baseKey}${suffix++}`;
    }
    musicTrackHash[key] = {
        key,
        bpm: 120,
        loop: true,
        // A track can't hold any content without at least one part - see createPart.
        parts: [createPart()],
    };
    openTrack(key);
}

// A freshly created MusicPart, with no placements yet (normalizeTrackPlacements synthesizes an
// empty default section for it the moment the track is opened/re-rendered). Shared by
// createNewTrack and the legend's "+ Part" button.
function createPart(): MusicPart {
    const defaultInstrument = (Object.keys(instruments)[0] ?? 'piano') as InstrumentName;
    return {instrument: defaultInstrument, volume: 1, placements: []};
}

function openTrack(key: string): void {
    stopMusicTrack(0);
    // Also silence any mp3-based BGM that happened to already be playing.
    fadeOutPlayingTracks();
    if (!trackViewerVolumeInitialized) {
        trackViewerVolumeInitialized = true;
        // Seed the editor's independent volume from the game's own (unmuted) music volume, so it
        // starts somewhere reasonable instead of always defaulting to full volume; the slider in
        // the header can move it from there without touching the game's own settings.
        const settings = getState().settings;
        trackViewerGainNode.gain.value = (settings.globalVolume ?? 1) * (settings.musicVolume ?? 1);
    }
    editingState.trackViewerKey = key;
    hiddenPartIndices = new Set();
    mutedPartIndices = new Set();
    activePartIndex = 0;
    activePlacementIndexByPart = new Map();
    clearSelection();
    dragState = null;
    selectionDragState = null;
    selectionDragRect = null;
    followPlayhead = true;
    // So renderPanel's scroll-position-preservation starts fresh at 0 for the newly opened track
    // instead of carrying over wherever the previous track happened to be scrolled to.
    scrollElement = null;
    normalizeTrackPlacements(musicTrackHash[key]);
    // Started (and immediately paused) before renderPanel so the very first render already shows
    // the correct paused play/pause button state instead of a stale one from the previous track.
    startPlayback(key);
    renderPanel();
}

// Starts playback and (re)attaches the mute set - a fresh call to playMusicTrack always creates a
// new playback with its own empty mute set, so this needs to run after every restart, not just
// once per track-open. Always starts paused (see pauseMusicTrack call below) - opening a track (or
// switching to a different one) shouldn't immediately start making noise; space/the play button
// resumes it.
function startPlayback(key: string): void {
    playMusicTrack(key, {fadeDuration: 0, destination: trackViewerGainNode});
    setPlaybackMutedParts(mutedPartIndices);
    pauseMusicTrack(0);
}

// Restarts playback from scratch while preserving the current position and paused/playing state.
// Needed specifically for structural changes to the parts array itself (adding/removing a whole
// MusicPart, or changing bpm/loop bounds) - a live playback can't pick those up on its own, since
// musicTrackPlayer snapshots definition.parts (and bpm-derived secondsPerBeat, and loop bounds)
// into its own scheduling state once, at playMusicTrack time (see TrackPlaybackState in
// musicTrackPlayer.ts). Mutating fields *within* an existing part (notes, instrument, placements'
// offsets) doesn't need this - the scheduler already reads those fresh every tick.
function restartPlaybackPreservingPosition(key: string): void {
    const wasPaused = isMusicTrackPaused();
    const rawBeat = getMusicTrackPlaybackPosition()?.rawBeat ?? 0;
    stopMusicTrack(0);
    startPlayback(key);
    seekMusicTrackPlayback(rawBeat);
    if (!wasPaused) {
        resumeMusicTrack(0);
    }
}

// Toggles play/pause for whatever track is currently open - bound to the header button and the
// space hotkey (see addKeyboardShortcuts.ts). A fresh resume re-enables auto-scroll-to-playhead
// (see followPlayhead) in case the user turned it off by scrolling manually during a previous play.
export function toggleTrackViewerPlayback(): void {
    if (!editingState.trackViewerKey) {
        return;
    }
    if (isMusicTrackPaused()) {
        followPlayhead = true;
        resumeMusicTrack(0);
    } else {
        pauseMusicTrack(0);
    }
    renderPanel();
}

function snapBeat(beat: number): number {
    return Math.round(beat / BEAT_SNAP) * BEAT_SNAP;
}

// Floors (not rounds) to the grid, used only when placing a brand-new note (see the contextmenu
// handler in attachCanvasInteractions) - as long as the grid isn't wider than the note's own length
// (see getSnapGridForDuration, which guarantees this), flooring keeps the note's start at or before
// the click, so the cursor always ends up inside the note it just placed rather than to its right.
function floorBeatToGrid(beat: number, grid: number): number {
    return Math.floor(beat / grid) * grid;
}

// Picks a default length for a brand-new note by borrowing from whatever's nearby in the same
// section (in local-beat terms, same space as placement.section.notes) rather than always falling
// back to a fixed length regardless of context - continuing the previous note's rhythm is far more
// often what's wanted than an arbitrary default. Prefers the nearest *preceding* note (continuing
// forward makes more sense than picking up whatever comes after); falls back to the nearest
// following note if nothing precedes the click (an empty section, or clicking before its first
// note); falls back to the part's own default length if the section has no notes at all yet.
function getDefaultNewNoteBeats(part: MusicPart, placement: MusicSectionPlacement, localBeat: number, bpm: number): number {
    let preceding: NoteEvent = null;
    let following: NoteEvent = null;
    for (const note of placement.section.notes) {
        if (note.beat <= localBeat) {
            if (!preceding || note.beat > preceding.beat) {
                preceding = note;
            }
        } else if (!following || note.beat < following.beat) {
            following = note;
        }
    }
    const reference = preceding ?? following;
    return reference ? getNoteBeats(reference, part, bpm) : (part.beats ?? 1);
}

// Half the new note's own (default) length, per the idea that beat-snap precision should scale
// with the note being placed: a run of quarter notes shouldn't invite 16th-note-precision placement
// errors, while a run of 16ths still needs finer-than-16th snapping to land cleanly between them.
// Floored well below MIN_NOTE_BEATS so a very short reference note can't produce a grid finer than
// any note is even allowed to be.
function getSnapGridForDuration(beats: number): number {
    return Math.max(MIN_NOTE_BEATS, beats * 0.5);
}

// Recomputes a part's playable `notes` from its `placements` after any edit. Never restarts
// playback - see the file-level "LIVE EDITING" comment.
function recomposePart(part: MusicPart): void {
    part.notes = composePlacements(part.placements ?? []);
}

function removeNoteFromPart(part: MusicPart, note: NoteEvent): void {
    for (const placement of part.placements ?? []) {
        const index = placement.section.notes.indexOf(note);
        if (index !== -1) {
            placement.section.notes.splice(index, 1);
            return;
        }
    }
}

// Finds whichever placement of `part` currently owns `note`, or null if it's not (any longer) part
// of this part at all - used to resolve each selected note's own offset when starting a group move
// (see DragState.group), since different selected notes can belong to different placements.
function findNotePlacement(part: MusicPart, note: NoteEvent): MusicSectionPlacement | null {
    return (part.placements ?? []).find(placement => placement.section.notes.includes(note)) ?? null;
}

// Deletes every currently-selected note, if any - shared by the edit row's Delete button and the
// delete/backspace hotkey (see addKeyboardShortcuts.ts). A no-op if nothing is selected, so the
// hotkey is safe to wire up unconditionally whenever the track viewer is open.
export function deleteSelectedNotes(): void {
    if (!selectedNotes.length || selectedPartIndex == null) {
        return;
    }
    const definition = musicTrackHash[editingState.trackViewerKey];
    const part = definition.parts[selectedPartIndex];
    if (!part) {
        return;
    }
    for (const note of selectedNotes) {
        removeNoteFromPart(part, note);
    }
    const partIndex = selectedPartIndex;
    clearSelection();
    commitNoteEdit(partIndex);
}

// Copies every currently-selected note (beat-shifted so the earliest is at beat 0) to the note
// clipboard - shared by cutSelectedNotes and the copy hotkey (see addKeyboardShortcuts.ts). A no-op
// if nothing is selected; leaves the existing clipboard contents untouched in that case.
export function copySelectedNotes(): void {
    if (!selectedNotes.length) {
        return;
    }
    const minBeat = Math.min(...selectedNotes.map(note => note.beat));
    noteClipboard = selectedNotes.map(note => ({...note, beat: round3(note.beat - minBeat)}));
}

// Copies then deletes every currently-selected note - the cut hotkey (see addKeyboardShortcuts.ts).
export function cutSelectedNotes(): void {
    if (!selectedNotes.length) {
        return;
    }
    copySelectedNotes();
    deleteSelectedNotes();
}

// Pastes a copy of whatever's in the note clipboard into the *active* part's active placement -
// always the active part, even if the notes were copied from a different one (see the file-level
// SELECTION comment) - anchored so the earliest pasted note lands at the current playhead beat. A
// no-op if the clipboard is empty or there's no active part/placement to paste into. Selects the
// pasted notes afterward so they can be immediately nudged/deleted if the paste needs adjusting.
export function pasteClipboardNotes(): void {
    if (!noteClipboard.length || !editingState.trackViewerKey) {
        return;
    }
    const definition = musicTrackHash[editingState.trackViewerKey];
    const part = definition.parts[activePartIndex];
    const placement = part && getActivePlacement(part);
    if (!part || !placement) {
        return;
    }
    const position = getMusicTrackPlaybackPosition();
    const anchorGlobalBeat = (position && position.key === editingState.trackViewerKey)
        ? snapBeat(position.beat) : 0;
    const pasted: NoteEvent[] = noteClipboard.map(note => {
        const newNote: NoteEvent = {...note, beat: Math.max(0, anchorGlobalBeat + note.beat - placement.offset)};
        placement.section.notes.push(newNote);
        return newNote;
    });
    selectedPartIndex = activePartIndex;
    selectedNotes = pasted;
    commitNoteEdit(activePartIndex);
}

// Resolves which of `part`'s placements is "active" - the target for right-click-add and the
// section toolbar, and what the section-name field/ruler highlight display. Priority: whatever
// section the selected note belongs to (if any - selecting a note pins the display to it), else
// whatever the user last explicitly picked by clicking a ruler band (see renderSectionRuler) or via
// New/Duplicate/Remove in the section toolbar, else whichever section the playhead currently sits
// over (so the display still tracks playback by default when nothing's been explicitly picked),
// else the first placement.
//
// Explicit picks used to rank *below* the playhead match, so clicking a ruler band while the
// playhead happened to be sitting inside a different section had no visible effect - the playhead
// match kept winning every render. A deliberate seek (see the loop ruler's mousedown handler)
// clears every part's explicit pick so playhead-tracking resumes from there, rather than the pick
// being sticky forever the instant any band is ever clicked.
function getActivePlacement(part: MusicPart): MusicSectionPlacement | null {
    if (selectedNotes.length && selectedPartIndex === activePartIndex) {
        // Multiple selected notes can span more than one placement (a rectangle can cover two
        // adjacent sections) - the first one just picks a reasonable placement to display/act on.
        const owning = findNotePlacement(part, selectedNotes[0]);
        if (owning) {
            return owning;
        }
    }
    const explicitIndex = activePlacementIndexByPart.get(activePartIndex);
    if (explicitIndex != null && part.placements?.[explicitIndex]) {
        return part.placements[explicitIndex];
    }
    const definition = musicTrackHash[editingState.trackViewerKey];
    const position = definition && getMusicTrackPlaybackPosition();
    if (position && position.key === editingState.trackViewerKey) {
        const atPlayhead = (part.placements ?? []).find(placement => {
            const range = getPlacementBeatRange(placement, part, definition.bpm);
            return position.beat >= range.start && position.beat < range.end;
        });
        if (atPlayhead) {
            return atPlayhead;
        }
    }
    return part.placements?.[0] ?? null;
}

// The [start, end) global-beat range a placement's notes actually occupy. Deliberately NOT
// [offset, offset + max local beat): a section's own local beat values don't necessarily start at
// 0 - spookyTheme.ts's `themeMelody` is authored with local beats starting at 32 (matching where
// it always sat in the original flat file) rather than renumbered to start at 0, so a section like
// that placed at offset 0 actually occupies global beats [32, 64), not [0, 64). Getting this wrong
// previously made that placement's ruler band (and its playhead-match range in getActivePlacement)
// stretch back to cover the *previous* section's band entirely, hiding it.
function getPlacementBeatRange(placement: MusicSectionPlacement, part: MusicPart, bpm: number): {start: number, end: number} {
    if (!placement.section.notes.length) {
        return {start: placement.offset, end: placement.offset};
    }
    let minLocalBeat = Infinity;
    let maxLocalBeat = 0;
    for (const note of placement.section.notes) {
        minLocalBeat = Math.min(minLocalBeat, note.beat);
        maxLocalBeat = Math.max(maxLocalBeat, note.beat + getNoteBeats(note, part, bpm));
    }
    return {start: placement.offset + minLocalBeat, end: placement.offset + maxLocalBeat};
}

function getPartEndBeat(part: MusicPart, bpm: number): number {
    if (!part.placements?.length) {
        return 0;
    }
    return Math.max(0, ...part.placements.map(placement => getPlacementBeatRange(placement, part, bpm).end));
}

// "Extends a section": there's no stored length on a section/placement, just wherever its notes
// happen to reach (see getPlacementBeatRange), so making more room for one to grow into means
// mechanically pushing everything *after* it later instead. Inserts `amount` beats of empty room
// at global beat `atGlobalBeat`, shifting every placement in every part that starts at or after
// that point forward by `amount` - except `keepPlacement` itself (the section the room is being
// made after, which never shifts) - and the track's loop boundaries if they fall at or after the
// insertion point too, so the loop doesn't decouple from the content it's supposed to bound. Shifts
// every part, not just the active one, so parts stay in sync with each other.
function insertBeatsIntoTrack(
    definition: MusicTrackDefinition, atGlobalBeat: number, amount: number, keepPlacement: MusicSectionPlacement
): void {
    for (const part of definition.parts) {
        for (const placement of part.placements ?? []) {
            if (placement !== keepPlacement && placement.offset >= atGlobalBeat) {
                placement.offset += amount;
            }
        }
        recomposePart(part);
    }
    if (definition.loopStartBeat != null && definition.loopStartBeat >= atGlobalBeat) {
        definition.loopStartBeat += amount;
    }
    if (definition.loopEndBeat != null && definition.loopEndBeat >= atGlobalBeat) {
        definition.loopEndBeat += amount;
    }
}

// The loop range actually shown/dragged - loopStartBeat/loopEndBeat are both optional on
// MusicTrackDefinition (an unset end just means "loop after the last beat"), but the ruler needs
// concrete positions to draw handles at. `defaultEnd` (the track's current content end, from
// renderPanel's grid-geometry pass) stands in for an unset loopEndBeat purely for display/initial
// handle position - dragging either handle commits a real value to the definition, same as typing
// into any other field here.
function getEffectiveLoopBounds(definition: MusicTrackDefinition, defaultEnd: number): {start: number, end: number} {
    return {
        start: definition.loopStartBeat ?? 0,
        end: definition.loopEndBeat ?? defaultEnd,
    };
}

// Resolves a note's pitch to a fractional index into `notes` (chromatic, C0 = 0) for vertical
// placement - fractional so a raw `frequency` (rather than a named `note`) still places
// reasonably instead of being skipped.
function getPitchIndex(noteName: Note | undefined, frequency: number | undefined): number | null {
    if (noteName) {
        const index = notes.indexOf(noteName);
        return index >= 0 ? index : null;
    }
    if (frequency) {
        return 12 * Math.log2(frequency / noteFrequencies.C0);
    }
    return null;
}

// Note length in beats, accounting for the `beats`/`duration`(seconds)/part-default fallbacks
// that MusicPart/NoteEvent support (see musicTrackHash.ts).
function getNoteBeats(note: NoteEvent, part: MusicPart, bpm: number): number {
    const beats = note.beats ?? part.beats;
    if (beats) {
        return beats;
    }
    const duration = note.duration ?? part.duration;
    return duration ? duration / (60 / bpm) : 1;
}

// Writes a new length back into whichever field this note was already using (beats vs. seconds),
// defaulting to beats for a brand new note.
function setNoteBeats(note: NoteEvent, beats: number, bpm: number): void {
    if (note.duration != null && note.beats == null) {
        note.duration = beats * (60 / bpm);
    } else {
        note.beats = beats;
    }
}

function round3(value: number): number {
    return Math.round(value * 1000) / 1000;
}

// Hard ceiling on how long an audition (see auditionNote) is ever allowed to sound, regardless of
// what an instrument's own defaultAuditionDuration is set to - previewing a note should never tie
// up the speakers for long, even if some future instrument sets an unreasonably high default.
const MAX_AUDITION_DURATION = 0.5;

// Plays a single note immediately at its own pitch/volume, through the same trackViewerGainNode the
// track's own playback uses - called (most call sites only while paused; the piano keyboard
// sidebar's click-to-play always) whenever an edit gesture (select/create/drag a note, click a
// piano key) should let you hear the pitch you're choosing. Deliberately ignores the note's own
// authored beats/duration - always using the playing part's instrument's own
// defaultAuditionDuration instead (capped at MAX_AUDITION_DURATION) - so previewing a long held
// note doesn't tie up the speakers for its full length.
function auditionNote(note: NoteEvent, part: MusicPart): void {
    const duration = Math.min(instruments[part.instrument]?.defaultAuditionDuration ?? 0.4, MAX_AUDITION_DURATION);
    playNote({
        destination: trackViewerGainNode,
        time: audioContext.currentTime,
        instrument: part.instrument,
        noteOrFrequency: note.note ?? note.frequency ?? part.note ?? part.frequency,
        volume: (note.volume ?? 1) * (part.volume ?? 1),
        duration,
    });
}

function renderPanel(): void {
    // Rescaled (not just carried over) so an existing scroll position still points at roughly the
    // same beat after a zoom change, rather than an arbitrary pixel offset at the new scale.
    const previousScrollLeft = scrollElement ? scrollElement.scrollLeft * (pixelsPerBeat / lastPixelsPerBeat) : 0;
    lastPixelsPerBeat = pixelsPerBeat;
    panelElement?.remove();
    const key = editingState.trackViewerKey;
    const definition = musicTrackHash[key];

    panelElement = tagElement('div', 'track-viewer');

    const header = tagElement('div', 'track-viewer-header');
    const select = document.createElement('select');
    for (const trackKey of Object.keys(musicTrackHash)) {
        const option = document.createElement('option');
        option.value = trackKey;
        option.textContent = trackKey;
        option.selected = trackKey === key;
        select.append(option);
    }
    select.onchange = () => openTrack(select.value);
    header.append(select);

    const newTrackButton = tagElement('button', 'track-viewer-button', 'New Track');
    newTrackButton.title = 'Create a new, empty track and open it';
    newTrackButton.onclick = () => createNewTrack();
    header.append(newTrackButton);

    const bpmInput = document.createElement('input');
    bpmInput.type = 'number';
    bpmInput.min = '1';
    bpmInput.step = '1';
    bpmInput.className = 'track-viewer-edit-number';
    bpmInput.value = `${definition.bpm}`;
    bpmInput.onchange = () => {
        const value = parseFloat(bpmInput.value);
        if (!isNaN(value) && value > 0) {
            definition.bpm = value;
            restartPlaybackPreservingPosition(key);
        }
        renderPanel();
    };
    header.append(labeledControl('bpm', bpmInput));

    const loopToggle = document.createElement('input');
    loopToggle.type = 'checkbox';
    loopToggle.checked = !!definition.loop;
    loopToggle.title = 'Loop this track';
    loopToggle.onchange = () => {
        definition.loop = loopToggle.checked;
        restartPlaybackPreservingPosition(key);
        renderPanel();
    };
    header.append(labeledControl('loop', loopToggle));

    const playPauseButton = tagElement('button', 'track-viewer-button', isMusicTrackPaused() ? '▶' : '⏸');
    playPauseButton.title = 'Play/pause (space)';
    playPauseButton.onclick = () => toggleTrackViewerPlayback();
    header.append(playPauseButton);

    const volumeInput = document.createElement('input');
    volumeInput.type = 'range';
    volumeInput.className = 'track-viewer-volume';
    volumeInput.min = '0';
    volumeInput.max = '1';
    volumeInput.step = '0.05';
    volumeInput.value = `${trackViewerGainNode.gain.value}`;
    volumeInput.title = 'Track viewer volume - independent of the game\'s music volume/mute settings';
    volumeInput.oninput = () => {
        trackViewerGainNode.gain.value = parseFloat(volumeInput.value);
    };
    header.append(volumeInput);

    const zoomOutButton = tagElement('button', 'track-viewer-button', '−');
    zoomOutButton.title = 'Zoom out (narrower beats)';
    zoomOutButton.onclick = () => {
        pixelsPerBeat = Math.max(ZOOM_MIN, pixelsPerBeat - ZOOM_STEP);
        renderPanel();
    };
    header.append(zoomOutButton);
    zoomLabel = tagElement('span', 'track-viewer-zoom-label', `${pixelsPerBeat}px/beat`);
    header.append(zoomLabel);
    const zoomInButton = tagElement('button', 'track-viewer-button', '+');
    zoomInButton.title = 'Zoom in (wider beats)';
    zoomInButton.onclick = () => {
        pixelsPerBeat = Math.min(ZOOM_MAX, pixelsPerBeat + ZOOM_STEP);
        renderPanel();
    };
    header.append(zoomInButton);

    const exportButton = tagElement('button', 'track-viewer-button', 'Export');
    exportButton.title = 'Copy this track as TS source to the clipboard';
    exportButton.onclick = () => exportMusicTrackToClipboard(definition);
    header.append(exportButton);
    positionLabel = tagElement('span', 'track-viewer-position');
    header.append(positionLabel);
    const closeButton = tagElement('button', 'track-viewer-button', '×');
    closeButton.onclick = () => closeTrackViewer();
    header.append(closeButton);
    panelElement.append(header);

    const legend = tagElement('div', 'track-viewer-legend');
    definition.parts.forEach((part, i) => {
        const item = tagElement('div', 'track-viewer-legend-item');
        const isHidden = hiddenPartIndices.has(i);
        const isMuted = mutedPartIndices.has(i);
        if (i === activePartIndex) {
            item.classList.add('is-active');
        }
        item.title = 'Click to make this the active part (right-click-to-add and the section toolbar act on it)';
        item.onclick = () => {
            activePartIndex = i;
            renderPanel();
        };

        const visibleToggle = tagElement('button', 'track-viewer-toggle', isHidden ? '🚫' : '👁');
        visibleToggle.title = isHidden ? 'Show notes on the grid' : 'Hide notes on the grid';
        visibleToggle.onclick = (event) => {
            event.stopPropagation();
            isHidden ? hiddenPartIndices.delete(i) : hiddenPartIndices.add(i);
            renderPanel();
        };
        item.append(visibleToggle);

        const muteToggle = tagElement('button', 'track-viewer-toggle', isMuted ? '🔇' : '🔊');
        muteToggle.title = isMuted ? 'Unmute' : 'Mute';
        muteToggle.onclick = (event) => {
            event.stopPropagation();
            isMuted ? mutedPartIndices.delete(i) : mutedPartIndices.add(i);
            renderPanel();
        };
        item.append(muteToggle);

        const swatch = tagElement('span', 'track-viewer-swatch');
        swatch.style.backgroundColor = PART_COLORS[i % PART_COLORS.length];
        item.append(swatch);

        const instrumentSelect = document.createElement('select');
        instrumentSelect.className = 'track-viewer-instrument-select';
        for (const instrumentName of Object.keys(instruments) as InstrumentName[]) {
            const option = document.createElement('option');
            option.value = instrumentName;
            option.textContent = instrumentName;
            option.selected = instrumentName === part.instrument;
            instrumentSelect.append(option);
        }
        instrumentSelect.title = "Change this part's instrument";
        // Mutating part.instrument directly is picked up live by the scheduler on the very next
        // note (see PartPlaybackState in musicTrackPlayer.ts) - no restart needed, unlike
        // add/remove-part below.
        instrumentSelect.onclick = (event) => event.stopPropagation();
        instrumentSelect.onchange = (event) => {
            event.stopPropagation();
            part.instrument = instrumentSelect.value as InstrumentName;
            renderPanel();
        };
        item.append(instrumentSelect);
        if (part.volume != null) {
            item.append(document.createTextNode(` (${part.volume})`));
        }

        const deletePartButton = tagElement('button', 'track-viewer-toggle', '🗑');
        deletePartButton.title = 'Remove this part';
        deletePartButton.onclick = (event) => {
            event.stopPropagation();
            if (!window.confirm(`Remove the "${part.instrument}" part? This can't be undone.`)) {
                return;
            }
            removePartAt(definition, i);
            restartPlaybackPreservingPosition(key);
            renderPanel();
        };
        item.append(deletePartButton);

        if (isHidden) {
            item.classList.add('is-hidden');
        }
        if (isMuted) {
            item.classList.add('is-muted');
        }
        legend.append(item);
    });
    const addPartButton = tagElement('button', 'track-viewer-button', '+ Part');
    addPartButton.title = 'Add a new part';
    addPartButton.onclick = () => {
        definition.parts.push(createPart());
        activePartIndex = definition.parts.length - 1;
        normalizeTrackPlacements(definition);
        restartPlaybackPreservingPosition(key);
        renderPanel();
    };
    legend.append(addPartButton);
    panelElement.append(legend);

    const activePart = definition.parts[activePartIndex];
    if (activePart) {
        panelElement.append(renderSectionToolbar(activePart, definition.bpm));
    }

    const editRow = renderEditRow(definition);
    if (editRow) {
        panelElement.append(editRow);
    }

    // --- Grid geometry --- computed from placements/sections directly (not part.notes, which
    // isn't populated until something actually plays this track - see populatePartNotes,
    // composeSections.ts) - the viewer never needs `notes` itself.
    let maxNoteBeat = 0;
    // Seeded with the fixed floor (see DEFAULT_MIN/MAX_PITCH_INDEX) rather than +/-Infinity, so
    // content within that range doesn't narrow the view - only content *outside* it grows the
    // view further, via the Math.min/max below.
    let minPitchIndex = DEFAULT_MIN_PITCH_INDEX;
    let maxPitchIndex = DEFAULT_MAX_PITCH_INDEX;
    for (const part of definition.parts) {
        for (const placement of part.placements ?? []) {
            for (const note of placement.section.notes) {
                const globalBeat = note.beat + placement.offset;
                maxNoteBeat = Math.max(maxNoteBeat, globalBeat + getNoteBeats(note, part, definition.bpm));
                const index = getPitchIndex(note.note ?? part.note, note.frequency ?? part.frequency);
                if (index !== null) {
                    minPitchIndex = Math.min(minPitchIndex, index);
                    maxPitchIndex = Math.max(maxPitchIndex, index);
                }
            }
        }
    }
    // TRAILING_BLANK_BEATS beyond the last actual content/loop end - see its own comment - so
    // there's always room to add a note past the end of the final section, not just in gaps
    // between sections (which "insert beats" already covers).
    const maxBeat = Math.max(definition.loopEndBeat ?? 0, maxNoteBeat) + TRAILING_BLANK_BEATS;
    gridMinIndex = Math.floor(minPitchIndex) - 2;
    gridMaxIndex = Math.ceil(maxPitchIndex) + 2;
    gridWidth = Math.ceil(maxBeat * pixelsPerBeat) + pixelsPerBeat;
    gridHeight = (gridMaxIndex - gridMinIndex) * ROW_HEIGHT;

    const gridInner = tagElement('div', 'track-viewer-grid');
    gridInner.style.width = `${gridWidth}px`;
    gridInner.style.height = `${LOOP_RULER_HEIGHT + RULER_HEIGHT + gridHeight}px`;

    gridInner.append(renderLoopRuler(definition, maxNoteBeat));

    if (activePart) {
        gridInner.append(renderSectionRuler(activePart, definition.bpm));
    }

    gridCanvas = document.createElement('canvas');
    gridCanvas.className = 'track-viewer-canvas';
    gridCanvas.width = gridWidth;
    gridCanvas.height = gridHeight;
    gridContext = gridCanvas.getContext('2d');
    drawGridContents(definition);
    attachCanvasInteractions(gridCanvas, definition);
    gridInner.append(gridCanvas);

    playheadElement = tagElement('div', 'track-viewer-playhead');
    playheadElement.style.top = `${LOOP_RULER_HEIGHT + RULER_HEIGHT}px`;
    playheadElement.style.height = `${gridHeight}px`;
    gridInner.append(playheadElement);

    const bodyRow = tagElement('div', 'track-viewer-body');
    bodyRow.append(renderPianoKeys(definition));
    bodyRow.append(gridInner);

    scrollElement = tagElement('div', 'track-viewer-scroll');
    scrollElement.append(bodyRow);
    panelElement.append(scrollElement);

    document.body.append(panelElement);

    // Restoring scroll position (or leaving it at 0 for a freshly opened track) has to happen
    // after the panel is attached to the document - scrollLeft doesn't reliably stick on an
    // element that hasn't been laid out yet. Marked as an auto-scroll so the 'scroll' listener
    // below doesn't mistake it for the user manually scrolling and turn off followPlayhead.
    isAutoScrolling = true;
    scrollElement.scrollLeft = previousScrollLeft;
    scrollElement.addEventListener('scroll', () => {
        if (isAutoScrolling) {
            isAutoScrolling = false;
            return;
        }
        followPlayhead = false;
    });
}

// New/duplicate/detach/remove/rename controls acting on the active part's active placement.
// getActivePlacement can change on its own between renders (it follows the playhead - see its
// comment), so every handler below re-resolves it at click-time rather than closing over the value
// computed when this toolbar was drawn - only the initial disabled-state/value is a snapshot.
function renderSectionToolbar(part: MusicPart, bpm: number): HTMLElement {
    const toolbar = tagElement('div', 'track-viewer-section-toolbar');
    const initialActivePlacement = getActivePlacement(part);

    const keyInput = document.createElement('input');
    keyInput.type = 'text';
    keyInput.className = 'track-viewer-section-name';
    keyInput.value = initialActivePlacement?.section.key ?? '';
    keyInput.disabled = !initialActivePlacement;
    keyInput.title = 'Rename the active section';
    keyInput.onchange = () => {
        const activePlacement = getActivePlacement(part);
        if (activePlacement && keyInput.value.trim()) {
            activePlacement.section.key = keyInput.value.trim();
            renderPanel();
        }
    };
    toolbar.append(labeledControl('section', keyInput));
    sectionNameInput = keyInput;

    const newButton = tagElement('button', 'track-viewer-button', 'New');
    newButton.title = 'Add a new empty section to this part, after everything else';
    newButton.onclick = () => {
        const name = window.prompt('New section name:', `${part.instrument}Section${(part.placements?.length ?? 0) + 1}`);
        if (!name) {
            return;
        }
        part.placements = part.placements ?? [];
        const offset = snapBeat(getPartEndBeat(part, bpm));
        part.placements.push({section: {key: name, notes: []}, offset});
        activePlacementIndexByPart.set(activePartIndex, part.placements.length - 1);
        recomposePart(part);
        renderPanel();
    };
    toolbar.append(newButton);

    const duplicateButton = tagElement('button', 'track-viewer-button', 'Duplicate') as HTMLButtonElement;
    duplicateButton.title = 'Place the active section again, after everything else, sharing the same notes (edit one, both change)';
    duplicateButton.disabled = !initialActivePlacement;
    duplicateButton.onclick = () => {
        const activePlacement = getActivePlacement(part);
        if (!activePlacement) {
            return;
        }
        const offset = snapBeat(getPartEndBeat(part, bpm));
        part.placements.push({section: activePlacement.section, offset});
        activePlacementIndexByPart.set(activePartIndex, part.placements.length - 1);
        recomposePart(part);
        renderPanel();
    };
    toolbar.append(duplicateButton);

    const detachButton = tagElement('button', 'track-viewer-button', 'Detach') as HTMLButtonElement;
    detachButton.title = 'Give the active placement its own independent copy of the section, so editing it no longer affects other placements of it';
    detachButton.disabled = !initialActivePlacement;
    detachButton.onclick = () => {
        const activePlacement = getActivePlacement(part);
        if (!activePlacement) {
            return;
        }
        const name = window.prompt('Name for the independent copy:', `${activePlacement.section.key}Copy`);
        if (!name) {
            return;
        }
        activePlacement.section = {key: name, notes: activePlacement.section.notes.map(note => ({...note}))};
        recomposePart(part);
        renderPanel();
    };
    toolbar.append(detachButton);

    const removeButton = tagElement('button', 'track-viewer-button', 'Remove') as HTMLButtonElement;
    removeButton.title = 'Remove the active placement from this part (the section itself survives if another placement still uses it)';
    removeButton.disabled = !initialActivePlacement;
    removeButton.onclick = () => {
        const activePlacement = getActivePlacement(part);
        const index = activePlacement && part.placements ? part.placements.indexOf(activePlacement) : -1;
        if (index === -1) {
            return;
        }
        part.placements.splice(index, 1);
        activePlacementIndexByPart.set(activePartIndex, Math.max(0, index - 1));
        recomposePart(part);
        renderPanel();
    };
    toolbar.append(removeButton);

    const insertLengthInput = document.createElement('input');
    insertLengthInput.type = 'number';
    insertLengthInput.min = '0.25';
    insertLengthInput.step = '0.25';
    insertLengthInput.value = '4';
    insertLengthInput.className = 'track-viewer-edit-number';
    toolbar.append(labeledControl('insert beats', insertLengthInput));

    const insertButton = tagElement('button', 'track-viewer-button', 'Insert') as HTMLButtonElement;
    insertButton.title = "Insert this many beats of empty room right after the active section's "
        + 'own content, shifting every later section (in every part) forward to make room';
    insertButton.disabled = !initialActivePlacement;
    insertButton.onclick = () => {
        const activePlacement = getActivePlacement(part);
        const amount = parseFloat(insertLengthInput.value);
        if (!activePlacement || isNaN(amount) || amount <= 0) {
            return;
        }
        const definition = musicTrackHash[editingState.trackViewerKey];
        const atGlobalBeat = getPlacementBeatRange(activePlacement, part, definition.bpm).end;
        insertBeatsIntoTrack(definition, atGlobalBeat, amount, activePlacement);
        restartPlaybackPreservingPosition(editingState.trackViewerKey);
        renderPanel();
    };
    toolbar.append(insertButton);

    return toolbar;
}

// True for the five sharps per octave (Cs/Ds/Fs/Gs/As) - everything else is a white key. Relies on
// sharp-only note names (see noteFrequencies.ts - there are no flat spellings to also match).
function isBlackKeyNote(noteName: string): boolean {
    return noteName.includes('s');
}

// A vertical piano keyboard along the left edge, one key per row of the grid (gridMinIndex to
// gridMaxIndex, same ROW_HEIGHT), purely so it's easier to judge a note's pitch at a glance than
// counting C-shaded rows. Sticky-positioned (see .track-viewer-keys) so it stays in view while
// scrolling horizontally through a long track, but still scrolls normally with the grid
// vertically, since the two are laid out side by side inside the same scroll container (see
// renderPanel's .track-viewer-body) rather than the keys living in some separately-scrolled pane
// that would need to be kept in sync by hand.
// Clicking a key plays that pitch on the active part's instrument, at whatever default
// length/volume that part's other notes would fall back to (see auditionNote/getNoteBeats) - there
// being no actual note to read those from is exactly what makes it "the part's default".
function renderPianoKeys(definition: MusicTrackDefinition): HTMLElement {
    const keys = tagElement('div', 'track-viewer-keys');
    keys.style.width = `${PIANO_KEYS_WIDTH}px`;
    keys.style.height = `${LOOP_RULER_HEIGHT + RULER_HEIGHT + gridHeight}px`;

    const part = definition.parts[activePartIndex];
    for (let index = gridMinIndex; index <= gridMaxIndex; index++) {
        const noteName = notes[index];
        if (!noteName) {
            continue;
        }
        const isBlack = isBlackKeyNote(noteName);
        const top = LOOP_RULER_HEIGHT + RULER_HEIGHT + (gridMaxIndex - index) * ROW_HEIGHT;
        // Real piano keys: black keys are narrower than the row they sit in, so the rest of that
        // row is genuinely white background, not empty space - without this backing div the gap
        // beside a black key showed the (dark) sidebar background instead, making the black key
        // look wider than its actual (smaller) clickable area.
        if (isBlack) {
            const backing = tagElement('div', 'track-viewer-key track-viewer-key-white');
            backing.style.top = `${top}px`;
            backing.style.height = `${ROW_HEIGHT}px`;
            backing.style.pointerEvents = 'none';
            keys.append(backing);
        }
        const key = tagElement('div', `track-viewer-key ${isBlack ? 'track-viewer-key-black' : 'track-viewer-key-white'}`);
        key.style.top = `${top}px`;
        key.style.height = `${ROW_HEIGHT}px`;
        if (part) {
            key.title = `Play ${noteName} on ${part.instrument}`;
            const play = () => auditionNote({beat: 0, note: noteName}, part);
            // Play on press (not click) so it feels like a real key, and also play again on
            // mouseenter while the button is still down elsewhere on the keyboard - lets you drag
            // across keys to scan for a pitch by ear (see isPianoKeyPointerDown).
            key.addEventListener('mousedown', () => {
                isPianoKeyPointerDown = true;
                document.addEventListener('mouseup', onPianoKeyPointerUp);
                play();
            });
            key.addEventListener('mouseenter', () => {
                if (isPianoKeyPointerDown) {
                    play();
                }
            });
        } else {
            key.classList.add('is-disabled');
            key.title = 'Add a part to hear this pitch';
        }
        // Labeling every C makes the octaves easy to count, matching the shaded C rows already
        // drawn on the grid itself (see drawGridContents).
        if (!isBlack && noteName.startsWith('C')) {
            key.append(tagElement('span', 'track-viewer-key-label', noteName));
        }
        keys.append(key);
    }
    return keys;
}

function onPianoKeyPointerUp(): void {
    isPianoKeyPointerDown = false;
    document.removeEventListener('mouseup', onPianoKeyPointerUp);
}

// A shaded region with two draggable flag handles marking loopStartBeat/loopEndBeat - the same
// "loop brace on a ruler" idiom most DAWs use for setting a loop/punch range. Track-level (not
// per-part), so unlike the section ruler this renders once regardless of which part is active.
// Dragging a handle updates the definition live (so the region/handle track the mouse and the
// canvas's loop markers - see drawVerticalMarker calls in drawGridContents - move with them), but
// only restarts playback once, on release (see onDocumentLoopHandleUp) - restarting on every
// mousemove would be wasteful and could click/pop repeatedly during the drag.
function renderLoopRuler(definition: MusicTrackDefinition, defaultLoopEnd: number): HTMLElement {
    const ruler = tagElement('div', 'track-viewer-loop-ruler');
    const {start, end} = getEffectiveLoopBounds(definition, defaultLoopEnd);

    // Seeking the playhead lives here now rather than on the grid itself, which needed left-drag
    // freed up for rectangle-select (see the file-level SELECTION comment). Only reached for a
    // click that isn't on a handle - both handles' own mousedown (see startLoopHandleDrag) call
    // stopPropagation before this ever fires, and the loop region overlay has pointer-events:none
    // (see .track-viewer-loop-region) so it never blocks a click from reaching the ruler itself.
    ruler.addEventListener('mousedown', (event: MouseEvent) => {
        if (event.button !== 0 || !gridCanvas) {
            return;
        }
        event.preventDefault();
        const {x} = canvasEventPoint(gridCanvas, event);
        seekMusicTrackPlayback(Math.max(0, x / pixelsPerBeat));
        // A deliberate seek clears every part's explicit section pick (see getActivePlacement) so
        // the display goes back to following wherever the playhead lands - otherwise a pick made
        // before this seek would keep overriding it indefinitely.
        activePlacementIndexByPart = new Map();
        isScrubbingPlayhead = true;
        document.addEventListener('mousemove', onDocumentScrubMove);
        document.addEventListener('mouseup', onDocumentScrubEnd);
    });

    loopRegionElement = tagElement('div', 'track-viewer-loop-region');
    ruler.append(loopRegionElement);

    loopStartHandle = tagElement('div', 'track-viewer-loop-handle track-viewer-loop-handle-start');
    loopStartHandle.onmousedown = (event) => startLoopHandleDrag(event, 'start', defaultLoopEnd);
    ruler.append(loopStartHandle);

    loopEndHandle = tagElement('div', 'track-viewer-loop-handle track-viewer-loop-handle-end');
    loopEndHandle.onmousedown = (event) => startLoopHandleDrag(event, 'end', defaultLoopEnd);
    ruler.append(loopEndHandle);

    positionLoopHandles(start, end);
    return ruler;
}

function positionLoopHandles(start: number, end: number): void {
    // Centers each handle on its beat position (CSS gives them a fixed width - see .track-viewer-
    // loop-handle) rather than having its left edge start exactly there.
    const HANDLE_WIDTH_PX = 8;
    if (loopStartHandle) {
        loopStartHandle.style.left = `${start * pixelsPerBeat - HANDLE_WIDTH_PX / 2}px`;
        loopStartHandle.title = `Loop start: beat ${round3(start)} (drag to adjust)`;
    }
    if (loopEndHandle) {
        loopEndHandle.style.left = `${end * pixelsPerBeat - HANDLE_WIDTH_PX / 2}px`;
        loopEndHandle.title = `Loop end: beat ${round3(end)} (drag to adjust)`;
    }
    if (loopRegionElement) {
        loopRegionElement.style.left = `${start * pixelsPerBeat}px`;
        loopRegionElement.style.width = `${Math.max(0, (end - start) * pixelsPerBeat)}px`;
    }
}

function startLoopHandleDrag(event: MouseEvent, mode: 'start' | 'end', defaultLoopEnd: number): void {
    if (event.button !== 0) {
        return;
    }
    event.preventDefault();
    event.stopPropagation();
    loopDragMode = mode;
    loopDragDefaultEnd = defaultLoopEnd;
    document.addEventListener('mousemove', onDocumentLoopHandleMove);
    document.addEventListener('mouseup', onDocumentLoopHandleUp);
}

function onDocumentLoopHandleMove(event: MouseEvent): void {
    if (!loopDragMode || !gridCanvas) {
        return;
    }
    const definition = musicTrackHash[editingState.trackViewerKey];
    if (!definition) {
        return;
    }
    const {x} = canvasEventPoint(gridCanvas, event);
    const beat = snapBeat(Math.max(0, x / pixelsPerBeat));
    const {start, end} = getEffectiveLoopBounds(definition, loopDragDefaultEnd);
    if (loopDragMode === 'start') {
        definition.loopStartBeat = Math.max(0, Math.min(beat, end - LOOP_MIN_GAP_BEATS));
    } else {
        definition.loopEndBeat = Math.max(beat, start + LOOP_MIN_GAP_BEATS);
    }
    const updated = getEffectiveLoopBounds(definition, loopDragDefaultEnd);
    positionLoopHandles(updated.start, updated.end);
    drawGridContents(definition);
}

function onDocumentLoopHandleUp(): void {
    if (!loopDragMode) {
        return;
    }
    loopDragMode = null;
    document.removeEventListener('mousemove', onDocumentLoopHandleMove);
    document.removeEventListener('mouseup', onDocumentLoopHandleUp);
    const key = editingState.trackViewerKey;
    if (key) {
        restartPlaybackPreservingPosition(key);
    }
    renderPanel();
}

// A row of colored bands, one per placement in the active part's timeline, positioned/sized to
// match the grid below (same pixelsPerBeat, same horizontal scroll). Click a band to explicitly
// pick it as the active placement (see getActivePlacement) - sticks until a different note/band is
// selected or the playhead is deliberately seeked elsewhere (see the loop ruler's mousedown
// handler), per getActivePlacement's priority order.
function renderSectionRuler(part: MusicPart, bpm: number): HTMLElement {
    const ruler = tagElement('div', 'track-viewer-ruler');
    const activePlacement = getActivePlacement(part);
    rulerBandElements = [];
    (part.placements ?? []).forEach((placement, i) => {
        const range = getPlacementBeatRange(placement, part, bpm);
        const band = tagElement('div', 'track-viewer-ruler-band', placement.section.key);
        band.style.left = `${range.start * pixelsPerBeat}px`;
        band.style.width = `${Math.max(4, (range.end - range.start) * pixelsPerBeat)}px`;
        if (placement === activePlacement) {
            band.classList.add('is-active');
        }
        band.title = `${placement.section.key} (beats ${round3(range.start)}-${round3(range.end)})`;
        band.onclick = (event) => {
            event.stopPropagation();
            activePlacementIndexByPart.set(activePartIndex, i);
            renderPanel();
        };
        ruler.append(band);
        rulerBandElements.push({element: band, placement});
    });
    return ruler;
}

// A row of controls for the current selection, or null if nothing is selected. A single selected
// note gets full pitch/beat/length controls, same as before multi-select existed; more than one
// gets whatever edits make sense applied to the whole selection at once (currently just length -
// pitch/beat are inherently per-note, see the drag-to-move gesture for moving/transposing a
// selection together instead). Clears a stale selection (e.g. a note was deleted from another code
// path) defensively.
function renderEditRow(definition: MusicTrackDefinition): HTMLElement {
    if (!selectedNotes.length || selectedPartIndex == null) {
        return null;
    }
    const partIndex = selectedPartIndex;
    const part = definition.parts[partIndex];
    const stillPresent = part?.placements
        && selectedNotes.every(note => part.placements.some(placement => placement.section.notes.includes(note)));
    if (!part || !stillPresent) {
        clearSelection();
        return null;
    }

    const row = tagElement('div', 'track-viewer-edit');

    if (selectedNotes.length === 1) {
        const note = selectedNotes[0];
        row.append(document.createTextNode(`${part.instrument}: `));

        const pitchSelect = document.createElement('select');
        for (const noteName of notes) {
            const option = document.createElement('option');
            option.value = noteName;
            option.textContent = noteName;
            pitchSelect.append(option);
        }
        const currentIndex = getPitchIndex(note.note ?? part.note, note.frequency ?? part.frequency);
        pitchSelect.value = notes[Math.round(currentIndex ?? 48)] ?? notes[48];
        pitchSelect.onchange = () => {
            note.note = pitchSelect.value as Note;
            delete note.frequency;
            if (isMusicTrackPaused()) {
                auditionNote(note, part);
            }
            commitNoteEdit(partIndex);
        };
        row.append(labeledControl('pitch', pitchSelect));

        const beatInput = document.createElement('input');
        beatInput.type = 'number';
        beatInput.step = '0.05';
        beatInput.className = 'track-viewer-edit-number';
        beatInput.value = `${round3(note.beat)}`;
        beatInput.onchange = () => {
            const value = parseFloat(beatInput.value);
            if (!isNaN(value)) {
                note.beat = Math.max(0, value);
            }
            commitNoteEdit(partIndex);
        };
        row.append(labeledControl('beat', beatInput));

        const lengthInput = document.createElement('input');
        lengthInput.type = 'number';
        lengthInput.step = '0.05';
        lengthInput.className = 'track-viewer-edit-number';
        lengthInput.value = `${round3(getNoteBeats(note, part, definition.bpm))}`;
        lengthInput.onchange = () => {
            const value = parseFloat(lengthInput.value);
            if (!isNaN(value) && value > 0) {
                setNoteBeats(note, value, definition.bpm);
            }
            commitNoteEdit(partIndex);
        };
        row.append(labeledControl('length (beats)', lengthInput));

        const deleteButton = tagElement('button', 'track-viewer-button', 'Delete');
        deleteButton.title = 'Delete this note (delete/backspace)';
        deleteButton.onclick = () => deleteSelectedNotes();
        row.append(deleteButton);
    } else {
        row.append(document.createTextNode(`${part.instrument}: ${selectedNotes.length} notes selected `));

        // Blank (rather than an arbitrary one of them) when the selection doesn't already share a
        // single length, so committing an unchanged blank field can't silently overwrite it.
        const lengths = new Set(selectedNotes.map(note => round3(getNoteBeats(note, part, definition.bpm))));
        const lengthInput = document.createElement('input');
        lengthInput.type = 'number';
        lengthInput.step = '0.05';
        lengthInput.className = 'track-viewer-edit-number';
        lengthInput.placeholder = 'mixed';
        lengthInput.value = lengths.size === 1 ? `${[...lengths][0]}` : '';
        lengthInput.onchange = () => {
            const value = parseFloat(lengthInput.value);
            if (!isNaN(value) && value > 0) {
                for (const note of selectedNotes) {
                    setNoteBeats(note, value, definition.bpm);
                }
            }
            commitNoteEdit(partIndex);
        };
        row.append(labeledControl('length (beats)', lengthInput));

        const deleteButton = tagElement('button', 'track-viewer-button', 'Delete All');
        deleteButton.title = 'Delete all selected notes (delete/backspace)';
        deleteButton.onclick = () => deleteSelectedNotes();
        row.append(deleteButton);
    }

    const deselectButton = tagElement('button', 'track-viewer-button', '×');
    deselectButton.onclick = () => {
        clearSelection();
        renderPanel();
    };
    row.append(deselectButton);

    return row;
}

function labeledControl(text: string, input: HTMLElement): HTMLElement {
    const label = tagElement('label', 'track-viewer-edit-label');
    label.append(document.createTextNode(`${text} `));
    label.append(input);
    return label;
}

// Applied after any edit that doesn't go through a drag (pitch/beat/length inputs, delete) - never
// restarts playback, see the file-level "LIVE EDITING" comment.
function commitNoteEdit(partIndex: number): void {
    const definition = musicTrackHash[editingState.trackViewerKey];
    const part = definition.parts[partIndex];
    // Purely cosmetic/export-readability - the player no longer requires sorted order (see
    // PartPlaybackState in musicTrackPlayer.ts).
    for (const placement of part.placements ?? []) {
        placement.section.notes.sort((a, b) => a.beat - b.beat);
    }
    recomposePart(part);
    renderPanel();
}

function drawVerticalMarker(context: CanvasRenderingContext2D, x: number, height: number, color: string): void {
    context.strokeStyle = color;
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x, height);
    context.stroke();
    context.lineWidth = 1;
}

// Draws the background/gridlines/loop markers/notes onto the (already-sized) gridCanvas and
// rebuilds noteHitRegions. Called both for the initial render and, cheaply, on every live-drag
// mousemove (see attachCanvasInteractions) - it never touches any DOM outside the canvas itself.
function drawGridContents(definition: MusicTrackDefinition): void {
    const context = gridContext;
    context.fillStyle = '#1b1b1b';
    context.fillRect(0, 0, gridWidth, gridHeight);
    // Shade the row for every C so octaves are easy to count by eye.
    for (let index = gridMinIndex; index <= gridMaxIndex; index++) {
        if (notes[index]?.startsWith('C') && notes[index]?.[1] !== 's') {
            const y = (gridMaxIndex - index) * ROW_HEIGHT;
            context.fillStyle = 'rgba(255, 255, 255, 0.07)';
            context.fillRect(0, y, gridWidth, ROW_HEIGHT);
        }
    }
    // Vertical beat lines, heavier every 4 beats (one measure in 4/4).
    const totalBeats = Math.ceil(gridWidth / pixelsPerBeat);
    for (let beat = 0; beat <= totalBeats; beat++) {
        const x = beat * pixelsPerBeat;
        context.strokeStyle = (beat % 4 === 0) ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.1)';
        context.beginPath();
        context.moveTo(x + 0.5, 0);
        context.lineTo(x + 0.5, gridHeight);
        context.stroke();
    }
    if (definition.loopStartBeat) {
        drawVerticalMarker(context, definition.loopStartBeat * pixelsPerBeat, gridHeight, '#4CAF50');
    }
    if (definition.loopEndBeat) {
        drawVerticalMarker(context, definition.loopEndBeat * pixelsPerBeat, gridHeight, '#F44336');
    }

    noteHitRegions = [];
    const selectedSet = new Set(selectedNotes);
    definition.parts.forEach((part, partIndex) => {
        if (hiddenPartIndices.has(partIndex)) {
            return;
        }
        const color = PART_COLORS[partIndex % PART_COLORS.length];
        const isSelectedPart = partIndex === selectedPartIndex;
        // Full opacity is reserved for the currently active *part's* active placement only - every
        // other part's notes always render dimmed, even if the playhead happens to be sitting over
        // one of their own sections. getActivePlacement is only meaningful for the active part
        // anyway (its playhead-match/explicit-pick fallbacks both key off activePartIndex, not
        // `part`'s own index), so it's not even called for the rest.
        const isActivePart = partIndex === activePartIndex;
        const activePlacement = isActivePart ? getActivePlacement(part) : null;
        for (const placement of part.placements ?? []) {
            const isActiveSection = isActivePart && placement === activePlacement;
            for (const note of placement.section.notes) {
                const index = getPitchIndex(note.note ?? part.note, note.frequency ?? part.frequency);
                if (index === null) {
                    continue;
                }
                const globalBeat = note.beat + placement.offset;
                const x = globalBeat * pixelsPerBeat;
                const w = Math.max(2, getNoteBeats(note, part, definition.bpm) * pixelsPerBeat - 1);
                const y = (gridMaxIndex - index) * ROW_HEIGHT;
                const h = ROW_HEIGHT - 1;
                context.globalAlpha = (note.volume ?? 1) * (isActiveSection ? 1 : INACTIVE_SECTION_ALPHA);
                context.fillStyle = color;
                context.fillRect(x, y, w, h);
                context.globalAlpha = 1;
                if (isSelectedPart && selectedSet.has(note)) {
                    context.strokeStyle = '#FFFFFF';
                    context.lineWidth = 1;
                    context.strokeRect(x + 0.5, y + 0.5, Math.max(1, w - 1), Math.max(1, h - 1));
                }
                noteHitRegions.push({partIndex, placement, note, x, y, w, h});
            }
        }
    });

    if (selectionDragRect) {
        const rx = Math.min(selectionDragRect.x0, selectionDragRect.x1);
        const ry = Math.min(selectionDragRect.y0, selectionDragRect.y1);
        const rw = Math.abs(selectionDragRect.x1 - selectionDragRect.x0);
        const rh = Math.abs(selectionDragRect.y1 - selectionDragRect.y0);
        context.fillStyle = 'rgba(255, 255, 255, 0.15)';
        context.fillRect(rx, ry, rw, rh);
        context.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        context.lineWidth = 1;
        context.strokeRect(rx + 0.5, ry + 0.5, rw, rh);
    }
}

function canvasEventPoint(canvas: HTMLCanvasElement, event: MouseEvent): {x: number, y: number} {
    const rect = canvas.getBoundingClientRect();
    return {
        x: (event.clientX - rect.left) * (canvas.width / rect.width),
        y: (event.clientY - rect.top) * (canvas.height / rect.height),
    };
}

function findHit(x: number, y: number): NoteHitRegion | null {
    // Iterate in reverse so the most-recently-drawn (topmost) part wins where notes overlap.
    for (let i = noteHitRegions.length - 1; i >= 0; i--) {
        const region = noteHitRegions[i];
        if (x >= region.x && x <= region.x + region.w && y >= region.y && y <= region.y + region.h) {
            return region;
        }
    }
    return null;
}

// Classifies where within a hit note a pointer is, for move-vs-resize dragging: always "move"
// within RESIZE_CENTER_EXCLUSION_PX of the note's horizontal center (guarantees a usable move
// band even on a very short note), otherwise "resize" within RESIZE_EDGE_PX of an edge, and
// "move" everywhere else.
function classifyEdit(region: NoteHitRegion, canvasX: number): 'move' | 'resize-left' | 'resize-right' {
    const localX = canvasX - region.x;
    if (Math.abs(localX - region.w / 2) < RESIZE_CENTER_EXCLUSION_PX) {
        return 'move';
    }
    if (localX <= RESIZE_EDGE_PX) {
        return 'resize-left';
    }
    if (localX >= region.w - RESIZE_EDGE_PX) {
        return 'resize-right';
    }
    return 'move';
}

function attachCanvasInteractions(canvas: HTMLCanvasElement, definition: MusicTrackDefinition): void {
    canvas.addEventListener('mousemove', (event: MouseEvent) => {
        if (dragState || isScrubbingPlayhead || selectionDragState) {
            return;
        }
        const {x, y} = canvasEventPoint(canvas, event);
        const hit = findHit(x, y);
        if (!hit) {
            canvas.style.cursor = 'crosshair';
            return;
        }
        canvas.style.cursor = classifyEdit(hit, x) === 'move' ? 'grab' : 'ew-resize';
    });

    canvas.addEventListener('mousedown', (event: MouseEvent) => {
        if (event.button !== 0) {
            return;
        }
        const {x, y} = canvasEventPoint(canvas, event);
        const hit = findHit(x, y);
        if (!hit) {
            // Empty space: drag a selection rectangle (see onDocumentSelectionDragMove) - seeking
            // the playhead now lives on the loop ruler bar instead (see renderLoopRuler).
            event.preventDefault();
            selectionDragState = {startCanvasX: x, startCanvasY: y};
            selectionDragRect = {x0: x, y0: y, x1: x, y1: y};
            document.addEventListener('mousemove', onDocumentSelectionDragMove);
            document.addEventListener('mouseup', onDocumentSelectionDragUp);
            return;
        }
        event.preventDefault();
        const part = definition.parts[hit.partIndex];
        // Selecting a note - including by starting a drag on it - makes its part the active one,
        // so the legend/toolbar/ruler switch to match what you clicked instead of staying on
        // whatever part was active before.
        activePartIndex = hit.partIndex;
        const editMode = classifyEdit(hit, x);
        // Dragging a note that's already part of a multi-note selection moves the whole selection
        // together (see DragState.group) instead of collapsing it down to just this one note -
        // otherwise a plain click elsewhere always replaces the selection with just the note (or
        // nothing) under the cursor.
        const isGroupDrag = editMode === 'move' && selectedPartIndex === hit.partIndex
            && selectedNotes.length > 1 && selectedNotes.includes(hit.note);
        if (!isGroupDrag) {
            selectedPartIndex = hit.partIndex;
            selectedNotes = [hit.note];
        }
        if (isMusicTrackPaused()) {
            auditionNote(hit.note, part);
        }
        const startPitchIndex = getPitchIndex(hit.note.note ?? part.note, hit.note.frequency ?? part.frequency) ?? 48;
        dragState = {
            mode: editMode,
            partIndex: hit.partIndex,
            placement: hit.placement,
            note: hit.note,
            part,
            startCanvasX: x,
            startCanvasY: y,
            startBeat: hit.note.beat,
            startBeats: getNoteBeats(hit.note, part, definition.bpm),
            startPitchIndex,
            lastAuditionedPitchIndex: startPitchIndex,
            moved: false,
            group: isGroupDrag ? selectedNotes.map(note => {
                const placement = findNotePlacement(part, note) ?? hit.placement;
                return {
                    note,
                    placement,
                    startGlobalBeat: note.beat + placement.offset,
                    startPitchIndex: getPitchIndex(note.note ?? part.note, note.frequency ?? part.frequency) ?? 48,
                };
            }) : undefined,
        };
        canvas.style.cursor = dragState.mode === 'move' ? 'grabbing' : 'ew-resize';
        document.addEventListener('mousemove', onDocumentMouseMove);
        document.addEventListener('mouseup', onDocumentMouseUp);
    });

    canvas.addEventListener('contextmenu', (event: MouseEvent) => {
        event.preventDefault();
        const {x, y} = canvasEventPoint(canvas, event);
        const hit = findHit(x, y);
        if (hit) {
            activePartIndex = hit.partIndex;
            selectedPartIndex = hit.partIndex;
            selectedNotes = [hit.note];
            if (isMusicTrackPaused()) {
                auditionNote(hit.note, definition.parts[hit.partIndex]);
            }
            renderPanel();
            return;
        }
        const part = definition.parts[activePartIndex];
        const placement = getActivePlacement(part);
        if (!part || !placement) {
            return;
        }
        const rawGlobalBeat = Math.max(0, x / pixelsPerBeat);
        const rawLocalBeat = Math.max(0, rawGlobalBeat - placement.offset);
        const defaultBeats = getDefaultNewNoteBeats(part, placement, rawLocalBeat, definition.bpm);
        const globalBeat = Math.max(0, floorBeatToGrid(rawGlobalBeat, getSnapGridForDuration(defaultBeats)));
        const localBeat = Math.max(0, globalBeat - placement.offset);
        // Floored the same way as the beat above (and for the same reason) - gridMaxIndex - index
        // is a row's *top* edge in row-count terms, so flooring y/ROW_HEIGHT picks whichever row
        // the cursor is actually within rather than whichever row's center it's closest to.
        const pitchIndex = Math.max(0, Math.min(notes.length - 1, gridMaxIndex - Math.floor(y / ROW_HEIGHT)));
        const newNote: NoteEvent = {beat: localBeat, beats: defaultBeats, note: notes[pitchIndex]};
        placement.section.notes.push(newNote);
        selectedPartIndex = activePartIndex;
        selectedNotes = [newNote];
        if (isMusicTrackPaused()) {
            auditionNote(newNote, part);
        }
        commitNoteEdit(activePartIndex);
    });
}

function onDocumentMouseMove(event: MouseEvent): void {
    if (!dragState || !gridCanvas) {
        return;
    }
    const {x, y} = canvasEventPoint(gridCanvas, event);
    const deltaX = x - dragState.startCanvasX;
    const deltaY = y - dragState.startCanvasY;
    if (!dragState.moved && Math.abs(deltaX) < 2 && Math.abs(deltaY) < 2) {
        return;
    }
    dragState.moved = true;
    const {note, placement, mode} = dragState;
    const bpm = musicTrackHash[editingState.trackViewerKey].bpm;
    const startGlobalBeat = dragState.startBeat + placement.offset;

    if (mode === 'move') {
        const newGlobalBeat = snapBeat(startGlobalBeat + deltaX / pixelsPerBeat);
        const newPitchIndex = Math.max(0, Math.min(notes.length - 1,
            Math.round(dragState.startPitchIndex - deltaY / ROW_HEIGHT)));
        if (dragState.group) {
            // One uniform beat/pitch delta (from the dragged note's own movement) applied to every
            // selected note, each clamped against the *group's* earliest beat/extreme pitch rather
            // than each note's own - so the selection can't bunch up or lose its shape as soon as
            // any one member would otherwise go below beat 0 or off the top/bottom of the grid.
            let beatDelta = newGlobalBeat - startGlobalBeat;
            let pitchDelta = newPitchIndex - dragState.startPitchIndex;
            const minStartGlobalBeat = Math.min(...dragState.group.map(g => g.startGlobalBeat));
            beatDelta = Math.max(beatDelta, -minStartGlobalBeat);
            const minStartPitch = Math.min(...dragState.group.map(g => g.startPitchIndex));
            const maxStartPitch = Math.max(...dragState.group.map(g => g.startPitchIndex));
            pitchDelta = Math.max(-minStartPitch, Math.min(notes.length - 1 - maxStartPitch, pitchDelta));
            for (const g of dragState.group) {
                g.note.beat = Math.max(0, g.startGlobalBeat + beatDelta - g.placement.offset);
                g.note.note = notes[g.startPitchIndex + pitchDelta];
                delete g.note.frequency;
            }
            if (pitchDelta !== 0 && newPitchIndex !== dragState.lastAuditionedPitchIndex && isMusicTrackPaused()) {
                dragState.lastAuditionedPitchIndex = newPitchIndex;
                auditionNote(note, dragState.part);
            }
        } else {
            note.beat = Math.max(0, newGlobalBeat - placement.offset);
            note.note = notes[newPitchIndex];
            delete note.frequency;
            // Only re-audition when the drag actually crosses into a new pitch, not on every
            // mousemove tick (most of which don't change the row at all).
            if (newPitchIndex !== dragState.lastAuditionedPitchIndex && isMusicTrackPaused()) {
                dragState.lastAuditionedPitchIndex = newPitchIndex;
                auditionNote(note, dragState.part);
            }
        }
    } else if (mode === 'resize-left') {
        const endGlobalBeat = startGlobalBeat + dragState.startBeats;
        const newStartGlobalBeat = Math.min(
            endGlobalBeat - MIN_NOTE_BEATS, snapBeat(startGlobalBeat + deltaX / pixelsPerBeat));
        note.beat = Math.max(0, newStartGlobalBeat - placement.offset);
        setNoteBeats(note, Math.max(MIN_NOTE_BEATS, endGlobalBeat - newStartGlobalBeat), bpm);
    } else {
        const newEndGlobalBeat = Math.max(
            startGlobalBeat + MIN_NOTE_BEATS, snapBeat(startGlobalBeat + dragState.startBeats + deltaX / pixelsPerBeat));
        setNoteBeats(note, newEndGlobalBeat - startGlobalBeat, bpm);
    }

    drawGridContents(musicTrackHash[editingState.trackViewerKey]);
}

function onDocumentMouseUp(): void {
    document.removeEventListener('mousemove', onDocumentMouseMove);
    document.removeEventListener('mouseup', onDocumentMouseUp);
    if (dragState) {
        if (dragState.moved) {
            recomposePart(dragState.part);
        }
        dragState = null;
        renderPanel();
    }
}

// Continues the rectangle-selection drag started in the canvas 'mousedown' handler, redrawing the
// marquee (selectionDragRect, see drawGridContents) as the mouse moves - the actual note selection
// itself is only resolved once, on release (see onDocumentSelectionDragUp).
function onDocumentSelectionDragMove(event: MouseEvent): void {
    if (!selectionDragState || !gridCanvas) {
        return;
    }
    const {x, y} = canvasEventPoint(gridCanvas, event);
    selectionDragRect = {x0: selectionDragState.startCanvasX, y0: selectionDragState.startCanvasY, x1: x, y1: y};
    drawGridContents(musicTrackHash[editingState.trackViewerKey]);
}

function onDocumentSelectionDragUp(): void {
    document.removeEventListener('mousemove', onDocumentSelectionDragMove);
    document.removeEventListener('mouseup', onDocumentSelectionDragUp);
    if (!selectionDragState) {
        return;
    }
    const rect = selectionDragRect;
    selectionDragState = null;
    selectionDragRect = null;
    // A click with no real movement: just deselect, same as clicking empty space always did before
    // multi-select existed.
    if (!rect || (Math.abs(rect.x1 - rect.x0) < 2 && Math.abs(rect.y1 - rect.y0) < 2)) {
        clearSelection();
        renderPanel();
        return;
    }
    const rx = Math.min(rect.x0, rect.x1);
    const ry = Math.min(rect.y0, rect.y1);
    const rw = Math.abs(rect.x1 - rect.x0);
    const rh = Math.abs(rect.y1 - rect.y0);
    // Restricted to the active part (see the file-level SELECTION comment), regardless of which
    // parts' notes visually fall within the rectangle.
    const matches = noteHitRegions.filter(region => region.partIndex === activePartIndex
        && region.x < rx + rw && region.x + region.w > rx && region.y < ry + rh && region.y + region.h > ry);
    if (matches.length) {
        selectedPartIndex = activePartIndex;
        selectedNotes = matches.map(region => region.note);
    } else {
        clearSelection();
    }
    renderPanel();
}

// Continues the playhead scrub started in the loop ruler's 'mousedown' handler for as long as the
// mouse stays down - deliberately cheap (just the seek itself) rather than a renderPanel per
// mousemove; the playhead position updates on its own via the normal per-frame refreshTrackViewer,
// same as during ordinary playback.
function onDocumentScrubMove(event: MouseEvent): void {
    if (!isScrubbingPlayhead || !gridCanvas) {
        return;
    }
    const {x} = canvasEventPoint(gridCanvas, event);
    seekMusicTrackPlayback(Math.max(0, x / pixelsPerBeat));
}

function onDocumentScrubEnd(): void {
    isScrubbingPlayhead = false;
    document.removeEventListener('mousemove', onDocumentScrubMove);
    document.removeEventListener('mouseup', onDocumentScrubEnd);
}

// Cheap per-frame sync of the section-name field and ruler highlight with whatever
// getActivePlacement currently resolves to - which can change on its own as the playhead moves,
// with nothing else triggering a render. A full renderPanel every frame would be far too
// expensive (rebuilds the whole canvas plus a 108-option pitch <select> in the edit row), so this
// only ever touches the couple of elements that actually need to move. Skips the input while the
// user is actively typing in it so this can't fight their edit.
function refreshSectionIndicator(): void {
    const definition = musicTrackHash[editingState.trackViewerKey];
    const part = definition?.parts[activePartIndex];
    if (!part) {
        return;
    }
    const activePlacement = getActivePlacement(part);
    if (sectionNameInput && document.activeElement !== sectionNameInput) {
        sectionNameInput.value = activePlacement?.section.key ?? '';
    }
    for (const {element, placement} of rulerBandElements) {
        element.classList.toggle('is-active', placement === activePlacement);
    }
}

// Called every render frame (see client.ts) - cheap no-op when the viewer isn't open.
export function refreshTrackViewer(): void {
    const definition = musicTrackHash[editingState.trackViewerKey];
    if (!definition) {
        return;
    }
    refreshSectionIndicator();
    // Redraws the note grid every frame (not just after an edit) so the active-section dimming
    // (see INACTIVE_SECTION_ALPHA) stays in sync as the playhead moves and changes which section
    // counts as active - the whole point of that dimming is to make an out-of-place note stand out
    // while scrubbing/playing, not just after the fact. Cheap enough at this canvas's size/note
    // counts to just always do it rather than tracking whether anything actually changed.
    if (gridCanvas && gridContext) {
        drawGridContents(definition);
    }
    if (!playheadElement) {
        return;
    }
    const position = getMusicTrackPlaybackPosition();
    if (!position || position.key !== editingState.trackViewerKey) {
        playheadElement.style.visibility = 'hidden';
        if (positionLabel) {
            positionLabel.textContent = '';
        }
        return;
    }
    playheadElement.style.visibility = '';
    const x = position.beat * pixelsPerBeat;
    playheadElement.style.transform = `translateX(${x}px)`;
    if (positionLabel) {
        positionLabel.textContent = `beat ${position.beat.toFixed(2)}`;
    }
    if (followPlayhead && scrollElement) {
        const viewWidth = scrollElement.clientWidth;
        if (x < scrollElement.scrollLeft || x > scrollElement.scrollLeft + viewWidth) {
            isAutoScrolling = true;
            scrollElement.scrollLeft = Math.max(0, x - viewWidth / 2);
        }
    }
}
