import { typeOf } from '@ember/utils';

export default function isObject(val) {
  return val !== null && (typeof val === 'object' || typeOf(val) === 'instance');
}
