// @flow

import pairs from 'ember-changeset/utils/pairs';
import deepSet from 'ember-deep-set';
import { isPresent } from '@ember/utils';

/*::
import type Change from 'ember-changeset/-private/change';
import type Err from 'ember-changeset/-private/err';
*/

/**
 * Transform object.
 *
 * This function replaces any child that is an instanceof `type` with
 * the result of a passed-in `transform` function.
 */
export default function facade(
  obj /*: Object */,
  type /*: Class<Change | Err> | null */,
  transform /*: (Change | Err) => mixed */ = a => a
) /*: Object */ {
  return pairs(obj)
    .filter(p => isPresent(type) ? p.value instanceof type : true)
    .reduce((obj, { key, value }) => {
      deepSet(obj, key, transform(value));
      return obj;
    }, {});
}
