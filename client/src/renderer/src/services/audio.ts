/**
 * 极简音频服务 - 纯 Web Audio API 实现
 * 参考: Google web-audio-samples
 *
 * 功能:
 * - 麦克风录音 (MediaStream)
 * - 实时 PCM 捕获 (AudioWorklet)
 * - Opus 编码 (WebAssembly Worker)
 */

import OpusWorker from "@/workers/opus-codec-worker.ts?worker";

interface AudioConfig {
  sampleRate: number;
  channels: number;
  bitrate: number;
}

const DEFAULT_CONFIG: AudioConfig = {
  sampleRate: 16000,
  channels: 1,
  bitrate: 24000,
};

class AudioService {
  private context: AudioContext | null = null;
  private stream: MediaStream | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private worklet: AudioWorkletNode | null = null;
  private opusWorker: Worker | null = null;

  private _initialized = false;
  private _recording = false;
  private onDataCallback?: (data: Uint8Array) => void;

  get initialized() {
    return this._initialized;
  }

  get recording() {
    return this._recording;
  }

  /**
   * 初始化音频系统
   */
  async initialize(): Promise<void> {
    if (this._initialized) return;

    console.log("[Audio] 初始化...");

    try {
      // 1. 创建 AudioContext
      this.context = new AudioContext({
        sampleRate: DEFAULT_CONFIG.sampleRate,
      });
      console.log("[Audio] ✅ AudioContext:", this.context.sampleRate, "Hz");

      // 2. 加载 AudioWorklet 处理器
      const processorCode = this.getProcessorCode();
      const blob = new Blob([processorCode], {
        type: "application/javascript",
      });
      const url = URL.createObjectURL(blob);
      await this.context.audioWorklet.addModule(url);
      URL.revokeObjectURL(url);
      console.log("[Audio] ✅ AudioWorklet 已加载");

      // 3. 初始化 Opus 编码器
      await this.initOpusWorker();
      console.log("[Audio] ✅ Opus Worker 已就绪");

      this._initialized = true;
      console.log("[Audio] ✅ 初始化完成");
    } catch (error) {
      console.error("[Audio] ❌ 初始化失败:", error);
      throw error;
    }
  }

  /**
   * 初始化 Opus Worker
   */
  private initOpusWorker(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.opusWorker = new OpusWorker();

      this.opusWorker.onmessage = (e) => {
        const { type, opus } = e.data;

        if (type === "ready") {
          resolve();
        } else if (type === "encoded" && opus) {
          this.onDataCallback?.(new Uint8Array(opus));
        } else if (type === "error") {
          reject(new Error(e.data.error));
        }
      };

      this.opusWorker.onerror = reject;

      // 初始化编码器
      this.opusWorker.postMessage({
        type: "init",
        channels: DEFAULT_CONFIG.channels,
        sampleRate: DEFAULT_CONFIG.sampleRate,
        bitrate: DEFAULT_CONFIG.bitrate,
      });
    });
  }

  /**
   * 开始录音
   */
  async startRecording(): Promise<void> {
    if (this._recording || !this._initialized) {
      throw new Error("无法开始录音");
    }

    console.log("[Audio] 开始录音...");

    try {
      // 1. 获取麦克风
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
      console.log("[Audio] ✅ 麦克风已获取");

      // 2. 恢复 AudioContext
      if (this.context!.state === "suspended") {
        await this.context!.resume();
      }

      // 3. 创建音频图
      this.source = this.context!.createMediaStreamSource(this.stream);
      this.worklet = new AudioWorkletNode(this.context!, "pcm-recorder", {
        numberOfInputs: 1,
        numberOfOutputs: 0,
        processorOptions: {
          sampleRate: this.context!.sampleRate,
        },
      });

      // 4. 连接音频图 (参考 Google web-audio-samples)
      this.source.connect(this.worklet);
      console.log("[Audio] ✅ 音频图: source → worklet");

      // 5. 监听 PCM 数据
      this.worklet.port.onmessage = (e) => {
        if (e.data.type === "pcm" && this.opusWorker) {
          const pcm = new Int16Array(e.data.data);
          this.opusWorker.postMessage(
            { type: "encode", pcmInt16: pcm.buffer },
            [pcm.buffer]
          );
        }
      };

      // 6. 启动录音
      this.worklet.port.postMessage({ type: "start" });
      this._recording = true;
      console.log("[Audio] ✅ 录音已启动");
    } catch (error) {
      console.error("[Audio] ❌ 启动录音失败:", error);
      this.cleanup();
      throw error;
    }
  }

  /**
   * 停止录音
   */
  stopRecording(): void {
    if (!this._recording) return;

    console.log("[Audio] 停止录音...");

    this.worklet?.port.postMessage({ type: "stop" });
    this.cleanup();
    this._recording = false;
    console.log("[Audio] ✅ 录音已停止");
  }

  /**
   * 清理资源
   */
  private cleanup(): void {
    this.worklet?.disconnect();
    this.source?.disconnect();
    this.stream?.getTracks().forEach((track) => track.stop());

    this.worklet = null;
    this.source = null;
    this.stream = null;
  }

  /**
   * 设置数据回调
   */
  onData(callback: (data: Uint8Array) => void): void {
    this.onDataCallback = callback;
  }

  /**
   * 获取 AudioWorklet 处理器代码
   * 内联在这里避免额外文件
   */
  private getProcessorCode(): string {
    return `
// PCM 录音处理器 - 参考 Google web-audio-samples/RecorderProcessor
class PCMRecorderProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super();
    this.sampleRate = options.processorOptions?.sampleRate || 16000;
    this.buffer = [];
    this.recording = false;
    this.frameSize = 960; // 60ms @ 16kHz

    this.port.onmessage = (e) => {
      if (e.data.type === 'start') {
        this.recording = true;
        this.buffer = [];
        console.log('[PCMRecorder] 开始录音');
      } else if (e.data.type === 'stop') {
        this.recording = false;
        this.buffer = [];
        console.log('[PCMRecorder] 停止录音');
      }
    };
  }

  process(inputs, outputs) {
    const input = inputs[0];

    if (!input || !input[0] || !this.recording) {
      return true;
    }

    const channelData = input[0]; // 单声道

    // 累积数据
    for (let i = 0; i < channelData.length; i++) {
      this.buffer.push(channelData[i]);
    }

    // 发送完整帧
    while (this.buffer.length >= this.frameSize) {
      const frame = this.buffer.splice(0, this.frameSize);

      // Float32 → Int16
      const int16 = new Int16Array(frame.length);
      for (let i = 0; i < frame.length; i++) {
        const s = Math.max(-1, Math.min(1, frame[i]));
        int16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
      }

      this.port.postMessage(
        { type: 'pcm', data: int16.buffer },
        [int16.buffer]
      );
    }

    return true;
  }
}

registerProcessor('pcm-recorder', PCMRecorderProcessor);
`;
  }

  /**
   * 销毁服务
   */
  destroy(): void {
    this.stopRecording();
    this.opusWorker?.terminate();
    this.context?.close();

    this.opusWorker = null;
    this.context = null;
    this._initialized = false;
  }
}

// 单例导出
export const audioService = new AudioService();
