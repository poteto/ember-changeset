import Ember from 'ember';

const { computed, get } = Ember;
const { keys } = Object;

/**
 * Shallow object comparison computed property. Checks all key/value pairs on
 * the first object and compares against the second object. Essentially, this
 * means that the second object must have the same key/values as the first, but
 * not vice versa.
 *
 * @public
 * @param  {String} sourceKey dependent key for first object
 * @param  {String} compareKey dependent key for second object
 * @return {Boolean}
 */
export default function objectEqual(sourceKey, compareKey) {
  return computed(sourceKey, compareKey, function() {
    let source = get(this, sourceKey);
    let compare = get(this, compareKey);

    return keys(source)
      .reduce((acc, key) => acc && get(source, key) === get(compare, key), true);
  }).readOnly();
}
