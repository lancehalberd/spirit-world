import {editingState} from 'app/development/editingState';
import {tagElement} from 'app/dom';
import {exportMusicTrackToClipboard} from 'app/development/exportMusicTrack';
import {getState} from 'app/state';
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
// shared beat/pitch grid with a live playhead (click empty space to seek it), hiding/muting
// individual parts, adding/selecting/dragging/resizing/deleting notes, and exporting the track
// back out as pasteable TS source.
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
// LIVE EDITING: note add/delete/move/resize never restarts playback. musicTrackPlayer's scheduler
// re-scans each part's notes by beat every tick rather than trusting a persisted index (see
// PartPlaybackState in musicTrackPlayer.ts), specifically so replacing `part.notes` out from under
// a running playback - which is exactly what recomposePart does after every edit - can't desync
// it: already-scheduled notes finish playing, and the next tick just picks up whatever the array
// now contains.

const ROW_HEIGHT = 7;
const RULER_HEIGHT = 16;
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
// How strongly to dim a note that doesn't belong to its part's active section (see
// getActivePlacement) - a visual cue so a note that's technically in the wrong section (e.g.
// pasted/added while a different section was intended) stands out as an outlier rather than
// blending in, since a single such note can otherwise silently balloon that section's ruler band
// and playhead-match range (see getPlacementBeatRange) far beyond where it actually belongs.
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

let pixelsPerBeat = 16;
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
let selectedNote: {partIndex: number, note: NoteEvent} = null;

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
}
let dragState: DragState = null;
// A drag ends with a mouseup, which is followed by a synthetic 'click' on the same element
// regardless of how far the mouse moved in between - without this, every note-drag would also
// fire the empty-space click handler's seek (the note is rarely still under the cursor after
// being dragged). Set by onDocumentMouseUp when a real drag happened; consumed by the very next
// click on the canvas.
let suppressNextClick = false;
// Set while dragging on empty space, so the playhead scrubs continuously with the mouse instead of
// only jumping once on release (see onDocumentScrubMove/onDocumentScrubEnd). The eventual 'click'
// still fires its own seek + deselect once the mouse is released - redundant with the last scrub
// move, but harmless, so nothing here needs to suppress it.
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
    selectedNote = null;
    dragState = null;
    noteHitRegions = [];
    rulerBandElements = [];
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
    selectedNote = null;
    dragState = null;
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

// Deletes whatever note is currently selected, if any - shared by the edit row's Delete button and
// the delete/backspace hotkey (see addKeyboardShortcuts.ts). A no-op if nothing is selected, so the
// hotkey is safe to wire up unconditionally whenever the track viewer is open.
export function deleteSelectedNote(): void {
    if (!selectedNote || !editingState.trackViewerKey) {
        return;
    }
    const definition = musicTrackHash[editingState.trackViewerKey];
    const {partIndex, note} = selectedNote;
    const part = definition.parts[partIndex];
    if (!part) {
        return;
    }
    removeNoteFromPart(part, note);
    selectedNote = null;
    commitNoteEdit(partIndex);
}

