import { typeOf } from '@ember/utils';

export default function isObject<T>(val: T): boolean {
  return val !== null && (typeof val === 'object' || typeOf(val) === 'instance');
}
