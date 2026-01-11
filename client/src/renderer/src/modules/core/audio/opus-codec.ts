/**
 * Opus 编解码器 - 使用 libopus.js
 */

import { logger } from "../../utils/logger";

declare global {
  interface Window {
    Module: any;
    ModuleInstance: any;
  }
}

let isOpusLoaded = false;
let opusLoadPromise: Promise<boolean> | null = null;

export interface OpusEncoder {
  channels: number;
  rate: number;
  frameSize: number;
  module: any;
  encoderPtr: number | null;
  init(): boolean;
  encode(pcmData: Int16Array): Uint8Array;
  destroy(): void;
}

export interface OpusDecoder {
  channels: number;
  rate: number;
  frameSize: number;
  module: any;
  decoderPtr: number | null;
  init(): boolean;
  decode(opusData: Uint8Array): Int16Array;
  destroy(): void;
}

/**
 * 动态加载 libopus.js
 */
async function loadOpusLibrary(): Promise<boolean> {
  if (isOpusLoaded) return true;

  if (opusLoadPromise) return opusLoadPromise;

  opusLoadPromise = new Promise<boolean>((resolve) => {
    try {
      // 创建 script 标签加载 libopus.js
      const script = document.createElement("script");
      script.src = "/libopus.js";
      script.async = true;

      script.onerror = () => {
        logger.error("Opus 库加载失败：无法加载 libopus.js");
        resolve(false);
      };

      // 等待 Module 初始化完成
      const checkInterval = setInterval(() => {
        if (typeof window.Module !== "undefined") {
          if (
            typeof window.Module.instance !== "undefined" &&
            typeof window.Module.instance._opus_decoder_get_size === "function"
          ) {
            window.ModuleInstance = window.Module.instance;
            clearInterval(checkInterval);
            isOpusLoaded = true;
            logger.success("Opus 库动态加载成功");
            resolve(true);
          } else if (
            typeof window.Module._opus_decoder_get_size === "function"
          ) {
            window.ModuleInstance = window.Module;
            clearInterval(checkInterval);
            isOpusLoaded = true;
            logger.success("Opus 库动态加载成功");
            resolve(true);
          }
        }
      }, 10);

      // 超时处理
      setTimeout(() => {
        clearInterval(checkInterval);
        if (!isOpusLoaded) {
          logger.error("Opus 库加载超时");
          resolve(false);
        }
      }, 5000);

      // 添加 script 到 document
      document.head.appendChild(script);
    } catch (error: any) {
      logger.error(`Opus 库加载失败: ${error.message}`);
      resolve(false);
    }
  });

  return opusLoadPromise;
}

/**
 * 检查 Opus 库是否已加载（异步）
 */
export async function checkOpusLoaded(): Promise<boolean> {
  return await loadOpusLibrary();
}

/**
 * 同步检查 Opus 库状态
 */
export function isOpusReady(): boolean {
  return isOpusLoaded && typeof window.ModuleInstance !== "undefined";
}

/**
 * 获取 Opus 模块实例
 */
function getOpusModule(): any {
  if (typeof window.ModuleInstance !== "undefined") {
    return window.ModuleInstance;
  }
  if (typeof window.Module !== "undefined") {
    if (typeof window.Module.instance !== "undefined") {
      window.ModuleInstance = window.Module.instance;
      return window.ModuleInstance;
    }
    window.ModuleInstance = window.Module;
    return window.Module;
  }
  throw new Error("Opus 库未加载");
}

/**
 * 初始化 Opus 编码器
 */
