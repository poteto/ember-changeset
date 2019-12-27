import { typeOf } from '@ember/utils';

export default function isObject(val) {
  return typeof val === 'object' || typeOf(val) === 'instance';
}
