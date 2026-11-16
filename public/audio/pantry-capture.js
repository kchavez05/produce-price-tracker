/* Browser-owned PCM only. No storage, network or audible microphone monitoring. */
class PantryCapture extends AudioWorkletProcessor {
  constructor() { super(); this.frames = 0; }
  process(inputs) {
    const samples = inputs[0]?.[0];
    if (!samples) return true;
    const remaining = Math.max(0, Math.floor(sampleRate * 30) - this.frames);
    const chunk = samples.slice(0, remaining);
    this.frames += chunk.length;
    if (chunk.length) this.port.postMessage(chunk, [chunk.buffer]);
    if (this.frames >= Math.floor(sampleRate * 30)) { this.port.postMessage('done'); return false; }
    return true;
  }
}
registerProcessor('pantry-capture', PantryCapture);
