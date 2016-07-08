import Ember from 'ember';

const {
  computed,
  get,
  typeOf
} = Ember;
const { keys } = Object;
const assign = Ember.assign || Ember.merge;

export default function objectToArray(objKey) {
  return computed(objKey, function() {
    let obj = get(this, objKey);

    return keys(obj).map((key) => {
      let value = obj[key];

      if (typeOf(value) === 'object') {
        return assign({ key }, value);
      }

      return { key, value };
    });
  }).readOnly();
}
