/**
 * 音频处理服务
 * 负责音频录制、编码（Opus）、播放等功能
 * 使用 AudioWorklet + @evan/opus 进行实时Opus编码
 */

import { Decoder, Encoder } from '@evan/opus';

export interface AudioConfig {
  sampleRate: number;
  channels: number;
  frameDuration: number; // ms
}

export class AudioService {
  private audioContext: AudioContext | null = null;
  private audioStream: MediaStream | null = null;
  private isRecording: boolean = false;
  private onAudioData?: (data: ArrayBuffer) => void;
  private analyser: AnalyserNode | null = null;
  private animationId: number | null = null;
  private audioWorkletNode: AudioWorkletNode | null = null;
  private opusEncoder: Encoder | null = null;
  private opusDecoder: Decoder | null = null;
  private config: AudioConfig = {
    sampleRate: 16000,
    channels: 1,
    frameDuration: 60,
  };

  /**
   * 初始化音频上下文
   */
  async initialize(config: AudioConfig): Promise<void> {
    try {
      this.config = config;

      // 创建音频上下文
      this.audioContext = new AudioContext({
        sampleRate: config.sampleRate,
      });

      console.log('[Audio] 音频服务初始化成功');
    } catch (error) {
      console.error('[Audio] 初始化失败:', error);
      throw error;
    }
  }

  /**
   * 开始录音
   */
  async startRecording(): Promise<void> {
    if (this.isRecording) {
      console.warn('[Audio] 正在录音中');
      return;
    }

    try {
      // 请求麦克风权限
      this.audioStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: this.config.sampleRate,
          channelCount: this.config.channels,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      if (!this.audioContext) {
        throw new Error('音频上下文未初始化');
      }

      // 创建音频源
      const source = this.audioContext.createMediaStreamSource(this.audioStream);

      // 创建分析器用于可视化
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 2048;
      source.connect(this.analyser);

      // 创建 ScriptProcessor 用于采集PCM数据
      // 每帧采样数 = sampleRate * frameDuration / 1000
      const frameSize = (this.config.sampleRate * this.config.frameDuration) / 1000;
      const bufferSize = this.getBufferSize(frameSize);

      // 创建 Opus 编码器
      this.opusEncoder = new Encoder({
        channels: this.config.channels as 1 | 2,
        sample_rate: this.config.sampleRate as 8000 | 12000 | 16000 | 24000 | 48000,
        application: 'voip',
      });

      const processor = this.audioContext.createScriptProcessor(
        bufferSize,
        this.config.channels,
        this.config.channels
      );

      processor.onaudioprocess = event => {
        if (!this.isRecording || !this.opusEncoder) return;

        const inputBuffer = event.inputBuffer;
        const channelData = inputBuffer.getChannelData(0); // 获取第一个声道

        // 转换为16位PCM
        const pcm16 = this.floatTo16BitPCM(channelData);

        // 使用 Opus 编码
        try {
          const opusData = this.opusEncoder.encode(pcm16);

          // 发送编码后的Opus数据
          // 创建新的ArrayBuffer避免SharedArrayBuffer类型问题
          const buffer = opusData.slice(0).buffer;
          this.onAudioData?.(buffer);
        } catch (error) {
          console.error('[Audio] Opus编码失败:', error);
        }
      };

      source.connect(processor);
      processor.connect(this.audioContext.destination);

      this.audioWorkletNode = processor as any;
      this.isRecording = true;

      console.log(
        '[Audio] 开始录音 - 采样率:',
        this.config.sampleRate,
        'Hz, 帧大小:',
        frameSize,
        '样本'
      );
    } catch (error) {
      console.error('[Audio] 启动录音失败:', error);
      throw error;
    }
  }

  /**
   * 转换Float32到16位PCM
   */
  private floatTo16BitPCM(float32Array: Float32Array): Int16Array {
    const int16Array = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
      const sample = float32Array[i] ?? 0;
      const s = Math.max(-1, Math.min(1, sample));
      int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    return int16Array;
  }

