import {musicTrackHash} from 'app/utils/music/musicTrackHash';
import {playNote} from 'app/utils/instruments/instrumentPlayer';
import {audioContext, trackGainNode} from 'app/utils/sounds';

// How far ahead of `audioContext.currentTime` to schedule notes. This needs to comfortably cover
// the gap between calls to `updateMusicTrackPlayback` (driven by the render loop) so playback
// never runs out of scheduled notes even if a frame is delayed.
const SCHEDULE_AHEAD_TIME = 0.2;
// Small buffer before playback actually starts, so the first note isn't scheduled in the past.
const START_DELAY = 0.1;

interface PartPlaybackState {
    part: MusicPart
    nextNoteIndex: number
    // Seconds to add to this part's note times to account for completed loop iterations.
    loopOffset: number
}

interface TrackPlaybackState {
    definition: MusicTrackDefinition
    startTime: number
    secondsPerBeat: number
    loopStartBeat: number
    loopEndBeat: number
    parts: PartPlaybackState[]
}

let currentPlayback: TrackPlaybackState | undefined;

function getTrackEndBeat(definition: MusicTrackDefinition): number {
    let maxBeat = 0;
    for (const part of definition.parts) {
        for (const note of part.notes) {
            maxBeat = Math.max(maxBeat, note.beat + note.duration);
        }
    }
    return maxBeat;
}

export function playMusicTrack(key: string): void {
    const definition = musicTrackHash[key];
    if (!definition) {
        throw new Error(`No music track defined for key: ${key}`);
    }
    currentPlayback = {
        definition,
        startTime: audioContext.currentTime + START_DELAY,
        secondsPerBeat: 60 / definition.bpm,
        loopStartBeat: definition.loopStartBeat ?? 0,
        loopEndBeat: definition.loopEndBeat ?? getTrackEndBeat(definition),
        parts: definition.parts.map(part => ({part, nextNoteIndex: 0, loopOffset: 0})),
    };
}

export function stopMusicTrack(): void {
    currentPlayback = undefined;
}

export function isMusicTrackPlaying(): boolean {
    return !!currentPlayback;
}

// Schedules any notes that fall within the lookahead window. Call this once per frame (it is
// cheap to call when nothing is playing or no notes are currently due).
export function updateMusicTrackPlayback(): void {
    if (!currentPlayback) {
        return;
    }
    const {definition, startTime, secondsPerBeat, loopStartBeat, loopEndBeat} = currentPlayback;
    const loopLengthBeats = loopEndBeat - loopStartBeat;
    const scheduleUntil = audioContext.currentTime + SCHEDULE_AHEAD_TIME;
    for (const partState of currentPlayback.parts) {
        const {part} = partState;
        while (true) {
            if (partState.nextNoteIndex >= part.notes.length) {
                if (!definition.loop || loopLengthBeats <= 0) {
                    break;
                }
                const loopStartIndex = part.notes.findIndex(note => note.beat >= loopStartBeat);
                if (loopStartIndex === -1) {
                    break;
                }
                partState.nextNoteIndex = loopStartIndex;
                partState.loopOffset += loopLengthBeats * secondsPerBeat;
                continue;
            }
            const note = part.notes[partState.nextNoteIndex];
            const noteTime = startTime + partState.loopOffset + note.beat * secondsPerBeat;
            if (noteTime >= scheduleUntil) {
                break;
            }
            if (note.note !== undefined) {
                playNote({
                    destination: trackGainNode,
                    time: noteTime,
                    instrument: part.instrument,
                    noteOrFrequency: note.note,
                    volume: (note.volume ?? 1) * (part.volume ?? 1),
                    duration: note.duration * secondsPerBeat,
                });
            }
            partState.nextNoteIndex++;
        }
    }
}

window['playMusicTrack'] = playMusicTrack;
window['stopMusicTrack'] = stopMusicTrack;