// Resolves which of `part`'s placements is "active" - the target for right-click-add and the
// section toolbar, and what the section-name field/ruler highlight display. Priority: whatever
// section the selected note belongs to (if any - selecting a note pins the display to it), else
// whichever section the playhead currently sits over (so the display tracks playback as it moves
// through the song), else whatever the user last explicitly picked by clicking a ruler band, else
// the first placement.
function getActivePlacement(part: MusicPart): MusicSectionPlacement | null {
    if (selectedNote && selectedNote.partIndex === activePartIndex) {
        const owning = (part.placements ?? []).find(placement => placement.section.notes.includes(selectedNote.note));
        if (owning) {
            return owning;
        }
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
    const index = activePlacementIndexByPart.get(activePartIndex) ?? 0;
    return part.placements?.[index] ?? null;
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

// Plays a single note immediately, at its own pitch/duration/volume, through the same
// trackViewerGainNode the track's own playback uses. Only called while paused (see call sites) -
// while actually playing, the note is already audible as part of the mix, and playing it again on
// top would just sound like a doubled/echoed note.
function auditionNote(note: NoteEvent, part: MusicPart, bpm: number): void {
    playNote({
        destination: trackViewerGainNode,
        time: audioContext.currentTime,
        instrument: part.instrument,
        noteOrFrequency: note.note ?? note.frequency ?? part.note ?? part.frequency,
        volume: (note.volume ?? 1) * (part.volume ?? 1),
        duration: getNoteBeats(note, part, bpm) * (60 / bpm),
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
        item.append(document.createTextNode(`${part.instrument}${part.volume != null ? ` (${part.volume})` : ''}`));
        if (isHidden) {
            item.classList.add('is-hidden');
        }
        if (isMuted) {
            item.classList.add('is-muted');
        }
        legend.append(item);
    });
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
    let minPitchIndex = 48;
    let maxPitchIndex = 48;
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
    const maxBeat = Math.max(definition.loopEndBeat ?? 0, maxNoteBeat);
    gridMinIndex = Math.floor(minPitchIndex) - 2;
    gridMaxIndex = Math.ceil(maxPitchIndex) + 2;
    gridWidth = Math.ceil(maxBeat * pixelsPerBeat) + pixelsPerBeat;
    gridHeight = (gridMaxIndex - gridMinIndex) * ROW_HEIGHT;

    const gridInner = tagElement('div', 'track-viewer-grid');
    gridInner.style.width = `${gridWidth}px`;
    gridInner.style.height = `${RULER_HEIGHT + gridHeight}px`;

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
    playheadElement.style.top = `${RULER_HEIGHT}px`;
    playheadElement.style.height = `${gridHeight}px`;
    gridInner.append(playheadElement);

    scrollElement = tagElement('div', 'track-viewer-scroll');
    scrollElement.append(gridInner);
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

    return toolbar;
}

// A row of colored bands, one per placement in the active part's timeline, positioned/sized to
// match the grid below (same pixelsPerBeat, same horizontal scroll). Click a band to explicitly
// pick it as the active placement (see getActivePlacement) - note that a selected note or the
// playhead being over a *different* section takes priority over this pick, per getActivePlacement.
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

// A row of pitch/beat/length controls for the selected note, or null if nothing is selected.
// Clears a stale selection (e.g. the note was just deleted from another code path) defensively.
function renderEditRow(definition: MusicTrackDefinition): HTMLElement {
    if (!selectedNote) {
        return null;
    }
    const {partIndex, note} = selectedNote;
    const part = definition.parts[partIndex];
    const stillPresent = part?.placements?.some(placement => placement.section.notes.includes(note));
    if (!part || !stillPresent) {
        selectedNote = null;
        return null;
    }

    const row = tagElement('div', 'track-viewer-edit');
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
            auditionNote(note, part, definition.bpm);
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
    deleteButton.onclick = () => deleteSelectedNote();
    row.append(deleteButton);

    const deselectButton = tagElement('button', 'track-viewer-button', '×');
    deselectButton.onclick = () => {
        selectedNote = null;
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
    definition.parts.forEach((part, partIndex) => {
        if (hiddenPartIndices.has(partIndex)) {
            return;
        }
        const color = PART_COLORS[partIndex % PART_COLORS.length];
        // Computed once per part per draw (not per note) - which placement counts as "active" can
        // itself depend on the full set of notes (it follows the playhead), so this has to be
        // resolved before dimming any individual note.
        const activePlacement = getActivePlacement(part);
        for (const placement of part.placements ?? []) {
            const isActiveSection = placement === activePlacement;
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
                if (selectedNote && selectedNote.partIndex === partIndex && selectedNote.note === note) {
                    context.strokeStyle = '#FFFFFF';
                    context.lineWidth = 1;
                    context.strokeRect(x + 0.5, y + 0.5, Math.max(1, w - 1), Math.max(1, h - 1));
                }
                noteHitRegions.push({partIndex, placement, note, x, y, w, h});
            }
        }
    });
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
        if (dragState || isScrubbingPlayhead) {
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
            // Empty space: scrub the playhead continuously for as long as the mouse is held (see
            // onDocumentScrubMove) rather than only jumping once on release.
            seekMusicTrackPlayback(Math.max(0, x / pixelsPerBeat));
            isScrubbingPlayhead = true;
            document.addEventListener('mousemove', onDocumentScrubMove);
            document.addEventListener('mouseup', onDocumentScrubEnd);
            return;
        }
        event.preventDefault();
        const part = definition.parts[hit.partIndex];
        // Selecting a note - including by starting a drag on it - makes its part the active one,
        // so the legend/toolbar/ruler switch to match what you clicked instead of staying on
        // whatever part was active before.
        activePartIndex = hit.partIndex;
        selectedNote = {partIndex: hit.partIndex, note: hit.note};
        if (isMusicTrackPaused()) {
            auditionNote(hit.note, part, definition.bpm);
        }
        dragState = {
            mode: classifyEdit(hit, x),
            partIndex: hit.partIndex,
            placement: hit.placement,
            note: hit.note,
            part,
            startCanvasX: x,
            startCanvasY: y,
            startBeat: hit.note.beat,
            startBeats: getNoteBeats(hit.note, part, definition.bpm),
            startPitchIndex: getPitchIndex(hit.note.note ?? part.note, hit.note.frequency ?? part.frequency) ?? 48,
            lastAuditionedPitchIndex: getPitchIndex(hit.note.note ?? part.note, hit.note.frequency ?? part.frequency) ?? 48,
            moved: false,
        };
        canvas.style.cursor = dragState.mode === 'move' ? 'grabbing' : 'ew-resize';
        document.addEventListener('mousemove', onDocumentMouseMove);
        document.addEventListener('mouseup', onDocumentMouseUp);
    });

    canvas.addEventListener('click', (event: MouseEvent) => {
        if (suppressNextClick) {
            suppressNextClick = false;
            return;
        }
        const {x, y} = canvasEventPoint(canvas, event);
        if (findHit(x, y)) {
            // Already selected on mousedown above.
            return;
        }
        seekMusicTrackPlayback(Math.max(0, x / pixelsPerBeat));
        selectedNote = null;
        renderPanel();
    });

    canvas.addEventListener('contextmenu', (event: MouseEvent) => {
        event.preventDefault();
        const {x, y} = canvasEventPoint(canvas, event);
        const hit = findHit(x, y);
        if (hit) {
            activePartIndex = hit.partIndex;
            selectedNote = {partIndex: hit.partIndex, note: hit.note};
            if (isMusicTrackPaused()) {
                auditionNote(hit.note, definition.parts[hit.partIndex], definition.bpm);
            }
            renderPanel();
            return;
        }
        const part = definition.parts[activePartIndex];
        const placement = getActivePlacement(part);
        if (!part || !placement) {
            return;
        }
        const globalBeat = Math.max(0, snapBeat(x / pixelsPerBeat));
        const localBeat = Math.max(0, globalBeat - placement.offset);
        const pitchIndex = Math.max(0, Math.min(notes.length - 1, Math.round(gridMaxIndex - y / ROW_HEIGHT)));
        const newNote: NoteEvent = {beat: localBeat, beats: part.beats ?? 1, note: notes[pitchIndex]};
        placement.section.notes.push(newNote);
        selectedNote = {partIndex: activePartIndex, note: newNote};
        if (isMusicTrackPaused()) {
            auditionNote(newNote, part, definition.bpm);
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
        note.beat = Math.max(0, newGlobalBeat - placement.offset);
        const newPitchIndex = Math.max(0, Math.min(notes.length - 1,
            Math.round(dragState.startPitchIndex - deltaY / ROW_HEIGHT)));
        note.note = notes[newPitchIndex];
        delete note.frequency;
        // Only re-audition when the drag actually crosses into a new pitch, not on every
        // mousemove tick (most of which don't change the row at all).
        if (newPitchIndex !== dragState.lastAuditionedPitchIndex && isMusicTrackPaused()) {
            dragState.lastAuditionedPitchIndex = newPitchIndex;
            auditionNote(note, dragState.part, bpm);
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
            suppressNextClick = true;
            // renderPanel() below replaces the canvas that received this drag's mousedown with a
            // new element, so the synthetic 'click' that normally follows mouseup may land on the
            // (now-detached) old canvas and never reach the new one's listener at all - fall back
            // to clearing the flag on a timeout so it can't wrongly suppress some later click.
            setTimeout(() => { suppressNextClick = false; }, 0);
        }
        dragState = null;
        renderPanel();
    }
}

// Continues the playhead scrub started in the canvas 'mousedown' handler for as long as the mouse
// stays down over empty space - deliberately cheap (just the seek itself) rather than a renderPanel
// per mousemove; the playhead position updates on its own via the normal per-frame
// refreshTrackViewer, same as during ordinary playback.
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
