// @flow

import Ember from 'ember';

/*::
import type Change from 'ember-changeset/-private/change';
import type Err from 'ember-changeset/-private/err';
*/

const {
  computed,
  get,
  typeOf
} = Ember;
const assign = Ember.assign || Ember.merge;
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
export default function objectToArray /*:: <T> */ (
  objKey         /*: string             */,
  transform      /*: (T) => (mixed) */ = a => a,
  flattenObjects /*: boolean            */ = false
) /*: Array<{ key: string }> */ {
  return computed(objKey, function() {
    let obj = get(this, objKey);

    return keys(obj).map(key => {
      let value = transform(obj[key]);

      if (flattenObjects && typeOf(value) === 'object') {
        return assign({ key }, value);
      }

      return { key, value };
    })
  }).readOnly();
}
