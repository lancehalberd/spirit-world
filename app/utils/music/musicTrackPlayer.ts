import {musicTrackHash} from 'app/utils/music/musicTrackHash';
import {playNote} from 'app/utils/instruments/instrumentPlayer';
import {audioContext, trackGainNode} from 'app/utils/sounds';

// How far ahead of `audioContext.currentTime` to schedule notes. This needs to comfortably cover
// the gap between calls to `updateMusicTrackPlayback` (driven by the render loop) so playback
// never runs out of scheduled notes even if a frame is delayed.
const SCHEDULE_AHEAD_TIME = 0.2;
// Small buffer before playback actually starts, so the first note isn't scheduled in the past.
const START_DELAY = 0.1;
// Matches the crossfade ramp time `playTrack` uses for the mp3-based tracks in app/utils/sounds.ts.
const DEFAULT_FADE_DURATION = 1;

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
    // Each playback gets its own gain node (feeding into trackGainNode) so it can be faded
    // in/out independently of any other track that happens to be playing at the same time.
    gainNode: GainNode
    // Set once this playback is fading out. Once audioContext.currentTime passes this, the
    // playback is dropped: no further notes are scheduled for it and its gain node is disconnected.
    stopAtTime?: number
}

// Usually just one entry, but a fading-out track and its incoming replacement briefly overlap.
let activePlaybacks: TrackPlaybackState[] = [];

// The loop length is deliberately based only on where notes *start*, not how long they ring -
// some instruments (a sustained pad, a long bell decay) shouldn't be forced to fit inside a
// single beat at high BPM just because that's where the loop wraps. A note that rings past the
// loop point simply keeps sounding on its own schedule, overlapping into the next pass; nothing
// here ever stops a note early.
function getTrackEndBeat(definition: MusicTrackDefinition): number {
    let maxBeat = 0;
    for (const part of definition.parts) {
        for (const note of part.notes) {
            maxBeat = Math.max(maxBeat, Math.floor(note.beat + 1));
        }
    }
    return maxBeat;
}

function fadeOutPlayback(playback: TrackPlaybackState, fadeDuration: number): void {
    if (playback.stopAtTime !== undefined) {
        return;
    }
    const now = audioContext.currentTime;
    const currentVolume = playback.gainNode.gain.value;
    playback.gainNode.gain.cancelScheduledValues(now);
    if (fadeDuration > 0) {
        playback.gainNode.gain.setValueAtTime(currentVolume, now);
        playback.gainNode.gain.linearRampToValueAtTime(0, now + fadeDuration);
        playback.stopAtTime = now + fadeDuration;
    } else {
        playback.gainNode.gain.setValueAtTime(0, now);
        playback.stopAtTime = now;
    }
}

interface PlayMusicTrackOptions {
    // Seconds to fade the new track in over, and to fade any currently playing track(s) out over.
    // Pass 0 for a hard cut.
    fadeDuration?: number
}

export function playMusicTrack(key: string, {fadeDuration = DEFAULT_FADE_DURATION}: PlayMusicTrackOptions = {}): void {
    const definition = musicTrackHash[key];
    if (!definition) {
        throw new Error(`No music track defined for key: ${key}`);
    }
    // Don't restart a track that is already playing (and not already on its way out).
    if (activePlaybacks.some(playback => playback.definition.key === key && playback.stopAtTime === undefined)) {
        return;
    }
    for (const playback of activePlaybacks) {
        fadeOutPlayback(playback, fadeDuration);
    }
    const startTime = audioContext.currentTime + START_DELAY;
    const gainNode = audioContext.createGain();
    gainNode.connect(trackGainNode);
    if (fadeDuration > 0) {
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(1, startTime + fadeDuration);
    } else {
        gainNode.gain.setValueAtTime(1, startTime);
    }
    activePlaybacks.push({
        definition,
        startTime,
        secondsPerBeat: 60 / definition.bpm,
        loopStartBeat: definition.loopStartBeat ?? 0,
        loopEndBeat: definition.loopEndBeat ?? getTrackEndBeat(definition),
        parts: definition.parts.map(part => ({part, nextNoteIndex: 0, loopOffset: 0})),
        gainNode,
    });
}

export function stopMusicTrack(fadeDuration = DEFAULT_FADE_DURATION): void {
    for (const playback of activePlaybacks) {
        fadeOutPlayback(playback, fadeDuration);
    }
}

export function isMusicTrackPlaying(): boolean {
    return activePlaybacks.some(playback => playback.stopAtTime === undefined);
}

export interface MusicTrackPlaybackPosition {
    key: string
    // Elapsed beats since this playback started, ignoring looping.
    rawBeat: number
    // Current beat position, wrapped into [loopStartBeat, loopEndBeat) once the loop has been
    // reached. Equal to rawBeat before that point.
    beat: number
}

// Playback position of the currently active (not fading out) track, for driving a UI playhead
// (see app/development/trackViewer.ts). Returns null if nothing is playing.
export function getMusicTrackPlaybackPosition(): MusicTrackPlaybackPosition | null {
    const playback = activePlaybacks.find(p => p.stopAtTime === undefined);
    if (!playback) {
        return null;
    }
    const {definition, startTime, secondsPerBeat, loopStartBeat, loopEndBeat} = playback;
    const rawBeat = Math.max(0, (audioContext.currentTime - startTime) / secondsPerBeat);
    let beat = rawBeat;
    const loopLength = loopEndBeat - loopStartBeat;
    if (definition.loop && loopLength > 0 && beat > loopStartBeat) {
        beat = loopStartBeat + (beat - loopStartBeat) % loopLength;
    }
    return {key: definition.key, rawBeat, beat};
}

// Schedules any notes that fall within the lookahead window. Call this once per frame (it is
// cheap to call when nothing is playing or no notes are currently due).
export function updateMusicTrackPlayback(): void {
    if (!activePlaybacks.length) {
        return;
    }
    const now = audioContext.currentTime;
    const scheduleUntil = now + SCHEDULE_AHEAD_TIME;
    for (const playback of activePlaybacks) {
        const {definition, startTime, secondsPerBeat, loopStartBeat, loopEndBeat, gainNode} = playback;
        const loopLengthBeats = loopEndBeat - loopStartBeat;
        for (const partState of playback.parts) {
            const {part} = partState;
            const partDuration = part.beats ? part.beats * secondsPerBeat : part.duration ?? secondsPerBeat;
            while (true) {
                if (partState.nextNoteIndex >= part.notes.length) {
                    // Don't start another loop iteration once this playback is fading out;
                    // just let its already-scheduled notes finish under the fade.
                    if (!definition.loop || loopLengthBeats <= 0 || playback.stopAtTime !== undefined) {
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
                try {
                    const noteDuration = note.beats ? note.beats * secondsPerBeat : note.duration;
                    playNote({
                        destination: gainNode,
                        time: noteTime,
                        instrument: part.instrument,
                        noteOrFrequency: note.note ?? note.frequency ?? part.note ?? part.frequency,
                        volume: (note.volume ?? 1) * (part.volume ?? 1),
                        duration: noteDuration ?? partDuration,
                    });
                } catch (e) {
                    debugger;
                    throw e;
                }
                partState.nextNoteIndex++;
            }
        }
    }
    activePlaybacks = activePlaybacks.filter(playback => {
        if (playback.stopAtTime !== undefined && playback.stopAtTime <= now) {
            playback.gainNode.disconnect(trackGainNode);
            return false;
        }
        return true;
    });
}

window['playMusicTrack'] = playMusicTrack;
window['stopMusicTrack'] = stopMusicTrack;
