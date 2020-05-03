import { Change } from 'validated-changeset';
import { get } from '@ember/object';

export function isLeafInChanges(key, changes) {
  return get(changes, key) && get(changes, key) instanceof Change;
}
