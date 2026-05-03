class BrownNoiseProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    // Keep track of filter state per channel to avoid cross-channel interference
    this.channelsState = [];
  }

  process(inputs, outputs, parameters) {
    const output = outputs[0];
    // Ensure we have state initialized for each channel
    while (this.channelsState.length < output.length) {
      this.channelsState.push({ lastOut: 0 });
    }
    for (let c = 0; c < output.length; c++) {
      const channel = output[c];
      const state = this.channelsState[c];
      for (let i = 0; i < channel.length; i++) {
        const white = Math.random() * 2 - 1;
        channel[i] = (state.lastOut + (0.02 * white)) / 1.02;
        state.lastOut = channel[i];
        channel[i] *= 3.5; // (roughly) compensate for gain
      }
    }
    return true;
  }
}
registerProcessor('brown-noise', BrownNoiseProcessor);
