import Ember from 'ember';

const { computed, get } = Ember;
const { keys } = Object;

/**
 * Checks given values at certain paths to the values on a nested object.
 * The first key references a flat object whose keys are paths. The second
 * key references an arbitrary object that may be nested.
 *
 * @public
 * @param  {String} sourceKey path object
 * @param  {String} compareKey
 * @return {Boolean}
 */
export default function objectEqual(sourceKey, compareKey) {
  return computed(sourceKey, compareKey, function() {
    let source = get(this, sourceKey);
    let compare = get(this, compareKey);

    return keys(source)
      .every(key => source[key] === get(compare, key));
  }).readOnly();
}
