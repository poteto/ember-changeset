// this statefull class holds and notifies

export default class Notifier<T extends any[]>{
  listeners: ((...args: T) => void)[]

  constructor() {
    this.listeners = [];
  }

  addListener(callback: (...args: T) => void) {
    this.listeners.push(callback);
    return () => this.removeListener(callback);
  }

  removeListener(callback: (...args: T) => void) {
    for (let i = 0; i < this.listeners.length; i++) {
      if (this.listeners[i] === callback) {
        this.listeners.splice(i, 1);
        return;
      }
    }
  }

  trigger(...args: T) {
    this.listeners.forEach(callback => callback(...args));
  }
}
