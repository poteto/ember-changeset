import { Change } from 'validated-changeset';

export function isLeafInChanges(key, changes) {
  return key in changes && changes[key] instanceof Change;
}
