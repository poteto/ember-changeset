// @flow

import { computed, get } from '@ember/object';

/*::
import type Change from 'ember-changeset/-private/change';
import type Err from 'ember-changeset/-private/err';
*/

const { keys } = Object;

/**
 * Transform an Object's values with a `transform` function.
 */
export default function transform /*:: <T> */ (
  dependentKey /*: string       */,
  transform    /*: (T) => mixed */
) /*: Object */ {
  return computed(dependentKey, function() {
    let obj /*: Object */ = get(this, dependentKey);
    return keys(obj).reduce((newObj, key) => {
      newObj[key] = transform(obj[key]);
      return newObj;
    }, {});
  });
}
