import {audioContext} from 'app/utils/sounds';

// A shared buffer of random samples, used as the noise source for percussion instruments
// (snare, hihat, ...). This is a simpler alternative to the project's existing pink/white noise
// AudioWorklet nodes (`app/utils/sounds.ts`): those load asynchronously and aren't exported for
// use outside that file, whereas a plain AudioBuffer can be generated once, synchronously, and
// reused via a fresh AudioBufferSourceNode per note. See documentation/architecture-audio-synthesis.md.
const NOISE_BUFFER_DURATION = 2;

let whiteNoiseBuffer: AudioBuffer | undefined;
function getWhiteNoiseBuffer(): AudioBuffer {
    if (!whiteNoiseBuffer) {
        whiteNoiseBuffer = audioContext.createBuffer(
            1, NOISE_BUFFER_DURATION * audioContext.sampleRate, audioContext.sampleRate
        );
        const data = whiteNoiseBuffer.getChannelData(0);
        for (let i = 0; i < data.length; i++) {
            data[i] = Math.random() * 2 - 1;
        }
    }
    return whiteNoiseBuffer;
}

// A fresh, unstarted, unconnected noise source. AudioBufferSourceNodes are single-use, but every
// call shares the same underlying buffer.
export function createWhiteNoiseSource(): AudioBufferSourceNode {
    const source = audioContext.createBufferSource();
    source.buffer = getWhiteNoiseBuffer();
    source.loop = true;
    return source;
}

// A random point in the buffer to start playback from. Without this, repeated short hits (e.g. a
// run of hihat eighth notes) would all play back the exact same noise, which sounds phasey/robotic.
export function getRandomNoiseOffset(): number {
    return Math.random() * NOISE_BUFFER_DURATION;
}
