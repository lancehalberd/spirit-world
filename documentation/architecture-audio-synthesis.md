# Audio synthesis architecture

Companion to [CLAUDE.md](../CLAUDE.md). Covers the Web Audio-based instrument/music-track system under `app/utils/instruments/` and `app/utils/music/` — synthesizing individual notes and sequencing them into tracks, as opposed to the pre-rendered mp3 `GameTrack`s in `app/utils/sounds.ts`.

## Instrument system
- `app/utils/instruments/instrumentHash.ts` — registry (`instruments[name]`) + the `Instrument`/`InstrumentPlayNoteParams`/`InstrumentName` global types. Same registry pattern as `objectHash` etc: each `app/utils/instruments/*.ts` file assigns itself in at module-load time.
- `app/utils/instruments/instrumentPlayer.ts` — `playNote({instrument, noteOrFrequency, time, duration, volume, destination})`, the single entry point everything else (manual console calls, the music track scheduler) goes through. Resolves a `Note` name via `noteFrequencies` (`app/utils/noteFrequencies.ts`) or accepts a raw frequency.
- `app/utils/instruments/noiseBuffer.ts` — shared white-noise `AudioBuffer` for percussion instruments (snare, hihat). See "Noise" below for why this exists instead of reusing `app/utils/sounds.ts`'s pink/white noise AudioWorklet nodes.
- Current instruments: `bell`, `harp`, `hihat`, `zeldaSquare`, `kick`, `snare`, `bass`. Each file documents the sources that were actually useful for tuning it — check there before re-deriving a technique from scratch.

## Music track system
- `app/utils/music/musicTrackHash.ts` — data model: `MusicTrackDefinition` (bpm, parts, optional loop range) → `MusicPart` (instrument + notes) → `NoteEvent` (beat offset, duration, note/frequency, volume). Beats are quarter notes; a note's `beat`/`duration` are relative to the start of its part. Chords are just multiple `NoteEvent`s sharing a `beat`.
- `app/utils/music/musicTrackPlayer.ts` — `playMusicTrack(key, {fadeDuration})` / `stopMusicTrack(fadeDuration)` / `updateMusicTrackPlayback()`. Uses the standard lookahead-scheduler technique (schedules ~200ms ahead of `audioContext.currentTime` rather than trusting JS timer precision); driven once per frame from `app/client.ts`'s render loop, alongside `updateMusic(state)`.
- Crossfading: each `playMusicTrack` call gets its own `GainNode` (feeding into the shared `trackGainNode` bus from `app/utils/sounds.ts`), so an outgoing and incoming track can ramp independently and overlap during a transition instead of sharing one gain.
- Looping: `loopStartBeat`/`loopEndBeat` mark a range that repeats indefinitely once reached, so anything before `loopStartBeat` plays once as an intro. Mirrors the existing `nextTrack`-chaining pattern used for the mp3 boss music (`bossIntro → bossA → bossB → bossA` in `app/utils/sounds.ts`).
- `app/content/music/*.ts` — hand-authored tracks, self-registering into `musicTrackHash`, same pattern as zone files registering into `zones`.

## Synthesis notes (learned the hard way)
- **Verify against a known recipe, don't design from theory alone.** Nobody in this loop can actually hear the output while writing the code, so "this seems like it should sound right" is not a reliable check. Look up how a real (or well-documented software) instrument of the same kind is actually built, then implement *that*, and check the implementation against the recipe rather than against your own ear.
- **A drum's "click"/transient is usually just its main envelope, not an extra layer.** A kick's click comes from how fast its pitch envelope decays (~20-70ms), not from a second oscillator playing at the same time. Layering an unrelated tone on top for "attack" tends to just sound like two colliding pitches (harsh/metallic) rather than a transient.
- **Percussion "noise" needs to actually be noise.** A stack of detuned oscillators (even at inharmonic ratios) is still periodic and reads as buzzy/metallic, not broadband. Use `noiseBuffer.ts`'s shared `AudioBuffer` of random samples through a highpass/bandpass filter instead. (The project's existing `pinkNoiseNode`/`whiteNoiseNode` in `app/utils/sounds.ts` are AudioWorklet nodes that load asynchronously and aren't exported outside that file — a plain buffer sidesteps both issues and is generated synchronously.)
- **Randomize noise playback offset.** Reading a noise buffer from the same start point every time makes repeated short hits (e.g. a run of hihat eighth notes) sound identical/phasey. `getRandomNoiseOffset()` picks a random start point per hit.

## Gotchas
- Instruments only receive a `frequency`, not a semantic "this is percussion" flag — percussion instruments (kick/snare/hihat) just treat it as a base pitch to derive their internal ratios/cutoffs from, which is why note choice still has an audible (if secondary) effect on them.
- `playMusicTrack`/`stopMusicTrack` no-op if the requested track is already the active, non-fading one — safe to call every frame the way `updateMusic` already does with `playTrack`.
