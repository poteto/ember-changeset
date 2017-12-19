import Ember from 'ember';
import pairs from 'ember-changeset/utils/pairs';

const {
  computed,
  get,
  typeOf
} = Ember;
const { keys } = Object;
const assign = Ember.assign || Ember.merge;

function objectToArray(
  objKey,
  type,
  transform = a => a,
  flattenObjects
) {
  return computed(objKey, function() {
    let obj = get(this, objKey);
    console.log('computing', objKey, JSON.stringify(obj))
    debugger
    let result = pairs(obj)
      .filter(p => p.value instanceof type)
      .map(p => {
        console.log('map')
        let key = p.key;
        let value = transform(p.value);

        if (flattenObjects && typeOf(value) === 'object') {
          return assign({ key }, value);
        }

        return { key, value };
      });
    console.log('result:', result)

    return result;
  }).readOnly();
}

export default objectToArray;
