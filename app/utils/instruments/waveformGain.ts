// Different oscillator waveforms carry different acoustic power (and perceived loudness) at the
// same nominal amplitude: a square wave's RMS equals its peak (crest factor 1), while a sine's
// RMS is ~0.707x its peak. Real-world reports put square/sawtooth's *perceived* loudness gap even
// wider than that ~3dB RMS difference, since their extra harmonic energy engages more of the
// ear's loudness response - so "one oscillator" doesn't mean "one unit of loudness" once its type
// changes. These factors loudness-match against a sine reference; they're a starting point from
// theory, not a final answer - re-tune by ear as instruments are compared.
// See documentation/architecture-audio-synthesis.md.
const WAVEFORM_GAIN: {[key in OscillatorType]?: number} = {
    sine: 1,
    triangle: 0.9,
    sawtooth: 0.6,
    square: 0.5,
};

export function getWaveformGain(type: OscillatorType): number {
    return WAVEFORM_GAIN[type] ?? 1;
}
