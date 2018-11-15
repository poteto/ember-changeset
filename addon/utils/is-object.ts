import { typeOf } from '@ember/utils';

export default function isObject(val: object) {
  return typeOf(val) === 'object' || typeOf(val) === 'instance';
}
