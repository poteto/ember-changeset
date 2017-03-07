import Ember from 'ember';
import isObject from '../is-object';

const {
  computed,
  get
} = Ember;
const { keys } = Object;
const assign = Ember.assign || Ember.merge;

export default function objectToArray(objKey, flattenObjects) {
  return computed(objKey, function() {
    let obj = get(this, objKey);

    return keys(obj).map((key) => {
      let value = obj[key];

      if (flattenObjects && isObject(value)) {
        return assign({ key }, value);
      }

      return { key, value };
    });
  }).readOnly();
}
