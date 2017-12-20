// @flow

import Ember from 'ember';
import pairs from 'ember-changeset/utils/pairs';

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

function objectToArray(
  objKey /*: string */,
  type /*: Change | Err */,
  transform /*: (Change | Err) => mixed*/ = a => a,
  flattenObjects /*: boolean */
) {
  return computed(objKey, function() {
    let obj = get(this, objKey);
    let result = pairs(obj)
      .filter(p => p.value instanceof type)
      .map(p => {
        let key = p.key;
        let value = transform(p.value);

        if (flattenObjects && typeOf(value) === 'object') {
          return assign({ key }, value);
        }

        return { key, value };
      });

    return result;
  }).readOnly();
}

export default objectToArray;
