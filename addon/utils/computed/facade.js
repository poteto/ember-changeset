import { computed, get } from '@ember/object';
import facade from 'ember-changeset/utils/facade';

/**
 * Transform object at `dependentKey`.
 *
 * This function replaces any child that is an instanceof `type` with
 * the result of a passed-in `transform` function.
 */
export default function computedFacade(dependentKey, type, transform = a => a) {
  return computed(dependentKey, function() {
    let obj = get(this, dependentKey);
    debugger
    return facade(obj, type, transform);
  }).readOnly();
}
