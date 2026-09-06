import {populatePartNotes} from 'app/utils/music/composeSections';
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
// Nudges a just-wrapped watermark strictly below loopStartBeat so a note landing exactly on
// loopStartBeat (a common, deliberate choice when authoring a loop) still re-qualifies as "ahead
// of the watermark" on the pass right after wrapping.
const LOOP_EPSILON = 1e-6;
// Default fade for pause/resume - short enough to feel instant, long enough to avoid a click from
// stepping the gain abruptly. Callers wanting a truly instant response (e.g. a keyboard toggle)
// can still pass 0.
const PAUSE_FADE_DURATION = 0.05;

interface PartPlaybackState {
    part: MusicPart
    // Beat (compared directly against note.beat, in the track's own loop-local coordinate space)
    // through which scheduling has already happened. Re-derived by scanning `part.notes` fresh
    // every tick rather than persisting an array index/cursor, specifically so the track viewer
    // (app/development/trackViewer.ts) can add/remove/reorder/replace notes in a live part's
    // `notes` array without desyncing playback - there's no stale index to invalidate, just a
    // watermark that's always re-checked against whatever the array currently contains.
    scheduledThroughBeat: number
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
    // Each playback gets its own gain node so it can be faded in/out independently of any other
    // track that happens to be playing at the same time.
    gainNode: GainNode
    // What gainNode connects to (see PlayMusicTrackOptions.destination) - kept so cleanup below
    // disconnects from the right node rather than assuming trackGainNode.
    destination: AudioNode
    // Set once this playback is fading out. Once audioContext.currentTime passes this, the
    // playback is dropped: no further notes are scheduled for it and its gain node is disconnected.
    stopAtTime?: number
    // Indices into `definition.parts` that should be silenced. Bookkeeping (nextNoteIndex/
    // loopOffset) still advances normally for muted parts - only the actual playNote call is
    // skipped - so un-muting resumes in sync instead of skipping/duplicating notes. Driven live
    // by the track viewer (see setPlaybackMutedParts, app/development/trackViewer.ts); empty for
    // any other playback.
    mutedPartIndices: Set<number>
    // While true, updateMusicTrackPlayback skips this playback entirely (no new notes scheduled)
    // and getMusicTrackPlaybackPosition reports a frozen position instead of one derived live from
    // audioContext.currentTime - see pauseMusicTrack/resumeMusicTrack.
    paused: boolean
    // The position (see MusicTrackPlaybackPosition.rawBeat) at the moment this playback was last
    // paused - audioContext.currentTime keeps advancing while paused, so this is what
    // resumeMusicTrack seeks back to rather than wherever the clock has drifted to since.
    pausedAtRawBeat: number
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
        // playMusicTrack calls populatePartNotes on every part before this ever runs.
        for (const note of part.notes!) {
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
    // Where this playback's gain node connects. Defaults to trackGainNode (subject to the game's
    // music mute/volume settings, like every normal BGM use of this function); the track viewer
    // (app/development/trackViewer.ts) passes trackViewerGainNode instead so muting the game's
    // music doesn't also silence the track it's inspecting.
    destination?: AudioNode
}

export function playMusicTrack(
    key: string, {fadeDuration = DEFAULT_FADE_DURATION, destination = trackGainNode}: PlayMusicTrackOptions = {}
): void {
    const definition = musicTrackHash[key];
    if (!definition) {
        throw new Error(`No music track defined for key: ${key}`);
    }
    // Don't restart a track that is already playing (and not already on its way out).
    if (activePlaybacks.some(playback => playback.definition.key === key && playback.stopAtTime === undefined)) {
        return;
    }
    // A part authored via `placements` (see musicTrackHash.ts) leaves `notes` unpopulated until
    // something needs it - this is that "something." Must happen before getTrackEndBeat below,
    // which also reads `part.notes`.
    for (const part of definition.parts) {
        populatePartNotes(part);
    }
    for (const playback of activePlaybacks) {
        fadeOutPlayback(playback, fadeDuration);
    }
    const startTime = audioContext.currentTime + START_DELAY;
    const gainNode = audioContext.createGain();
    gainNode.connect(destination);
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
        parts: definition.parts.map(part => ({part, scheduledThroughBeat: -Infinity, loopOffset: 0})),
        gainNode,
        destination,
        mutedPartIndices: new Set(),
        paused: false,
        pausedAtRawBeat: 0,
    });
}

