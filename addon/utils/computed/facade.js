import pairs from 'ember-changeset/utils/pairs';
import { computed, get } from '@ember/object';
import deepSet from 'ember-deep-set';

/**
 * Transform object at `dependentKey`.
 *
 * This function replaces all instances of `type` with the result of a
 * passed-in `transform` function.
 */
export default function facade(dependentKey, type, transform) {
  return computed(dependentKey, function() {
    let obj = get(this, dependentKey);
    let result = pairs(obj)
      .filter(p => p.value instanceof type)
      .reduce((obj, { key, value: typeInstance }) => {
        deepSet(obj, key, transform(typeInstance))
        return obj;
      }, {});

    return result;
  }).readOnly();
}
