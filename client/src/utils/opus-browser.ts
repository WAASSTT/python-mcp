/**
 * Opus WASM 浏览器加载器
 * 基于 @evan/wasm，从本地加载 WASM 文件避免 CDN 依赖
 */

let u8: Uint8Array;
let wasm: any;
let pptr: number;
let bptr: number;
let pptrs: Uint8Array;
let bptrs: Uint8Array;

const pptrl = 2 ** 13;
let initialized = false;

function clamp(min: number, int: number, max: number): number {
  const t = int < min ? min : int;
  return t > max ? max : t;
}

function err(code: number): number {
  if (0 > code) {
    throw new Error(`opus: ${loadStaticString(u8, wasm.opus_strerror(code))}`);
  }
  return code;
}

function loadStaticString(u8: Uint8Array, ptr: number): string {
  let s = "";
  const l = u8.length | 0;
  for (let o = ptr | 0; o < l; o++) {
    const x = u8[o];
    if (0 === x) break;
    s += String.fromCharCode(x!);
  }
  return s;
}

/**
 * 初始化 Opus WASM
 */
export async function initOpus(): Promise<void> {
  if (initialized) return;

  const response = await fetch("/opus.wasm");
  const wasmBytes = await response.arrayBuffer();
  const module = new WebAssembly.Module(wasmBytes);
  const instance = new WebAssembly.Instance(module, {
    wasi_snapshot_preview1: {
      fd_seek() {},
      fd_write() {},
      fd_close() {},
      proc_exit() {},
    },
    env: {
      emscripten_notify_memory_growth() {
        u8 = new Uint8Array(wasm.memory.buffer);
        pptrs = u8.subarray(pptr, pptr + 2 ** 13);
        bptrs = u8.subarray(bptr, bptr + 2 ** 15);
      },
    },
  });

  wasm = instance.exports as any;
  pptr = wasm.malloc(2 ** 13);
  bptr = wasm.malloc(2 ** 15);
  u8 = new Uint8Array(wasm.memory.buffer);
  pptrs = u8.subarray(pptr, pptr + 2 ** 13);
  bptrs = u8.subarray(bptr, bptr + 2 ** 15);
  initialized = true;
}

const ctl = {
  application: { voip: 2048, audio: 2049, restricted_lowdelay: 2051 },
  set: { bitrate: 4002, complexity: 4010 },
  get: { bitrate: 4003, complexity: 4011, sample_rate: 4029 },
};

/**
 * Opus 编码器
 */
export class Encoder {
  private ptr = 0;
  public channels: number;

  constructor(options: {
    sample_rate: number;
    channels: number;
    application: "voip" | "audio" | "restricted_lowdelay";
  }) {
    if (!initialized) throw new Error("Call initOpus() first");

    this.channels = options.channels;
    this.ptr = wasm.malloc(wasm.opus_encoder_get_size(options.channels));
    const app = ctl.application[options.application];

    try {
      err(wasm.opus_encoder_init(this.ptr, options.sample_rate, options.channels, app));
    } catch (e) {
      wasm.free(this.ptr);
      throw e;
    }
  }

  ctl(cmd: number, arg?: number): number {
    if (arg == null) {
      return wasm.opus_encoder_ctl_get(this.ptr, cmd);
    }
    return err(wasm.opus_encoder_ctl_set(this.ptr, cmd, arg));
  }

  encode(buffer: Int16Array): Uint8Array {
    const buf = new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
    bptrs.set(buf);
    return pptrs.slice(
      0,
      err(wasm.opus_encode(this.ptr, bptr, buffer.length / this.channels, pptr, pptrl)),
    );
  }

  set bitrate(value: number) {
    this.ctl(ctl.set.bitrate, clamp(500, value | 0, 512000));
  }

  set complexity(value: number) {
    this.ctl(ctl.set.complexity, clamp(0, value, 10));
  }

  get bitrate(): number {
    return this.ctl(ctl.get.bitrate);
  }

  get complexity(): number {
    return this.ctl(ctl.get.complexity);
  }

  get sample_rate(): number {
    return this.ctl(ctl.get.sample_rate);
  }
}
