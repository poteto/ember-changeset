export interface INotifier {
  listeners: Function[],
  addListener(callback: Function): Function,
  removeListener(callback: Function): void,
  trigger(...args: any[]): void,
}

export default interface IEvented {
  on(eventName: string, callback: Function): INotifier,
  off(eventName: string, callback: Function): INotifier,
  trigger(eventName: string, ...args: any[]): void,
  _eventedNotifiers: { [key: string]: any }
}
