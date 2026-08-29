import {audioContext} from 'app/utils/sounds';

interface PlaySimpleSoundParams {
    destination: AudioNode
    time: number
    frequencies: number[]
    volume: number
    duration: number
    oscillatorType?: 'sine' | 'square' | 'sawtooth' | 'triangle'
    attackTime?: number
    bandpassFrequency?: number
    highpassFrequency?: number
    fadeTime?: number
    frequencyVolumeFactor?: number
    frequencyDurationFactor?: number
    pitchNode?: AudioNode
}

export function playSimpleSound({
    frequencies,
    volume = 1,
    destination = audioContext.destination,
    duration,
    time = audioContext.currentTime,
    oscillatorType = 'sine',
    attackTime = 0.003,
    fadeTime = 0.1 * duration,
    frequencyVolumeFactor = 1,
    frequencyDurationFactor = 1,
    bandpassFrequency,
    highpassFrequency,
    pitchNode,
}: PlaySimpleSoundParams) {
    const combinedGainNode = audioContext.createGain();
    combinedGainNode.gain.value = volume;
    let lastNode = combinedGainNode;

    if (bandpassFrequency) {
        const filterNode = audioContext.createBiquadFilter();
        filterNode.frequency.value = bandpassFrequency;
        filterNode.type = 'bandpass';
        lastNode.connect(filterNode);
        lastNode = filterNode;
    }
    if (highpassFrequency) {
        const filterNode = audioContext.createBiquadFilter();
        filterNode.frequency.value = highpassFrequency;
        filterNode.type = 'highpass';
        lastNode.connect(filterNode);
        lastNode = filterNode;
    }
    lastNode.connect(destination);

    let frequencyVolume = 1;
    let frequencyDuration = duration;
    for (const frequency of frequencies) {
        let fadeDuration = Math.min(fadeTime, frequencyDuration - attackTime);
        const gainNode = audioContext.createGain();
        gainNode.gain.setValueAtTime(0, time);
        gainNode.gain.linearRampToValueAtTime(frequencyVolume, time + attackTime);
        gainNode.gain.setValueAtTime(frequencyVolume, time + duration - fadeDuration);
        gainNode.gain.linearRampToValueAtTime(0, time + duration);
        const oscillator = audioContext.createOscillator();
        oscillator.frequency.value = frequency;
        /*if (pitchVibratoGain && pitchVibratoFrequency) {
            const vibratoOscillator = audioContext.createOscillator();
            vibratoOscillator.frequency.value = pitchVibratoFrequency;
            const vibratoGain = audioContext.createGain();
            vibratoGain.gain.value = pitchVibratoGain;
            vibratoOscillator.connect(vibratoGain).connect(oscillator.frequency);
            console.log('adding pitch vibrato');
            vibratoOscillator.start(time);
            vibratoOscillator.stop(time + duration);
        }*/
        if (pitchNode) {
            pitchNode.connect(oscillator.frequency);
        }
        oscillator.type = oscillatorType;
        oscillator.connect(gainNode);
        oscillator.start(time);
        oscillator.stop(time + duration);
        oscillator.onended = () => {
            if (pitchNode) {
                pitchNode.disconnect(oscillator.frequency);
            }
            oscillator.disconnect(gainNode);
            gainNode.disconnect(combinedGainNode);
        }
        frequencyVolume *= frequencyVolumeFactor;
        frequencyDuration *= frequencyDurationFactor;
        gainNode.connect(combinedGainNode);
    }
    setTimeout(() => {
        lastNode.disconnect(destination);
    }, 1000 * (time - audioContext.currentTime + duration));
}

export function vibratoNode(duration: number, frequency: number, gain: number): AudioNode {
    const waveNode = audioContext.createOscillator();
    waveNode.frequency.value = frequency;
    const gainNode = audioContext.createGain();
    gainNode.gain.value = gain;
    waveNode.connect(gainNode);
    waveNode.start(audioContext.currentTime);
    waveNode.stop(audioContext.currentTime + duration);
    waveNode.onended = function () {
        waveNode.disconnect(gainNode);
    }
    return gainNode;
}
// @ts-ignore
window['vibratoNode'] = vibratoNode;

export function glideNode(duration: number, glideStart: number, glideEnd: number, gain: number): AudioNode {
    const constantNode = audioContext.createConstantSource();
    const gainNode = audioContext.createGain();
    gainNode.gain.setValueAtTime(0, audioContext.currentTime + glideStart);
    gainNode.gain.linearRampToValueAtTime(gain, audioContext.currentTime + glideEnd);
    constantNode.connect(gainNode);
    constantNode.start(audioContext.currentTime);
    constantNode.stop(audioContext.currentTime + duration);
    constantNode.onended = function () {
        constantNode.disconnect(gainNode);
    }
    return gainNode
}
// @ts-ignore
window['glideNode'] = glideNode;

export function mergeNodes(nodes: AudioNode[]): AudioNode {
    const gainNode = audioContext.createGain();
    for (const node of nodes) {
        node.connect(gainNode);
    }
    return gainNode;
}
window['mergeNodes'] = mergeNodes;
