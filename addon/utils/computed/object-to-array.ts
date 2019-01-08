import { computed, get } from '@ember/object';
import ComputedProperty from '@ember/object/computed';
import { assign } from '@ember/polyfills';
import isObject from 'ember-changeset/utils/is-object';

const { keys } = Object;

/**
 * Compute the array form of an object.
 *
 * Each value of the object is transformed by a passed-in `transform`
 * function.
 *
 * Returns a list of objects, where each object has the form
 * `{ key, value }`. If `flattenObjects` is true and the result of
 * `transform` is an Object, the resulting object has the form
 * `{ key, ...transformResult }`.
 */
export default function objectToArray<T>(
  objKey: string,
  transform: (arg: T) => any = a => a,
  flattenObjects = false
): ComputedProperty<object[], object[]> {
  return computed(objKey, function() {
    let obj = get(this, objKey);

    return keys(obj).map(key => {
      let value = transform(obj[key]);

      if (flattenObjects && isObject(value)) {
        return assign({ key }, value);
      }

      return { key, value };
    })
  }).readOnly();
}
