/**
 * AudioWorklet Processor
 * 在音频线程中捕获实时 PCM 数据
 */

class AudioProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.bufferSize = 4096;
    this.buffer = new Float32Array(this.bufferSize);
    this.bufferIndex = 0;
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];

    if (input && input.length > 0) {
      const channelData = input[0]; // 使用第一个声道

      if (channelData) {
        // 将数据添加到缓冲区
        for (let i = 0; i < channelData.length; i++) {
          this.buffer[this.bufferIndex++] = channelData[i];

          // 缓冲区满了，发送到主线程
          if (this.bufferIndex >= this.bufferSize) {
            this.port.postMessage(this.buffer.slice(0, this.bufferIndex));
            this.bufferIndex = 0;
          }
        }
      }
    }

    // 返回 true 保持处理器活跃
    return true;
  }
}

registerProcessor('audio-processor', AudioProcessor);
