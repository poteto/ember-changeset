// This file add and removes listeners for specific events via `on` method
import Notifier from './notifier';

// interface IBase {
//   on: Function,
//   off: Function,
//   trigger: Function,
//   _eventedNotifiers: object
// }

export default function addEvented<T>(Base: T) {
  return class extends Base {
    on(eventName: string, callback: Function): void {
      const notifier = notifierForEvent(this, eventName);
      return notifier.addListener(callback);
    }

    off(eventName: string, callback: Function) {
      const notifier = notifierForEvent(this, eventName);
      return notifier.removeListener(callback);
    }

    trigger(eventName: string, ...args: any[]) {
      const notifier = notifierForEvent(this, eventName);
      if (notifier) {
        notifier.trigger.apply(notifier, args);
      }
    }
  }
}

function notifierForEvent<IBase>(object: IBase, eventName: string) {
  if (object._eventedNotifiers === undefined) {
    object._eventedNotifiers = {};
  }

  let notifier = object._eventedNotifiers[eventName];

  if (!notifier) {
    notifier = object._eventedNotifiers[eventName] = new Notifier();
  }

  return notifier;
}
