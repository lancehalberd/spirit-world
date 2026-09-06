import {audioContext} from 'app/utils/sounds';
import {instruments} from 'app/utils/instruments/instrumentHash';
import {createWhiteNoiseSource, getRandomNoiseOffset} from 'app/utils/instruments/noiseBuffer';

// Additive synthesis, same shape as bell.ts/harp.ts: a handful of sine partials with decaying
// per-partial volume and duration. Three piano-specific things distinguish it from those - the
// first version of this file only had the inharmonicity, and still read as "plucked" rather than
// "struck" as a result:
// - Decay time is sized from the note's pitch alone, not from `duration` (the note's rhythmic
//   length) - a real piano key doesn't change how fast the *string* decays by being held longer.
//   `duration` still matters, but as a damper cutoff rather than the decay's timer: if the string
//   would still be ringing when the key is released, it gets muted quickly (not instantly - an
//   abrupt stop would click) instead of continuing its full natural decay; if the string has
//   already died out on its own before that point, releasing the key does nothing audible, same
//   as on a real piano. Tying decay length directly to the note's rhythmic duration (as every
//   other instrument here correctly does for plucked/percussive sounds) is what made this sound
//   plucked: a pluck's ring time IS roughly how long it was played; a struck piano string's is a
//   property of the string and the damper, not of the note's notated length.
// - A two-stage decay: real piano notes have 2-3 unison strings per key that are very slightly
//   mistuned, so the tone decays quickly at first (energy draining into the soundboard while the
//   strings are still in phase) and then more slowly as the strings drift out of phase - giving a
//   longer perceived tail than one clean exponential decay produces.
// - Inharmonicity: real piano strings are stiff, which raises the wave-propagation speed for
//   higher harmonics and "stretches" them sharp of pure integer ratios: f_n = n*f0*sqrt(1+B*n^2).
//   B varies by string in a real piano (bass strings are wound partly to *counteract* this); a
//   single fixed B across the whole range is a simplification, not a register-accurate model.
// Sources:
// - https://shorepine.github.io/amy/piano.html (inharmonicity formula, higher harmonics decay
//   faster than lower ones, hammer-strike framing)
// - https://ccrma.stanford.edu/CCRMA/Courses/152/keyboard.html (two-stage decay from
//   slightly-mistuned unison strings drifting out of phase; struck-vs-plucked attack/decay
//   character)
// - f_n = n*f0*sqrt(1+B*n^2) is standard piano-acoustics literature; B ~ 1e-3 is a typical
//   textbook figure for piano strings, used here as a fixed approximation.
//
// Every tunable number below is a live-editable property of `pianoParams` (also on
// `window.pianoParams`) instead of a `const`, specifically so it can be dialed in from the
// console without a rebuild - e.g. `pianoParams.hammerGain = 0` isolates whether the hammer
// noise or the tonal partials are responsible for a given complaint, `pianoParams.damperMuteTime
// = 0.15` tries a slower damper. Once a value is settled, fold it back in as the new default here
// (and note *why* in this comment) rather than leaving tuning to rely on a runtime override.
export const pianoParams = {
    partialCount: 8,
    inharmonicityCoefficient: 0.0008,
    partialVolumeFactor: 0.88,
    partialDecayFactor: 0.8,
    attackTime: 0.005,
    // The fraction of a partial's decay time spent in the fast initial stage before the slower tail.
    decayKneeFraction: 0.2,
    decayKneeVolumeFraction: 0.3,
    // getNaturalDecayTime(frequency) = max(decayFloor, decayBaseTime - log2(frequency/55) * decaySlope).
    decayBaseTime: 3.2,
    decaySlope: 0.55,
    decayFloor: 0.5,
    // How long the damper takes to fully mute a still-ringing string once the key is released.
    // Not instant (a hard stop would click) but much quicker than the natural decay it
    // interrupts. Piano dampers vary by register in reality (the top ~1.5 octaves of a real
    // piano have no dampers at all and always ring out) - this is a single fixed approximation.
    // 0.2 confirmed by ear (2026-09) - indistinguishable between 'linear' and 'exponential' at
    // this length, so the curve mostly mattered when the mute was fast enough to be noticed as
    // its own event; at 0.2s either curve just reads as "the note stopped."
    damperMuteTime: 0.2,
    // 'exponential' drops fastest right at release (most of the audible loss happens in the
    // first fraction of damperMuteTime, which can read as more sudden than the same duration
    // spent linearly) - 'linear' spreads the drop evenly across damperMuteTime instead.
    damperCurve: 'linear' as 'exponential' | 'linear',
    // The felt-hammer strike transient: filtered noise under the tonal partials, not replacing
    // them. Set hammerGain to 0 to isolate whether the tonal partials alone still sound twangy.
    hammerGain: 0.5,
    hammerAttackTime: 0.001,
    hammerStrikeDuration: 0.05,
    // Cutoff = hammerLowpassFrequency + frequency * hammerLowpassFrequencyMultiplier - additive,
    // not a min()/max() against the register-scaled term, so this always has a visible effect
    // regardless of note pitch. (A previous version used Math.min() as a ceiling against the
    // register term, which meant raising this did nothing for any note where the register term
    // was already below it - silently inert for most of the keyboard.)
    hammerLowpassFrequency: 400,
    hammerLowpassFrequencyMultiplier: 0,
    // The tonal partial stack's own filter, separate from the hammer transient: `partialCount`
    // sine partials (further spread apart by inharmonicity) all attacking together buzz on their
    // own, confirmed by ear (2026-09) with the hammer muted entirely. A *fixed* cutoff behaves
    // inconsistently across registers - too little relative filtering for low notes (still
    // buzzy), too much for high notes (too quiet) - so this is proportional to `frequency` by
    // default (toneFilterFrequency near 0) rather than a fixed Hz value, keeping the same ratio
    // of let-through partials at every pitch. Cutoff = toneFilterFrequency + frequency *
    // toneFilterFrequencyMultiplier. Set toneFilterType to 'none' to A/B against unfiltered.
    toneFilterType: 'lowpass' as 'lowpass' | 'bandpass' | 'none',
    toneFilterFrequency: 0,
    toneFilterFrequencyMultiplier: 4,
    // Only used when toneFilterType is 'bandpass' - higher Q narrows the band around the cutoff.
    toneFilterQ: 1,
};
window['pianoParams'] = pianoParams;

