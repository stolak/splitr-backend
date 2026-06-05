import { Mutex } from 'async-mutex';

export class KeyedMutex {
  private locks = new Map<string, Mutex>();

  get(key: string): Mutex {
    if (!this.locks.has(key)) {
      this.locks.set(key, new Mutex());
    }
    return this.locks.get(key)!;
  }
}

export const accountLock = new KeyedMutex();
