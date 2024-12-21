export type Events = Record<string, (...args: any[]) => void>;

export class EventBroker<E extends Events> {
  private readonly listeners: Map<keyof E, Array<E[keyof E]>> = new Map();

  emit<K extends keyof E>(event: K, ...args: Parameters<E[K]>): void {
    const listeners = this.listeners.get(event) ?? [];
    listeners.forEach((cb) => {
      (cb as (...args: Parameters<E[K]>) => void)(...args);
    });
  }

  on<K extends keyof E>(event: K, cb: E[K]): void {
    const listeners = this.listeners.get(event) ?? [];
    listeners.push(cb);
    this.listeners.set(event, listeners);
  }

  off<K extends keyof E>(event: K, cb: E[K]): void {
    const listeners = this.listeners.get(event) ?? [];
    const index = listeners.indexOf(cb);
    if (index !== -1) {
      listeners.splice(index, 1);
    }
  }
}