function getNaturalDecayTime(frequency: number): number {
    const {decayBaseTime, decaySlope, decayFloor} = pianoParams;
    return Math.max(decayFloor, decayBaseTime - Math.log2(frequency / 55) * decaySlope);
}

function getPianoPartialFrequencies(baseFrequency: number): number[] {
    const {partialCount, inharmonicityCoefficient} = pianoParams;
    const partials: number[] = [];
    for (let n = 1; n <= partialCount; n++) {
        partials.push(n * baseFrequency * Math.sqrt(1 + inharmonicityCoefficient * n * n));
    }
    return partials;
}

// Schedules the attack + two-stage decay, cut short by a damper mute if the key is released
// (`releaseOffset`, measured from the end of the attack) before the string would have died out
// naturally (`decayTime`). Returns how long the envelope actually lasts, for sizing `stop()`.
function scheduleDampedEnvelope(
    gain: AudioParam, time: number, peakVolume: number, kneeTime: number, decayTime: number, releaseOffset: number
): number {
    const {attackTime, decayKneeVolumeFraction, damperMuteTime, damperCurve} = pianoParams;
    const kneeVolume = Math.max(0.001, peakVolume * decayKneeVolumeFraction);
    gain.setValueAtTime(0, time);
    gain.linearRampToValueAtTime(peakVolume, time + attackTime);
    if (releaseOffset >= decayTime) {
        // The string already dies out on its own before the key is released - no damper needed.
        gain.exponentialRampToValueAtTime(kneeVolume, time + attackTime + kneeTime);
        gain.exponentialRampToValueAtTime(0.001, time + attackTime + decayTime);
        return attackTime + decayTime;
    }
    let valueAtRelease: number;
    if (releaseOffset <= kneeTime) {
        valueAtRelease = peakVolume * Math.pow(kneeVolume / peakVolume, releaseOffset / kneeTime);
    } else {
        gain.exponentialRampToValueAtTime(kneeVolume, time + attackTime + kneeTime);
        valueAtRelease = kneeVolume * Math.pow(0.001 / kneeVolume, (releaseOffset - kneeTime) / (decayTime - kneeTime));
    }
    const releaseTime = time + attackTime + releaseOffset;
    const muteEndTime = releaseTime + damperMuteTime;
    gain.exponentialRampToValueAtTime(Math.max(0.001, valueAtRelease), releaseTime);
    if (damperCurve === 'linear') {
        gain.linearRampToValueAtTime(0, muteEndTime);
    } else {
        gain.exponentialRampToValueAtTime(0.001, muteEndTime);
    }
    return attackTime + releaseOffset + damperMuteTime;
}

