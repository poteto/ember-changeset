import { typeOf } from '@ember/utils';

export default function isObject<T>(val: T): boolean {
  return typeof val === 'object' || typeOf(val) === 'instance';
}
