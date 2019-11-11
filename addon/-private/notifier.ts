// this statefull class holds and notifies
import { INotifier } from '../types/evented';

export default class Notifier implements INotifier {
  listeners: Function[]

  constructor() {
    this.listeners = [];
  }

  addListener(callback: Function) {
    this.listeners.push(callback);
    return () => this.removeListener(callback);
  }

  removeListener(callback: Function) {
    this.listeners;

    for (let i = 0; i < this.listeners.length; i++) {
      if (this.listeners[i] === callback) {
        this.listeners.splice(i, 1);
        return;
      }
    }
  }

  trigger(...args: any[]) {
    this.listeners.slice(0).forEach(callback => callback(...args));
  }
}
