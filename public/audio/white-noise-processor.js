class WhiteNoiseProcessor extends AudioWorkletProcessor {
  process(inputs, outputs, parameters) {
    const output = outputs[0];
    for (let c = 0; c < output.length; c++) {
      const channel = output[c];
      for (let i = 0; i < channel.length; i++) {
        channel[i] = Math.random() * 2 - 1;
      }
    }
    return true;
  }
}
registerProcessor('white-noise', WhiteNoiseProcessor);
