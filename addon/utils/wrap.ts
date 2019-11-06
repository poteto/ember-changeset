/**
 * Wraps a value in an Ember.Array.
 *
 * @public
 * @param  {Any} value
 * @return {Ember.Array}
 */
export default function wrapInArray<T>(value: T | T[]): T[] {
  if (Array.isArray(value)) {
    return value;
  }

  return new Array((<T>value));
}

