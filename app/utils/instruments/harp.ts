import {audioContext} from 'app/utils/sounds';
import {instruments} from 'app/utils/instruments/instrumentHash';


const harpFrequencies = [
    1,2,3,4,5,6,7,
];
function getHarpFrequencies(baseFrequency: number): number[] {
    return harpFrequencies.map(n => baseFrequency * n);
}

function playHarpNote({frequency, volume, time, destination, duration}: InstrumentPlayNoteParams) {
    const frequencies = getHarpFrequencies(frequency);
    const combinedGainNode = audioContext.createGain();
    combinedGainNode.gain.value = volume;
    //combinedGainNode.connect(destination);
    let lastNode = combinedGainNode;


    const lowpassFrequency = 200 + 0.2 * frequency;// 100 + 0.4 * baseFrequency; //400
    if (lowpassFrequency) {
        const filterNode = audioContext.createBiquadFilter();
        filterNode.frequency.value = lowpassFrequency;
        filterNode.type = 'lowpass';
        lastNode.connect(filterNode);
        lastNode = filterNode;
    }

    const highpassFrequency = 200 + 0.2 * frequency;//100 + 0.4 * baseFrequency;//frequency;
    if (highpassFrequency) {
        const filterNode = audioContext.createBiquadFilter();
        filterNode.frequency.value = highpassFrequency;
        filterNode.type = 'highpass';
        lastNode.connect(filterNode);
        lastNode = filterNode;
    }

    lastNode.connect(destination);

    //Attack: 0
    //Decay: 2,41
    //Sustain: 0
    //Release: 1.24

    const overtoneVolumeFactor = 0.9;
    const overtoneDurationFactor = .9;
    const frequenciesArray = Float32Array.from(frequencies);
    const attackTime = 0;//0.001;
    let frequencyVolume = 1;
    const decayTime = 0.05;
    const sustainTime = 0.0;
    const sustainPercent = 0.15;//0.15;
    let fadeDuration = duration - decayTime - sustainTime - attackTime;
    for (const frequency of frequenciesArray) {
        //const decayTime = 0.05 * Math.min(10, Math.max(0.5, 440 * 440 / frequency / frequency));
        fadeDuration = (duration - decayTime - sustainTime - attackTime) * Math.min(1, Math.max(0.2, 440 * 440 / frequency / frequency));
        //frequencyVolume = 1;
        //frequencyVolume = baseFrequency / frequency;
        const sustainVolume = frequencyVolume * sustainPercent;// * Math.min(2, Math.max(0.2, 440 * 440 / frequency / frequency));
        const gainNode = audioContext.createGain();
        gainNode.gain.setValueAtTime(0, time);
        // Attack
        gainNode.gain.linearRampToValueAtTime(frequencyVolume, time + attackTime);
        //gainNode.gain.setValueAtTime(frequencyVolume, time + attackTime);
        // Decay
        gainNode.gain.linearRampToValueAtTime(sustainVolume, time + attackTime + decayTime);
        // Sustain
        gainNode.gain.setValueAtTime(sustainVolume, time + attackTime + decayTime + sustainTime);

        gainNode.gain.linearRampToValueAtTime(0, time + attackTime + decayTime + sustainTime + fadeDuration);
        const oscillator = audioContext.createOscillator();
        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';
        oscillator.connect(gainNode);
        oscillator.start(time);
        oscillator.stop(time + duration);
        frequencyVolume *= overtoneVolumeFactor;
        fadeDuration *= overtoneDurationFactor;
        gainNode.connect(combinedGainNode);
    }
    setTimeout(() => {
        lastNode.disconnect(destination);
    }, 1000 * (time - audioContext.currentTime + duration));
}

instruments.harp = {
    playNote: playHarpNote
};