  /**
   * 获取合适的缓冲区大小（必须是2的幂）
   */
  private getBufferSize(targetSize: number): number {
    const sizes = [256, 512, 1024, 2048, 4096, 8192, 16384];
    return sizes.find(size => size >= targetSize) || 4096;
  }

  /**
   * 停止录音
   */
  /**
   * 停止录音
   */
  stopRecording(): void {
    if (!this.isRecording) {
      console.warn('[Audio] 未在录音中');
      return;
    }

    this.isRecording = false;

    // 断开并清理AudioWorklet节点
    if (this.audioWorkletNode) {
      this.audioWorkletNode.disconnect();
      this.audioWorkletNode = null;
    }

    // 停止所有音频轨道
    if (this.audioStream) {
      this.audioStream.getTracks().forEach(track => track.stop());
      this.audioStream = null;
    }

    console.log('[Audio] 停止录音');
  }

  /**
   * 播放音频（解码Opus数据）
   */
  async playAudio(audioData: ArrayBuffer): Promise<void> {
    if (!this.audioContext) {
      console.error('[Audio] 音频上下文未初始化');
      return;
    }

    try {
      // 尝试使用Opus解码
      try {
        // 创建解码器（如果还没有）
        if (!this.opusDecoder) {
          this.opusDecoder = new Decoder({
            channels: this.config.channels as 1 | 2,
            sample_rate: this.config.sampleRate as 8000 | 12000 | 16000 | 24000 | 48000,
          });
        }

        const pcmData = this.opusDecoder.decode(new Uint8Array(audioData));

        // 转换为Int16Array
        const int16Data = new Int16Array(pcmData.buffer);

        // 转换为AudioBuffer
        const audioBuffer = this.audioContext.createBuffer(
          this.config.channels,
          int16Data.length,
          this.config.sampleRate
        );

        const channelData = audioBuffer.getChannelData(0);
        for (let i = 0; i < int16Data.length; i++) {
          const sample = int16Data[i] ?? 0;
          channelData[i] = sample / 32768.0; // 16位PCM转Float32
        }

        const source = this.audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(this.audioContext.destination);
        source.start();
        console.log('[Audio] 播放Opus音频');
      } catch {
        // 如果Opus解码失败，尝试作为普通音频解码
        const audioBuffer = await this.audioContext.decodeAudioData(audioData);
        const source = this.audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(this.audioContext.destination);
        source.start();
        console.log('[Audio] 播放普通音频');
      }
    } catch (error) {
      console.error('[Audio] 播放音频失败:', error);
    }
  }

  /**
   * 设置音频数据回调
   */
  onData(callback: (data: ArrayBuffer) => void): void {
    this.onAudioData = callback;
  }

  /**
   * 获取音频可视化数据
   */
  getVisualizationData(): Uint8Array | null {
    if (!this.analyser) {
      return null;
    }

    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    this.analyser.getByteTimeDomainData(dataArray);
    return dataArray;
  }

  /**
   * 绘制音频波形
   */
  drawWaveform(canvas: HTMLCanvasElement): void {
    if (!this.analyser) {
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    const draw = () => {
      this.animationId = requestAnimationFrame(draw);

      const bufferLength = this.analyser!.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      this.analyser!.getByteTimeDomainData(dataArray);

      ctx.fillStyle = 'rgb(240, 240, 240)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.lineWidth = 2;
      ctx.strokeStyle = 'rgb(0, 150, 136)';
      ctx.beginPath();

      const sliceWidth = (canvas.width * 1.0) / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = (dataArray[i] || 0) / 128.0;
        const y = (v * canvas.height) / 2;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();
    };

    draw();
  }

  /**
   * 停止绘制波形
   */
  stopWaveform(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  /**
   * 获取录音状态
   */
  getRecordingState(): boolean {
    return this.isRecording;
  }

  /**
   * 销毁音频服务
   */
  destroy(): void {
    this.stopRecording();
    this.stopWaveform();
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}

// 导出单例
export const audioService = new AudioService();
