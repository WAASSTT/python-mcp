/**
 * Opus 编解码 Worker
 * 使用 @evan/wasm 进行音频编码和解码
 */

import * as opus from "@evan/wasm/target/opus/simd.js";

let encoder: any = null;
let decoder: any = null;
let isReady = false;
let sampleRate = 16000;
let channels = 1;
let frameSize = 960; // 60ms at 16kHz

self.onmessage = async (event: MessageEvent) => {
  const { type } = event.data;

  try {
    if (type === "init") {
      // 初始化编解码器
      channels = event.data.channels || 1;
      sampleRate = event.data.sampleRate || 16000;
      const bitrate = event.data.bitrate || 24000;
      frameSize = (sampleRate * 60) / 1000; // 60ms frame

      console.log(
        `[OpusCodecWorker] 初始化: ${channels}ch, ${sampleRate}Hz, ${bitrate}bps, frame=${frameSize}`
      );

      // 创建编码器和解码器实例
      encoder = new opus.Encoder(sampleRate, channels);
      decoder = new opus.Decoder(sampleRate, channels);

      // 设置比特率和编码参数
      if (encoder) {
        // ✅ 完全对齐ESP32配置 (AS_OPUS_ENC_CONFIG)
        // 注意：浏览器opus库不支持AUTO，使用默认值让其自动调整
        try {
          encoder.vbr = true; // VBR启用 (对应 enable_vbr = true)
          encoder.useDTX = true; // ✅ DTX启用 (对应 enable_dtx = true)
          encoder.complexity = 0; // 最低复杂度，速度优先 (对应 complexity = 0)
          // bitrate不设置，使用库的默认行为 (对应 ESP_OPUS_BITRATE_AUTO)
          console.log(
            `[OpusCodecWorker] ESP32配置: VBR=true, DTX=true, complexity=0, bitrate=AUTO`
          );
          console.log(
            `[OpusCodecWorker] ⚠️  如果音频包过小(<60字节)，说明浏览器环境不适合DTX，请禁用`
          );
        } catch (e) {
          console.warn(`[OpusCodecWorker] 无法设置VBR/DTX参数:`, e);
        }
      }

      isReady = true;
      self.postMessage({ type: "ready" });
    } else if (type === "encode") {
      // 编码 PCM 到 Opus
      if (!isReady || !encoder) {
        throw new Error("Encoder not ready");
      }

      // 数据在 event.data.pcmInt16 中，已经是 Int16Array 的 ArrayBuffer
      const pcmInt16Buf = event.data.pcmInt16;
      if (!pcmInt16Buf) {
        throw new Error("No pcmInt16 data provided");
      }

      const int16Data = new Int16Array(pcmInt16Buf);

      // 检查帧大小（Opus 只支持特定大小）
      if (
        int16Data.length !== 480 &&
        int16Data.length !== 960 &&
        int16Data.length !== 1920 &&
        int16Data.length !== 2880
      ) {
        throw new Error(
          `Invalid frame size: ${int16Data.length}, expected 480/960/1920/2880`
        );
      }

      // 计算 PCM 音量（检测是否静音）
      let maxAmplitude = 0;
      for (let i = 0; i < int16Data.length; i++) {
        maxAmplitude = Math.max(maxAmplitude, Math.abs(int16Data[i]));
      }
      const isSilent = maxAmplitude < 100; // 静音阈值

      const opusData = encoder.encode(int16Data);

      console.log(
        `[OpusCodecWorker] 编码: PCM=${int16Data.length}samples, max=${maxAmplitude}, Opus=${opusData.length}bytes, 静音=${isSilent}`
      );

      const id = event.data.id;
      self.postMessage({ type: "encoded", id, opus: opusData.buffer }, [
        opusData.buffer,
      ]);
    } else if (type === "decode") {
      // 解码 Opus 到 PCM
      if (!isReady || !decoder) {
        throw new Error("Decoder not ready");
      }

      // 数据在 event.data.opus 中，已经是 ArrayBuffer
      const opusBuf = event.data.opus;
      if (!opusBuf) {
        throw new Error("No opus data provided");
      }

      const opusData = new Uint8Array(opusBuf);
      const pcmInt16 = decoder.decode(opusData);

      // 转换 Int16 到 Float32
      const pcmFloat32 = new Float32Array(pcmInt16.length);
      for (let i = 0; i < pcmInt16.length; i++) {
        pcmFloat32[i] = pcmInt16[i] / (pcmInt16[i] < 0 ? 0x8000 : 0x7fff);
      }

      self.postMessage(
        { type: "decoded", pcmFloat32: pcmFloat32.buffer, sampleRate },
        [pcmFloat32.buffer]
      );
    } else if (type === "destroy") {
      // 清理资源
      if (encoder) {
        encoder = null;
      }
      if (decoder) {
        decoder = null;
      }
      isReady = false;
      self.postMessage({ type: "destroyed" });
    }
  } catch (error) {
    console.error("[OpusCodecWorker] Error:", error);
    self.postMessage({ type: "error", error: String(error) });
  }
};

export {};
