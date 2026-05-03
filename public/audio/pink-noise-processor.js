// From https://noisehack.com/generate-noise-web-audio-api/
// Adapted to an AudioWorkletProcessor

class PinkNoiseProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    // Keep track of filter state per channel to avoid cross-channel interference
    this.channelsState = [];
  }

  process(inputs, outputs, parameters) {
    const output = outputs[0];
    // Ensure we have state initialized for each channel
    while (this.channelsState.length < output.length) {
      this.channelsState.push({
        b0: 0, b1: 0, b2: 0, b3: 0, b4: 0, b5: 0, b6: 0
      });
    }
    for (let c = 0; c < output.length; c++) {
      const channel = output[c];
      const state = this.channelsState[c];
      for (let i = 0; i < channel.length; i++) {
        const white = Math.random() * 2 - 1;
        state.b0 = 0.99886 * state.b0 + white * 0.0555179;
        state.b1 = 0.99332 * state.b1 + white * 0.0750759;
        state.b2 = 0.96900 * state.b2 + white * 0.1538520;
        state.b3 = 0.86650 * state.b3 + white * 0.3104856;
        state.b4 = 0.55000 * state.b4 + white * 0.5329522;
        state.b5 = -0.7616 * state.b5 - white * 0.0168980;
        channel[i] = state.b0 + state.b1 + state.b2 + state.b3 + state.b4 + state.b5 + state.b6 + white * 0.5362;
        channel[i] *= 0.11; // (roughly) compensate for gain
        state.b6 = white * 0.115926;
      }
    }
    return true;
  }
}
registerProcessor('pink-noise', PinkNoiseProcessor);

/*
Original code:

var bufferSize = 4096;
var pinkNoise = (function() {
    var b0, b1, b2, b3, b4, b5, b6;
    b0 = b1 = b2 = b3 = b4 = b5 = b6 = 0.0;
    var node = audioContext.createScriptProcessor(bufferSize, 1, 1);
    node.onaudioprocess = function(e) {
        var output = e.outputBuffer.getChannelData(0);
        for (var i = 0; i < bufferSize; i++) {
            var white = Math.random() * 2 - 1;
            b0 = 0.99886 * b0 + white * 0.0555179;
            b1 = 0.99332 * b1 + white * 0.0750759;
            b2 = 0.96900 * b2 + white * 0.1538520;
            b3 = 0.86650 * b3 + white * 0.3104856;
            b4 = 0.55000 * b4 + white * 0.5329522;
            b5 = -0.7616 * b5 - white * 0.0168980;
            output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
            output[i] *= 0.11; // (roughly) compensate for gain
            b6 = white * 0.115926;
        }
    }
    return node;
})();

pinkNoise.connect(audioContext.destination);

*/
