import {audioContext} from 'app/utils/sounds';
import {instruments} from 'app/utils/instruments/instrumentHash';

// A single sine oscillator, no filtering, with a fast pitch envelope (high to low over
// ~20-70ms) providing the "click" transient, and a decay-only amplitude envelope - this is
// reportedly the standard 808-style kick architecture. Notably, that's ONE oscillator: an
// earlier version of this file added a separate square-wave "click" oscillator layered on top,
// which read as a second, clashing pitched tone (harsh/metallic) rather than a transient - the
// pitch envelope's decay time *is* the click, no extra oscillator needed.
// Sources:
// - https://dsokolovskiy.com/blog/all/kick-synthesis/
// - https://nslogictutorials.wixsite.com/mysite/single-post/2018/03/27/sound-sythesis-tutorial-808-kick-drum
// - https://www.perfectcircuit.com/signal/kick-drum-synthesis
const PITCH_SPIKE_TIME = 0.01;
const PITCH_DECAY_TIME = 0.03;
const PITCH_START_RATIO = 6;

function playKickSound({frequency, volume, time, destination, duration}: InstrumentPlayNoteParams) {
    const oscillator = audioContext.createOscillator();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency, time);
    oscillator.frequency.setValueAtTime(frequency * PITCH_START_RATIO, time + PITCH_SPIKE_TIME);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(2, frequency), time + PITCH_SPIKE_TIME + PITCH_DECAY_TIME);

    const gainNode = audioContext.createGain();
    gainNode.gain.setValueAtTime(0, time);
    // A few ms of attack avoids the click a hard jump straight to full volume would cause.
    gainNode.gain.linearRampToValueAtTime(volume, time + 0.005);
    gainNode.gain.exponentialRampToValueAtTime(0.001, time + duration);

    oscillator.connect(gainNode);
    gainNode.connect(destination);
    oscillator.start(time);
    oscillator.stop(time + duration + 0.02);
    oscillator.onended = () => {
        oscillator.disconnect(gainNode);
        gainNode.disconnect(destination);
    };
}

instruments.kick = {
    playNote: playKickSound,
    defaultAuditionDuration: 0.3,
};