function playPianoNote({frequency, volume, time, destination, duration}: InstrumentPlayNoteParams) {
    const combinedGainNode = audioContext.createGain();
    combinedGainNode.gain.value = volume;

    //const {toneFilterType, toneFilterFrequency, toneFilterFrequencyMultiplier, toneFilterQ} = pianoParams;
    let toneOutputNode: AudioNode = combinedGainNode;
    /*if (toneFilterType !== 'none') {
        const toneFilterNode = audioContext.createBiquadFilter();
        toneFilterNode.type = toneFilterType;
        toneFilterNode.frequency.value = toneFilterFrequency + frequency * toneFilterFrequencyMultiplier;
        if (toneFilterType === 'bandpass') {
            toneFilterNode.Q.value = toneFilterQ;
        }
        combinedGainNode.connect(toneFilterNode);
        toneOutputNode = toneFilterNode;
    }*/
    // Soft hits are dull; hard hits are bright (Velocity-Sensitive)
    const initialCutoff = frequency / 2;

    const toneFilterNode = audioContext.createBiquadFilter();
    toneFilterNode.frequency.value = initialCutoff
    // Sweeps down as the note decays, swallowing the buzz
    // toneFilterNode.frequency.exponentialRampToValueAtTime(initialCutoff / 2, time + duration);
    combinedGainNode.connect(toneFilterNode);
    toneOutputNode = toneFilterNode;

    toneOutputNode.connect(destination);

    const releaseOffset = Math.max(0, duration - pianoParams.attackTime);
    let partialVolume = 1;
    let partialDecayTime = getNaturalDecayTime(frequency);
    let maxEnvelopeLength = 0;
    for (const partialFrequency of getPianoPartialFrequencies(frequency)) {
        const kneeTime = partialDecayTime * pianoParams.decayKneeFraction;
        const gainNode = audioContext.createGain();
        const envelopeLength = scheduleDampedEnvelope(
            gainNode.gain, time, partialVolume, kneeTime, partialDecayTime, releaseOffset
        );
        maxEnvelopeLength = Math.max(maxEnvelopeLength, envelopeLength);
        const oscillator = audioContext.createOscillator();
        oscillator.type = 'sine';
        oscillator.frequency.value = partialFrequency;
        oscillator.connect(gainNode);
        oscillator.start(time);
        oscillator.stop(time + envelopeLength + 0.02);
        oscillator.onended = () => {
            oscillator.disconnect(gainNode);
            gainNode.disconnect(combinedGainNode);
        };
        gainNode.connect(combinedGainNode);
        partialVolume *= pianoParams.partialVolumeFactor;
        partialDecayTime *= pianoParams.partialDecayFactor;
    }
    // combinedGainNode/toneOutputNode are never disconnected by a partial's own onended (each
    // partial only disconnects itself from combinedGainNode) - clean them up once the longest
    // partial has finished, same pattern as bass.ts/harp.ts use for their own combined nodes.
    setTimeout(() => {
        toneOutputNode.disconnect(destination);
        if (toneOutputNode !== combinedGainNode) {
            combinedGainNode.disconnect(toneOutputNode);
        }
    }, 1000 * (time - audioContext.currentTime + maxEnvelopeLength + 0.05));

    // A soft, low felt-hammer thud rather than a bright click - a prominent high-frequency noise
    // burst reads as a pluck's metallic twang, not a struck string's attack. The gain ramps up
    // from 0 (hammerAttackTime) rather than jumping straight to its peak: a hard amplitude step
    // is itself a broadband click, on top of whatever the noise's own spectrum contributes.
    const {hammerGain, hammerAttackTime, hammerStrikeDuration, hammerLowpassFrequency, hammerLowpassFrequencyMultiplier} = pianoParams;
    const noiseSource = createWhiteNoiseSource();
    const filterNode = audioContext.createBiquadFilter();
    filterNode.type = 'lowpass';
    filterNode.frequency.value = hammerLowpassFrequency + frequency * hammerLowpassFrequencyMultiplier;
    const noiseGain = audioContext.createGain();
    noiseGain.gain.setValueAtTime(0, time);
    noiseGain.gain.linearRampToValueAtTime(volume * hammerGain, time + hammerAttackTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, time + hammerStrikeDuration);
    noiseSource.connect(filterNode);
    filterNode.connect(noiseGain);
    noiseGain.connect(destination);
    noiseSource.start(time, getRandomNoiseOffset());
    noiseSource.stop(time + hammerStrikeDuration);
    noiseSource.onended = () => {
        noiseSource.disconnect(filterNode);
        filterNode.disconnect(noiseGain);
        noiseGain.disconnect(destination);
    };
}

instruments.piano = {
    playNote: playPianoNote
};
