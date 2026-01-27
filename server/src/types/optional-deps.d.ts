/**
 * onnxruntime-node 类型声明
 * 可选依赖的类型定义
 */

declare module "onnxruntime-node" {
  export type TensorType =
    | "float32"
    | "float64"
    | "int8"
    | "int16"
    | "int32"
    | "int64"
    | "uint8"
    | "uint16"
    | "uint32"
    | "uint64"
    | "bool"
    | "string";

  export class Tensor {
    constructor(
      type: TensorType,
      data: ArrayLike<number> | BigInt64Array,
      dims?: readonly number[],
    );
    readonly data: ArrayLike<number> | BigInt64Array;
    readonly dims: readonly number[];
    readonly type: TensorType;
  }

  export interface SessionOptions {
    executionProviders?: string[];
    graphOptimizationLevel?: "disabled" | "basic" | "extended" | "all";
    enableMemPattern?: boolean;
    enableCpuMemArena?: boolean;
    intraOpNumThreads?: number;
    interOpNumThreads?: number;
  }

  export interface RunOptions {
    logSeverityLevel?: number;
    logVerbosityLevel?: number;
  }

  export interface InferenceSession {
    run(feeds: Record<string, Tensor>, options?: RunOptions): Promise<Record<string, Tensor>>;
    inputNames: readonly string[];
    outputNames: readonly string[];
  }

  export namespace InferenceSession {
    function create(path: string, options?: SessionOptions): Promise<InferenceSession>;
  }
}

declare module "opus-decoder" {
  export interface OpusDecoderOptions {
    sampleRate?: number;
    channels?: number;
    preSkip?: number;
    streamCount?: number;
    coupledStreamCount?: number;
    channelMappingTable?: number[];
    forceStereo?: boolean;
  }

  export interface DecodedAudio {
    channelData: Float32Array[];
    samplesDecoded: number;
    sampleRate: number;
  }

  export class OpusDecoder {
    constructor(options?: OpusDecoderOptions);
    ready: Promise<this>;
    reset(): void;
    free(): void;
    decodeFrame(opusFrame: Uint8Array): DecodedAudio | null;
    decodeFrames(opusFrames: Uint8Array[]): DecodedAudio | null;
  }

  export class OpusDecoderWebWorker extends OpusDecoder {}
}

declare module "lunar-typescript" {
  export class Solar {
    static fromDate(date: Date): Solar;
    static fromYmd(year: number, month: number, day: number): Solar;
    getYear(): number;
    getMonth(): number;
    getDay(): number;
    getLunar(): Lunar;
  }

  export class Lunar {
    getYear(): number;
    getMonth(): number;
    getDay(): number;
    getYearInGanZhi(): string;
    getMonthInChinese(): string;
    getDayInChinese(): string;
    getYearShengXiao(): string;
    getJieQi(): string | null;
    getFestivals(): string[];
  }

  export class SolarUtil {
    static getDaysOfYear(year: number): number;
  }
}
