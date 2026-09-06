import {editingState} from 'app/development/editingState';
import {tagElement} from 'app/dom';
import {noteFrequencies, notes} from 'app/utils/noteFrequencies';
import {fadeOutPlayingTracks} from 'app/utils/sounds';
import {musicTrackHash} from 'app/utils/music/musicTrackHash';
import {getMusicTrackPlaybackPosition, playMusicTrack, stopMusicTrack} from 'app/utils/music/musicTrackPlayer';

// A piano-roll style debug viewer for note-based music tracks (app/utils/music/musicTrackHash.ts),
// so a track can be inspected/heard part-by-part instead of guessing from ear alone what's wrong.
// MVP: view all parts of a track on a shared beat/pitch grid with a live playhead. Editing
// pitch/beat/duration, toggling parts on/off, and export-to-clipboard are intentionally not part
// of this pass - the DOM structure below (one rect per note, one row per part in the legend) is
// meant to make those additions straightforward later without restructuring.
//
// Opened/closed with shift+M while the level editor is active (see addKeyboardShortcuts.ts).
// While open, editingState.trackViewerKey tells musicController to suppress normal zone/boss BGM
// (see musicController.ts) so the inspected track has the speakers to itself; the track itself
// plays via the normal playMusicTrack/updateMusicTrackPlayback path, untouched by that gate.

const PIXELS_PER_BEAT = 16;
const ROW_HEIGHT = 7;
const PART_COLORS = [
    '#4FC3F7', '#FF8A65', '#AED581', '#BA68C8',
    '#FFD54F', '#4DB6AC', '#F06292', '#90A4AE',
];

let panelElement: HTMLElement = null;
let scrollElement: HTMLElement = null;
let playheadElement: HTMLElement = null;
let positionLabel: HTMLElement = null;

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
    panelElement = playheadElement = positionLabel = scrollElement = null;
}

