import { isArray, A as emberArray } from '@ember/array';

/**
 * Wraps a value in an Ember.Array.
 *
 * @public
 * @param  {Any} value
 * @return {Ember.Array}
 */
export default function wrapInArray<T>(value: T | T[]): T[] {
  if (isArray(value)) {
    return emberArray(value);
  }

  return emberArray([value]);
}

