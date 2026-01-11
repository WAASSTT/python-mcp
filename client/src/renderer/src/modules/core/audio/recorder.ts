/**
 * 音频录制器
 */

import { logger } from "../../utils/logger";
import { initOpusEncoder, type OpusEncoder } from "./opus-codec";
import { getAudioPlayer } from "./player";

export type RecordingCallback = () => void;
export type VisualizerCallback = (
  dataArray: Uint8Array,
  volume: number
) => void;
export type AudioDataCallback = (opusData: Uint8Array) => void;

export class AudioRecorder {
  private isRecording = false;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private audioProcessor: AudioWorkletNode | ScriptProcessorNode | null = null;
  private audioProcessorType: "worklet" | "processor" | null = null;
  private audioSource: MediaStreamAudioSourceNode | null = null;
  private opusEncoder: OpusEncoder | null = null;
  private pcmDataBuffer: Int16Array = new Int16Array();
  private visualizationRequest: number | null = null;
  private recordingTimer: ReturnType<typeof setInterval> | null = null;
  private recordingStartTime = 0;

  // 回调函数
  public onRecordingStart: RecordingCallback | null = null;
  public onRecordingStop: RecordingCallback | null = null;
  public onVisualizerUpdate: VisualizerCallback | null = null;
  public onAudioData: AudioDataCallback | null = null;

  /**
   * 获取 AudioContext 实例
   */
  private getAudioContext(): AudioContext {
    if (!this.audioContext) {
      const audioPlayer = getAudioPlayer();
      this.audioContext = audioPlayer.getAudioContext();
    }
    return this.audioContext;
  }

  /**
   * 初始化编码器
   */
  private initEncoder(): OpusEncoder {
    if (!this.opusEncoder) {
      this.opusEncoder = initOpusEncoder(1, 16000, 960);
      this.opusEncoder.init();
    }
    return this.opusEncoder;
  }

  /**
   * 创建音频处理器
   */
  private async createAudioProcessor(): Promise<{
    node: AudioWorkletNode | ScriptProcessorNode;
    type: "worklet" | "processor";
  } | null> {
    this.audioContext = this.getAudioContext();

    try {
      if (this.audioContext.audioWorklet) {
        const processorCode = this.getAudioProcessorCode();
        const blob = new Blob([processorCode], {
          type: "application/javascript",
        });
        const url = URL.createObjectURL(blob);
        await this.audioContext.audioWorklet.addModule(url);
        URL.revokeObjectURL(url);

        const audioProcessor = new AudioWorkletNode(
          this.audioContext,
          "audio-recorder-processor"
        );

        audioProcessor.port.onmessage = (event) => {
          if (event.data.type === "buffer") {
            this.processPCMBuffer(event.data.buffer);
          }
        };

        logger.success("使用AudioWorklet处理音频");

        const silent = this.audioContext.createGain();
        silent.gain.value = 0;
        audioProcessor.connect(silent);
        silent.connect(this.audioContext.destination);

        return { node: audioProcessor, type: "worklet" };
      } else {
        logger.warning(
          "AudioWorklet不可用，使用ScriptProcessorNode作为回退方案"
        );
        return this.createScriptProcessor();
      }
    } catch (error: any) {
      logger.error(`创建音频处理器失败: ${error.message}，尝试回退方案`);
      return this.createScriptProcessor();
    }
  }

  /**
   * AudioWorklet 处理器代码
   */
  private getAudioProcessorCode(): string {
    return `
      class AudioRecorderProcessor extends AudioWorkletProcessor {
        constructor() {
          super();
          this.buffers = [];
          this.frameSize = 960;
          this.buffer = new Int16Array(this.frameSize);
          this.bufferIndex = 0;
          this.isRecording = false;

          this.port.onmessage = (event) => {
            if (event.data.command === 'start') {
              this.isRecording = true;
              this.port.postMessage({ type: 'status', status: 'started' });
            } else if (event.data.command === 'stop') {
              this.isRecording = false;

              if (this.bufferIndex > 0) {
                const finalBuffer = this.buffer.slice(0, this.bufferIndex);
                this.port.postMessage({
                  type: 'buffer',
                  buffer: finalBuffer
                });
                this.bufferIndex = 0;
              }

              this.port.postMessage({ type: 'status', status: 'stopped' });
            }
          };
        }

        process(inputs, outputs, parameters) {
          if (!this.isRecording) return true;

          const input = inputs[0][0];
          if (!input) return true;

          for (let i = 0; i < input.length; i++) {
            if (this.bufferIndex >= this.frameSize) {
              this.port.postMessage({
                type: 'buffer',
                buffer: this.buffer.slice(0)
              });
              this.bufferIndex = 0;
            }

            this.buffer[this.bufferIndex++] = Math.max(-32768, Math.min(32767, Math.floor(input[i] * 32767)));
          }

          return true;
        }
      }

      registerProcessor('audio-recorder-processor', AudioRecorderProcessor);
    `;
  }

