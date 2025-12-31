/**
 * @evan/opus Opus 编解码器类型声明
 */
declare module '@evan/opus' {
  export interface EncodeOptions {
    sampleRate: number;
    channels: number;
    application: number; // 2048 for VOIP
    frameSize: number;
  }

  export interface DecodeOptions {
    sampleRate: number;
    channels: number;
    frameSize: number;
  }

  /**
   * 编码PCM音频为Opus
   * @param pcm - 16位PCM数据
   * @param options - 编码选项
   * @returns Opus编码数据
   */
  export function encode(pcm: Int16Array, options: EncodeOptions): Uint8Array;

  /**
   * 解码Opus音频为PCM
   * @param opus - Opus编码数据
   * @param options - 解码选项
   * @returns 16位PCM数据
   */
  export function decode(opus: Uint8Array, options: DecodeOptions): Int16Array;
}
