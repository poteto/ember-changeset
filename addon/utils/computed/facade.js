// @flow

import { computed, get } from '@ember/object';
import facade from 'ember-changeset/utils/facade';

/*::
import type Change from 'ember-changeset/-private/change';
import type Err from 'ember-changeset/-private/err';
*/

/**
 * Transform object at `dependentKey`.
 *
 * This function replaces any child that is an instanceof `type` with
 * the result of a passed-in `transform` function.
 */
export default function computedFacade(
  dependentKey /*: string */,
  type /*: Class<Change | Err> | null */,
  transform /*: (Change | Err) => mixed */ = a => a
) /*: Object */ {
  return computed(dependentKey, function() {
    let obj = get(this, dependentKey);
    return facade(obj, type, transform);
  }).readOnly();
}