  /**
   * 创建 ScriptProcessor 作为回退
   */
  private createScriptProcessor(): {
    node: ScriptProcessorNode;
    type: "processor";
  } | null {
    if (!this.audioContext) return null;

    try {
      const frameSize = 4096;
      const scriptProcessor = this.audioContext.createScriptProcessor(
        frameSize,
        1,
        1
      );

      scriptProcessor.onaudioprocess = (event) => {
        if (!this.isRecording) return;

        const input = event.inputBuffer.getChannelData(0);
        const buffer = new Int16Array(input.length);

        for (let i = 0; i < input.length; i++) {
          buffer[i] = Math.max(
            -32768,
            Math.min(32767, Math.floor(input[i] * 32767))
          );
        }

        this.processPCMBuffer(buffer);
      };

      const silent = this.audioContext.createGain();
      silent.gain.value = 0;
      scriptProcessor.connect(silent);
      silent.connect(this.audioContext.destination);

      logger.warning("使用ScriptProcessorNode作为回退方案成功");
      return { node: scriptProcessor, type: "processor" };
    } catch (fallbackError: any) {
      logger.error(`回退方案也失败: ${fallbackError.message}`);
      return null;
    }
  }

  /**
   * 处理 PCM 缓冲数据
   */
  private processPCMBuffer(buffer: Int16Array): void {
    if (!this.isRecording) return;

    const newBuffer = new Int16Array(this.pcmDataBuffer.length + buffer.length);
    newBuffer.set(this.pcmDataBuffer);
    newBuffer.set(buffer, this.pcmDataBuffer.length);
    this.pcmDataBuffer = newBuffer;

    const samplesPerFrame = 960;

    while (this.pcmDataBuffer.length >= samplesPerFrame) {
      const frameData = this.pcmDataBuffer.slice(0, samplesPerFrame);
      this.pcmDataBuffer = this.pcmDataBuffer.slice(samplesPerFrame);
      this.encodeAndSendOpus(frameData);
    }
  }

  /**
   * 编码并发送 Opus 数据
   */
  private encodeAndSendOpus(pcmData: Int16Array): void {
    if (!this.opusEncoder) {
      logger.error("Opus编码器未初始化");
      return;
    }

    try {
      const opusData = this.opusEncoder.encode(pcmData);
      if (this.onAudioData) {
        this.onAudioData(opusData);
      }
    } catch (error: any) {
      logger.error(`编码失败: ${error.message}`);
    }
  }

  /**
   * 可视化更新循环
   */
  private updateVisualizer(): void {
    if (!this.isRecording || !this.analyser) return;

    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(dataArray);

    // 计算音量
    const sum = dataArray.reduce((a, b) => a + b, 0);
    const volume = Math.round((sum / dataArray.length / 255) * 100);

    if (this.onVisualizerUpdate) {
      this.onVisualizerUpdate(dataArray, volume);
    }

    this.visualizationRequest = requestAnimationFrame(() =>
      this.updateVisualizer()
    );
  }