export function initOpusEncoder(
  channels: number = 1,
  rate: number = 16000,
  frameSize: number = 960
): OpusEncoder {
  const mod = getOpusModule();

  const encoder: OpusEncoder = {
    channels,
    rate,
    frameSize,
    module: mod,
    encoderPtr: null,

    init() {
      if (this.encoderPtr) return true;

      const encoderSize = mod._opus_encoder_get_size(this.channels);
      logger.debug(`Opus编码器大小: ${encoderSize}字节`);

      this.encoderPtr = mod._malloc(encoderSize);
      if (!this.encoderPtr) {
        throw new Error("无法分配编码器内存");
      }

      const err = mod._opus_encoder_init(
        this.encoderPtr,
        this.rate,
        this.channels,
        2048 // OPUS_APPLICATION_VOIP
      );

      if (err < 0) {
        this.destroy();
        throw new Error(`Opus编码器初始化失败: ${err}`);
      }

      logger.success("Opus编码器初始化成功");
      return true;
    },

    encode(pcmData: Int16Array): Uint8Array {
      if (!this.encoderPtr) {
        if (!this.init()) {
          throw new Error("编码器未初始化且无法初始化");
        }
      }

      const mod = this.module;
      const pcmPtr = mod._malloc(pcmData.length * 2);
      mod.HEAP16.set(pcmData, pcmPtr / 2);

      const maxPacketSize = 4000;
      const opusPtr = mod._malloc(maxPacketSize);

      const encodedLength = mod._opus_encode(
        this.encoderPtr,
        pcmPtr,
        this.frameSize,
        opusPtr,
        maxPacketSize
      );

      mod._free(pcmPtr);

      if (encodedLength < 0) {
        mod._free(opusPtr);
        throw new Error(`Opus编码失败: ${encodedLength}`);
      }

      const opusData = new Uint8Array(
        mod.HEAPU8.buffer,
        opusPtr,
        encodedLength
      ).slice();
      mod._free(opusPtr);

      return opusData;
    },

    destroy() {
      if (this.encoderPtr) {
        mod._free(this.encoderPtr);
        this.encoderPtr = null;
        logger.info("Opus编码器已销毁");
      }
    },
  };

  return encoder;
}

/**
 * 初始化 Opus 解码器
 */
export function initOpusDecoder(
  channels: number = 1,
  rate: number = 16000,
  frameSize: number = 960
): OpusDecoder {
  const mod = getOpusModule();

  const decoder: OpusDecoder = {
    channels,
    rate,
    frameSize,
    module: mod,
    decoderPtr: null,

    init() {
      if (this.decoderPtr) return true;

      const decoderSize = mod._opus_decoder_get_size(this.channels);
      logger.debug(`Opus解码器大小: ${decoderSize}字节`);

      this.decoderPtr = mod._malloc(decoderSize);
      if (!this.decoderPtr) {
        throw new Error("无法分配解码器内存");
      }

      const err = mod._opus_decoder_init(
        this.decoderPtr,
        this.rate,
        this.channels
      );

      if (err < 0) {
        this.destroy();
        throw new Error(`Opus解码器初始化失败: ${err}`);
      }

      logger.success("Opus解码器初始化成功");
      return true;
    },

    decode(opusData: Uint8Array): Int16Array {
      if (!this.decoderPtr) {
        if (!this.init()) {
          throw new Error("解码器未初始化且无法初始化");
        }
      }

      const mod = this.module;
      const opusPtr = mod._malloc(opusData.length);
      mod.HEAPU8.set(opusData, opusPtr);

      const pcmPtr = mod._malloc(this.frameSize * 2);

      const decodedSamples = mod._opus_decode(
        this.decoderPtr,
        opusPtr,
        opusData.length,
        pcmPtr,
        this.frameSize,
        0
      );

      mod._free(opusPtr);

      if (decodedSamples < 0) {
        mod._free(pcmPtr);
        throw new Error(`Opus解码失败: ${decodedSamples}`);
      }

      const pcmData = new Int16Array(
        mod.HEAP16.buffer,
        pcmPtr,
        decodedSamples
      ).slice();
      mod._free(pcmPtr);

      return pcmData;
    },

    destroy() {
      if (this.decoderPtr) {
        mod._free(this.decoderPtr);
        this.decoderPtr = null;
        logger.info("Opus解码器已销毁");
      }
    },
  };

  return decoder;
}
