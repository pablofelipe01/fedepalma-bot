// audio-processor.js
// AudioWorklet processor for real-time audio processing
// This file needs to be served from the public directory

class AudioProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super();
    
    // Configuration from options
    this.sampleRate = options.processorOptions?.sampleRate || 16000;
    this.chunkDuration = options.processorOptions?.chunkDuration || 64; // ms
    this.channels = 1; // Mono audio
    
    // Calculate chunk size in samples
    this.chunkSize = Math.floor((this.sampleRate * this.chunkDuration) / 1000);
    
    // Buffer for accumulating audio samples
    this.audioBuffer = new Float32Array(this.chunkSize);
    this.bufferIndex = 0;
    
    // Audio processing state
    this.isProcessing = true;
    
    console.log(`AudioProcessor initialized: ${this.sampleRate}Hz, ${this.chunkDuration}ms chunks, ${this.chunkSize} samples per chunk`);
  }
  
  process(inputs, outputs, parameters) {
    // Get input audio data
    const input = inputs[0];
    if (!input || !input[0]) {
      return this.isProcessing;
    }
    
    const inputChannel = input[0]; // First channel (mono)
    const inputLength = inputChannel.length;
    
    // Process audio in chunks
    for (let i = 0; i < inputLength; i++) {
      this.audioBuffer[this.bufferIndex] = inputChannel[i];
      this.bufferIndex++;
      
      // When buffer is full, send chunk to main thread
      if (this.bufferIndex >= this.chunkSize) {
        this.sendAudioChunk();
        this.bufferIndex = 0;
      }
    }
    
    return this.isProcessing;
  }
  
  sendAudioChunk() {
    // Convert Float32Array to regular array for transfer
    const audioData = Array.from(this.audioBuffer);
    
    // Send audio chunk to main thread
    this.port.postMessage({
      type: 'audioChunk',
      audioData: audioData,
      timestamp: Date.now(),
      sampleRate: this.sampleRate,
      channels: this.channels,
    });
  }
  
  static get parameterDescriptors() {
    return [];
  }
}

// Register the processor
registerProcessor('audio-processor', AudioProcessor);