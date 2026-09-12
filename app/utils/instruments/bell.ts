import {noteFrequencies, notes} from 'app/utils/noteFrequencies';
import {audioContext, sounds} from 'app/utils/sounds';
import {instruments} from 'app/utils/instruments/instrumentHash';

function playBellSound(
    inputFrequencies: number[],
    volume: number,
    duration: number,
    destination: AudioNode,
    time = audioContext.currentTime
) {
    const combinedGainedNode = audioContext.createGain();
    combinedGainedNode.connect(destination);
    combinedGainedNode.gain.value = volume;

    const frequencies = Float32Array.from(inputFrequencies);
    const attackTime = 0.003;
    let frequencyVolume = 0.5;
    let fadeDuration = duration - attackTime;
    for (const frequency of frequencies) {
        const gainNode = audioContext.createGain();
        gainNode.gain.setValueAtTime(0, time);
        gainNode.gain.linearRampToValueAtTime(frequencyVolume, time + attackTime);
        gainNode.gain.setValueAtTime(frequencyVolume, time + attackTime);
        gainNode.gain.linearRampToValueAtTime(0, time + attackTime + fadeDuration);
        const oscillator = audioContext.createOscillator();
        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';
        oscillator.connect(gainNode);
        oscillator.start(time);
        oscillator.stop(time + duration);
        frequencyVolume *= 0.5;
        fadeDuration *= 0.75;
        gainNode.connect(combinedGainedNode);
    }
}

// Frequencies from https://www.computermusicresource.com/Simple.bell.tutorial.html
const bellFrequencies = [0.56, 0.92, 1.19, 1.71, 2, 2.74, 3, 3.76, 4.07];

function getBellFrequencies(baseFrequency: number): number[] {
    return bellFrequencies.map(n => baseFrequency * n);
}

instruments.bell = {
    playNote({frequency, destination, duration, volume, time}) {
        playBellSound(getBellFrequencies(frequency), volume, duration, destination, time);
    },
    // Bells ring long by nature - the highest of the per-instrument defaults (still subject to the
    // 0.5s hard cap - see Instrument.defaultAuditionDuration) so a preview still reads as "a bell"
    // rather than an abruptly muted chime.
    defaultAuditionDuration: 0.5,
}

notes.forEach((noteName) => {
    sounds.set(`bell${noteName}`, {
        play(target: AudioNode, time: number) {
            playBellSound(getBellFrequencies(noteFrequencies[noteName]), 0.2, this.duration, target, time);
        },
        duration: 2,
        instanceLimit: 5,
        instances: [],
    });
});
