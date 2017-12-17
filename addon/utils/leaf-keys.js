import isObject from 'ember-changeset/utils/is-object';
import isPromise from 'ember-changeset/utils/is-promise';
import { isArray } from '@ember/array';

/**
 * @param  {Object} [object={}] Object to inspect.
 * @param  {String} [scope=''] A string that can be prepended to the object's keys.
 * @return {Array} Array of the leaf-most keys
 */
const _leafKeys = function(object = {}, scope = '') {
  return Object.keys(object).reduce(function(keys, key) {
    const value = object[key];
    let newKeys = [scope + key];

    if (
      isObject(value) &&
      !isPromise(value) &&
      !isArray(value) &&
      Object.keys(value).length
    ) {
      newKeys = _leafKeys(value, scope + key + '.');
    }

    return keys.concat(newKeys);
  }, []);
};

/**
 * Given an object, return an array of the leaf-most keys
 * in nested string format.
 *
 * @param  {Object} [object={}] Object to inspect.
 * @return {Array} Array of the leaf-most keys
 */
export default function leafKeys(object = {}) {
  return _leafKeys(object);
}
