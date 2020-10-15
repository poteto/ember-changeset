import { isArray } from '@ember/array';

export default function isObject(val) {
  return (
    val !== null &&
    typeof val === 'object' &&
    !(val instanceof Date || val instanceof RegExp) &&
    !isArray(val)
  );
}
