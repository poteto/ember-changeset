import Ember from 'ember';
import pairs from 'ember-changeset/utils/pairs';

const {
  computed,
  get,
  typeOf
} = Ember;
const assign = Ember.assign || Ember.merge;

function objectToArray(
  objKey,
  type,
  transform = a => a,
  flattenObjects
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