function openTrack(key: string): void {
    // Stop whatever the track viewer was previously playing (if anything) without the normal
    // crossfade - we want the newly selected track to start immediately.
    stopMusicTrack(0);
    // Also silence any mp3-based BGM that happened to already be playing.
    fadeOutPlayingTracks();
    editingState.trackViewerKey = key;
    renderPanel();
    playMusicTrack(key, {fadeDuration: 0});
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

function renderPanel(): void {
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
    positionLabel = tagElement('span', 'track-viewer-position');
    header.append(positionLabel);
    const closeButton = tagElement('button', 'track-viewer-close', '×');
    closeButton.onclick = () => closeTrackViewer();
    header.append(closeButton);
    panelElement.append(header);

    const legend = tagElement('div', 'track-viewer-legend');
    definition.parts.forEach((part, i) => {
        const item = tagElement('div', 'track-viewer-legend-item');
        const swatch = tagElement('span', 'track-viewer-swatch');
        swatch.style.backgroundColor = PART_COLORS[i % PART_COLORS.length];
        item.append(swatch);
        item.append(document.createTextNode(`${part.instrument}${part.volume != null ? ` (${part.volume})` : ''}`));
        legend.append(item);
    });
    panelElement.append(legend);

    const allNotes = definition.parts.flatMap(part => part.notes.map(note => ({note, part})));
    const maxNoteBeat = Math.max(0, ...allNotes.map(({note, part}) =>
        note.beat + getNoteBeats(note, part, definition.bpm)));
    const maxBeat = Math.max(definition.loopEndBeat ?? 0, maxNoteBeat);
    const pitchIndices = allNotes
        .map(({note, part}) => getPitchIndex(note.note ?? part.note, note.frequency ?? part.frequency))
        .filter(index => index !== null);
    const minIndex = Math.floor(Math.min(...pitchIndices, 48)) - 2;
    const maxIndex = Math.ceil(Math.max(...pitchIndices, 48)) + 2;

    const width = Math.ceil(maxBeat * PIXELS_PER_BEAT) + PIXELS_PER_BEAT;
    const height = (maxIndex - minIndex) * ROW_HEIGHT;

    const gridInner = tagElement('div', 'track-viewer-grid');
    gridInner.style.width = `${width}px`;
    gridInner.style.height = `${height}px`;

    const canvas = document.createElement('canvas');
    canvas.className = 'track-viewer-canvas';
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    drawBackground(context, definition, width, height, minIndex, maxIndex);
    definition.parts.forEach((part, i) => {
        drawPart(context, part, definition.bpm, PART_COLORS[i % PART_COLORS.length], minIndex, maxIndex);
    });
    gridInner.append(canvas);

    playheadElement = tagElement('div', 'track-viewer-playhead');
    playheadElement.style.height = `${height}px`;
    gridInner.append(playheadElement);

    scrollElement = tagElement('div', 'track-viewer-scroll');
    scrollElement.append(gridInner);
    panelElement.append(scrollElement);

    document.body.append(panelElement);
}

function drawBackground(
    context: CanvasRenderingContext2D, definition: MusicTrackDefinition,
    width: number, height: number, minIndex: number, maxIndex: number
): void {
    context.fillStyle = '#1b1b1b';
    context.fillRect(0, 0, width, height);
    // Shade the row for every C so octaves are easy to count by eye.
    for (let index = minIndex; index <= maxIndex; index++) {
        if (notes[index]?.startsWith('C') && notes[index]?.[1] !== 's') {
            const y = (maxIndex - index) * ROW_HEIGHT;
            context.fillStyle = 'rgba(255, 255, 255, 0.07)';
            context.fillRect(0, y, width, ROW_HEIGHT);
        }
    }
    // Vertical beat lines, heavier every 4 beats (one measure in 4/4).
    const totalBeats = Math.ceil(width / PIXELS_PER_BEAT);
    for (let beat = 0; beat <= totalBeats; beat++) {
        const x = beat * PIXELS_PER_BEAT;
        context.strokeStyle = (beat % 4 === 0) ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.1)';
        context.beginPath();
        context.moveTo(x + 0.5, 0);
        context.lineTo(x + 0.5, height);
        context.stroke();
    }
    if (definition.loopStartBeat) {
        drawVerticalMarker(context, definition.loopStartBeat * PIXELS_PER_BEAT, height, '#4CAF50');
    }
    if (definition.loopEndBeat) {
        drawVerticalMarker(context, definition.loopEndBeat * PIXELS_PER_BEAT, height, '#F44336');
    }
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

function drawPart(
    context: CanvasRenderingContext2D, part: MusicPart, bpm: number,
    color: string, minIndex: number, maxIndex: number
): void {
    context.fillStyle = color;
    for (const note of part.notes) {
        const index = getPitchIndex(note.note ?? part.note, note.frequency ?? part.frequency);
        if (index === null) {
            continue;
        }
        const x = note.beat * PIXELS_PER_BEAT;
        const w = Math.max(2, getNoteBeats(note, part, bpm) * PIXELS_PER_BEAT - 1);
        const y = (maxIndex - index) * ROW_HEIGHT;
        context.globalAlpha = note.volume ?? 1;
        context.fillRect(x, y, w, ROW_HEIGHT - 1);
        context.globalAlpha = 1;
    }
}

// Called every render frame (see client.ts) - cheap no-op when the viewer isn't open.
export function refreshTrackViewer(): void {
    if (!editingState.trackViewerKey || !playheadElement) {
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
    const x = position.beat * PIXELS_PER_BEAT;
    playheadElement.style.transform = `translateX(${x}px)`;
    if (positionLabel) {
        positionLabel.textContent = `beat ${position.beat.toFixed(2)}`;
    }
    if (scrollElement) {
        const viewWidth = scrollElement.clientWidth;
        if (x < scrollElement.scrollLeft || x > scrollElement.scrollLeft + viewWidth) {
            scrollElement.scrollLeft = Math.max(0, x - viewWidth / 2);
        }
    }
}