// Silences the currently active (not fading out) playback and stops it from scheduling any new
// notes, without discarding its position - resumeMusicTrack picks up from exactly where this left
// off. Notes already scheduled in the lookahead window finish playing out (Web Audio can't
// unschedule an already-started oscillator); with the default fade that's inaudible in practice.
export function pauseMusicTrack(fadeDuration = PAUSE_FADE_DURATION): void {
    const playback = activePlaybacks.find(p => p.stopAtTime === undefined);
    if (!playback || playback.paused) {
        return;
    }
    // Must read the live position before flipping `paused` - getMusicTrackPlaybackPosition
    // reports the frozen pausedAtRawBeat once paused is true, which at this point would still be
    // stale (0, or wherever an earlier pause left it).
    playback.pausedAtRawBeat = getMusicTrackPlaybackPosition()?.rawBeat ?? 0;
    playback.paused = true;
    const now = audioContext.currentTime;
    playback.gainNode.gain.cancelScheduledValues(now);
    playback.gainNode.gain.setValueAtTime(playback.gainNode.gain.value, now);
    playback.gainNode.gain.linearRampToValueAtTime(0, now + Math.max(0, fadeDuration));
}

// Reverses pauseMusicTrack: reseeks to the exact position playback was paused at (see
// pausedAtRawBeat) and restores the volume.
export function resumeMusicTrack(fadeDuration = PAUSE_FADE_DURATION): void {
    const playback = activePlaybacks.find(p => p.stopAtTime === undefined);
    if (!playback || !playback.paused) {
        return;
    }
    playback.paused = false;
    seekMusicTrackPlayback(playback.pausedAtRawBeat);
    const now = audioContext.currentTime;
    playback.gainNode.gain.cancelScheduledValues(now);
    playback.gainNode.gain.setValueAtTime(playback.gainNode.gain.value, now);
    playback.gainNode.gain.linearRampToValueAtTime(1, now + Math.max(0, fadeDuration));
}

// Whether the currently active (not fading out) playback is paused. False if nothing is playing.
export function isMusicTrackPaused(): boolean {
    const playback = activePlaybacks.find(p => p.stopAtTime === undefined);
    return !!playback?.paused;
}