  /**
   * 开始录音
   */
  public async startRecording(): Promise<void> {
    if (this.isRecording) {
      logger.warning("已在录音中");
      return;
    }

    try {
      logger.info("开始录音...");

      // 初始化编码器
      this.initEncoder();

      // 获取麦克风权限
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // 创建音频上下文
      this.audioContext = this.getAudioContext();

      // 创建音频源
      this.audioSource = this.audioContext.createMediaStreamSource(stream);

      // 创建分析器（用于可视化）
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      this.audioSource.connect(this.analyser);

      // 创建音频处理器
      const processor = await this.createAudioProcessor();
      if (!processor) {
        throw new Error("无法创建音频处理器");
      }

      this.audioProcessor = processor.node;
      this.audioProcessorType = processor.type;
      this.audioSource.connect(this.audioProcessor);

      // 启动录音
      this.isRecording = true;
      this.recordingStartTime = Date.now();
      this.pcmDataBuffer = new Int16Array();

      if (this.audioProcessorType === "worklet") {
        (this.audioProcessor as AudioWorkletNode).port.postMessage({
          command: "start",
        });
      }

      // 启动可视化
      this.updateVisualizer();

      // 启动计时器
      this.recordingTimer = setInterval(() => {
        const elapsed = (Date.now() - this.recordingStartTime) / 1000;
        logger.debug(`录音中: ${elapsed.toFixed(1)}秒`);
      }, 1000);

      if (this.onRecordingStart) {
        this.onRecordingStart();
      }

      logger.success("录音开始");
    } catch (error: any) {
      logger.error(`录音失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 停止录音
   */
  public stopRecording(): void {
    if (!this.isRecording) {
      logger.warning("未在录音中");
      return;
    }

    logger.info("停止录音...");

    this.isRecording = false;

    // 停止处理器
    if (this.audioProcessor && this.audioProcessorType === "worklet") {
      (this.audioProcessor as AudioWorkletNode).port.postMessage({
        command: "stop",
      });
    }

    // 停止可视化
    if (this.visualizationRequest) {
      cancelAnimationFrame(this.visualizationRequest);
      this.visualizationRequest = null;
    }

    // 停止计时器
    if (this.recordingTimer) {
      clearInterval(this.recordingTimer);
      this.recordingTimer = null;
    }

    // 清理资源
    if (this.audioSource) {
      this.audioSource.disconnect();
      this.audioSource = null;
    }

    if (this.audioProcessor) {
      this.audioProcessor.disconnect();
      this.audioProcessor = null;
    }

    if (this.analyser) {
      this.analyser.disconnect();
      this.analyser = null;
    }

    if (this.onRecordingStop) {
      this.onRecordingStop();
    }

    logger.success("录音停止");
  }

  /**
   * 销毁录音器
   */
  public destroy(): void {
    this.stopRecording();

    if (this.opusEncoder) {
      this.opusEncoder.destroy();
      this.opusEncoder = null;
    }

    logger.info("音频录音器已销毁");
  }
}

/**
 * MediaRecorder 音频编码器辅助类
 * 用于实时流式 Opus 编码
 */
export class MediaRecorderOpusEncoder {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  public onDataAvailable: ((opusData: Uint8Array) => void) | null = null;

  /**
   * 开始从音频流编码
   */
  public async start(stream: MediaStream): Promise<void> {
    // 检查 Opus 支持
    const mimeType = "audio/webm;codecs=opus";
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      throw new Error("浏览器不支持 Opus 编码");
    }

    this.audioChunks = [];

    // 创建 MediaRecorder，设置为 10ms 时间片
    this.mediaRecorder = new MediaRecorder(stream, {
      mimeType,
      audioBitsPerSecond: 16000,
    });

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.audioChunks.push(event.data);

        // 将 Blob 转换为 Uint8Array
        event.data.arrayBuffer().then((buffer) => {
          const uint8Array = new Uint8Array(buffer);
          if (this.onDataAvailable) {
            this.onDataAvailable(uint8Array);
          }
        });
      }
    };

    this.mediaRecorder.start(10); // 每 10ms 触发一次 dataavailable
    logger.success("MediaRecorder Opus 编码器已启动");
  }

  /**
   * 停止编码
   */
  public stop(): Promise<Blob> {
    return new Promise((resolve) => {
      if (!this.mediaRecorder) {
        resolve(new Blob());
        return;
      }

      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, {
          type: "audio/webm;codecs=opus",
        });
        resolve(audioBlob);
      };

      this.mediaRecorder.stop();
    });
  }

  /**
   * 获取当前状态
   */
  public getState(): RecordingState {
    return this.mediaRecorder?.state || "inactive";
  }
}
