import { isArray } from '@ember/array';

/**
 * Employ Ember strategies for isObject detection
 * @method isObject
 */
export default function isObject(val) {
  return val !== null && typeof val === 'object' && !(val instanceof Date || val instanceof RegExp) && !isArray(val);
}
