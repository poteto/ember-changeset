import { typeOf } from '@ember/utils';

export default function isObject(val) {
  return val !== null &&
    !(val instanceof Date) &&
    (typeof val === 'object' || typeOf(val) === 'instance');
}
