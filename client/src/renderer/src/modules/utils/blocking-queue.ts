/**
 * 阻塞队列
 * 用于音频流等场景的异步数据处理
 */

interface Waiter<T> {
  resolve: (value: T[]) => void;
  reject: (reason?: any) => void;
  min: number;
  onTimeout: ((currentLength: number) => void) | null;
  timer: ReturnType<typeof setTimeout> | null;
}

export class BlockingQueue<T = any> {
  private items: T[] = [];
  private waiters: Waiter<T>[] = [];

  // 空队列一次性闸门
  private emptyPromise: Promise<void> | null = null;
  private emptyResolve: (() => void) | null = null;

  /**
   * 生产者：把数据塞进去
   */
  public enqueue(item: T, ...restItems: T[]): void {
    if (restItems.length === 0) {
      this.items.push(item);
    } else {
      // 如果有额外参数，批量处理所有项
      const items = [item, ...restItems].filter((i) => i != null);
      if (items.length === 0) return;
      this.items.push(...items);
    }

    // 若有空队列闸门，一次性放行所有等待者
    if (this.emptyResolve) {
      this.emptyResolve();
      this.emptyResolve = null;
      this.emptyPromise = null;
    }

    // 唤醒所有正在等的 waiter
    this.wakeWaiters();
  }

  /**
   * 消费者：min 条或 timeout ms 先到谁
   */
  public async dequeue(
    min: number = 1,
    timeout: number = Infinity,
    onTimeout: ((currentLength: number) => void) | null = null
  ): Promise<T[]> {
    // 1. 若空，等第一次数据到达（所有调用共享同一个 promise）
    if (this.items.length === 0) {
      await this.waitForFirstItem();
    }

    // 立即满足
    if (this.items.length >= min) {
      return this.flush();
    }

    // 需要等待
    return new Promise<T[]>((resolve, reject) => {
      let timer: ReturnType<typeof setTimeout> | null = null;
      const waiter: Waiter<T> = { resolve, reject, min, onTimeout, timer };

      // 超时逻辑
      if (Number.isFinite(timeout)) {
        waiter.timer = setTimeout(() => {
          this.removeWaiter(waiter);
          if (onTimeout) onTimeout(this.items.length);
          resolve(this.flush());
        }, timeout);
      }

      this.waiters.push(waiter);
    });
  }

  /**
   * 空队列闸门生成器
   */
  private waitForFirstItem(): Promise<void> {
    if (!this.emptyPromise) {
      this.emptyPromise = new Promise<void>((resolve) => {
        this.emptyResolve = resolve;
      });
    }
    return this.emptyPromise;
  }

  /**
   * 内部：每次数据变动后，检查哪些 waiter 已满足
   */
  private wakeWaiters(): void {
    for (let i = this.waiters.length - 1; i >= 0; i--) {
      const w = this.waiters[i];
      if (w && this.items.length >= w.min) {
        this.removeWaiter(w);
        w.resolve(this.flush());
      }
    }
  }

  /**
   * 移除等待者
   */
  private removeWaiter(waiter: Waiter<T>): void {
    const idx = this.waiters.indexOf(waiter);
    if (idx !== -1) {
      this.waiters.splice(idx, 1);
      if (waiter.timer) clearTimeout(waiter.timer);
    }
  }

  /**
   * 清空并返回所有数据
   */
  private flush(): T[] {
    const snapshot = [...this.items];
    this.items.length = 0;
    return snapshot;
  }

  /**
   * 当前缓存长度（不含等待者）
   */
  public get length(): number {
    return this.items.length;
  }

  /**
   * 清空队列（保持对象引用，不影响等待者）
   */
  public clear(): void {
    this.items.length = 0;
  }
}