// Live-mutes/unmutes parts of the currently active (not fading out) playback by index into its
// track's `parts` array. Takes the Set by reference so the caller can keep mutating the same
// instance (e.g. on a checkbox toggle) without calling this again. Used by the track viewer to
// let a part be silenced without affecting the sequencing of the rest of the track.
export function setPlaybackMutedParts(mutedPartIndices: Set<number>): void {
    const playback = activePlaybacks.find(p => p.stopAtTime === undefined);
    if (playback) {
        playback.mutedPartIndices = mutedPartIndices;
    }
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
// (see app/development/trackViewer.ts). Returns null if nothing is playing. Frozen at
// pausedAtRawBeat while paused - audioContext.currentTime doesn't stop advancing just because
// we've stopped scheduling notes, so deriving this live from it while paused would make the
// playhead keep drifting forward even though nothing is audibly happening.
export function getMusicTrackPlaybackPosition(): MusicTrackPlaybackPosition | null {
    const playback = activePlaybacks.find(p => p.stopAtTime === undefined);
    if (!playback) {
        return null;
    }
    const {definition, startTime, secondsPerBeat, loopStartBeat, loopEndBeat, paused, pausedAtRawBeat} = playback;
    const rawBeat = paused ? pausedAtRawBeat : Math.max(0, (audioContext.currentTime - startTime) / secondsPerBeat);
    let beat = rawBeat;
    const loopLength = loopEndBeat - loopStartBeat;
    if (definition.loop && loopLength > 0 && beat > loopStartBeat) {
        beat = loopStartBeat + (beat - loopStartBeat) % loopLength;
    }
    return {key: definition.key, rawBeat, beat};
}

// Repositions the currently active (not fading out) playback so "now" corresponds to `beat`,
// without restarting it: notes already scheduled near the old position simply finish playing out
// (Web Audio can't unschedule an already-started oscillator), and notes at the new position get
// scheduled starting on the very next updateMusicTrackPlayback tick. Works the same whether or not
// the playback is currently paused (including one that's never been resumed yet) - if paused,
// pausedAtRawBeat is updated too, since that (not startTime/audioContext.currentTime) is what
// getMusicTrackPlaybackPosition reports and what resumeMusicTrack seeks back to; without this a
// seek made while paused would be silently discarded the moment playback resumed. Used by the
// track viewer's click-to-seek.
export function seekMusicTrackPlayback(beat: number): void {
    const playback = activePlaybacks.find(p => p.stopAtTime === undefined);
    if (!playback) {
        return;
    }
    const {definition, secondsPerBeat, loopStartBeat, loopEndBeat} = playback;
    beat = Math.max(0, beat);
    playback.startTime = audioContext.currentTime - beat * secondsPerBeat;
    if (playback.paused) {
        playback.pausedAtRawBeat = beat;
    }
    const loopLength = loopEndBeat - loopStartBeat;
    let loopLocalBeat = beat;
    let loopOffset = 0;
    if (definition.loop && loopLength > 0 && beat > loopStartBeat) {
        const iterations = Math.floor((beat - loopStartBeat) / loopLength);
        loopLocalBeat = loopStartBeat + (beat - loopStartBeat) % loopLength;
        loopOffset = iterations * loopLength * secondsPerBeat;
    }
    for (const partState of playback.parts) {
        partState.loopOffset = loopOffset;
        partState.scheduledThroughBeat = loopLocalBeat - LOOP_EPSILON;
    }
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
        if (playback.paused) {
            continue;
        }
        const {definition, startTime, secondsPerBeat, loopStartBeat, loopEndBeat, gainNode, mutedPartIndices} = playback;
        const loopLengthBeats = loopEndBeat - loopStartBeat;
        for (let partIndex = 0; partIndex < playback.parts.length; partIndex++) {
            const partState = playback.parts[partIndex];
            const {part} = partState;
            const isMuted = mutedPartIndices.has(partIndex);
            const partDuration = part.beats ? part.beats * secondsPerBeat : part.duration ?? secondsPerBeat;
            // playMusicTrack calls populatePartNotes on every part before any playback reaches
            // this scheduling loop.
            const partNotes = part.notes!;
            while (true) {
                // Find the smallest note beat still ahead of what's already been scheduled - see
                // the scheduledThroughBeat comment on PartPlaybackState for why this re-scans
                // `part.notes` instead of walking a persisted index.
                let nextBeat = Infinity;
                for (const note of partNotes) {
                    if (note.beat > partState.scheduledThroughBeat && note.beat < nextBeat) {
                        nextBeat = note.beat;
                    }
                }
                if (nextBeat === Infinity) {
                    // Don't start another loop iteration once this playback is fading out;
                    // just let its already-scheduled notes finish under the fade.
                    if (!definition.loop || loopLengthBeats <= 0 || playback.stopAtTime !== undefined) {
                        break;
                    }
                    partState.scheduledThroughBeat = loopStartBeat - LOOP_EPSILON;
                    partState.loopOffset += loopLengthBeats * secondsPerBeat;
                    continue;
                }
                const noteTime = startTime + partState.loopOffset + nextBeat * secondsPerBeat;
                if (noteTime >= scheduleUntil) {
                    break;
                }
                if (!isMuted) {
                    // Schedule every note sharing this exact beat (chords are just multiple
                    // entries at the same beat - see musicTrackHash.ts).
                    for (const note of partNotes) {
                        if (note.beat !== nextBeat) {
                            continue;
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
                    }
                }
                partState.scheduledThroughBeat = nextBeat;
            }
        }
    }
    activePlaybacks = activePlaybacks.filter(playback => {
        if (playback.stopAtTime !== undefined && playback.stopAtTime <= now) {
            playback.gainNode.disconnect(playback.destination);
            return false;
        }
        return true;
    });
}

window['playMusicTrack'] = playMusicTrack;
window['stopMusicTrack'] = stopMusicTrack;
