import isObject from 'ember-changeset/utils/is-object';
import { isArray } from '@ember/array';

/**
 * Given an object, return an array of the leaf-most keys
 * in nested string format.
 *
 * @param  {Object} [object={}] Object to inspect.
 * @param  {String} [scope=''] A string that can be prepended to the object's keys.
 * @return {Array}
 */
const leafKeys = function(object = {}, scope = '') {
  return Object.keys(object).reduce(function(keys, key) {
    const value = object[key];
    let newKeys = [scope + key];

    if (isObject(value) && !isArray(value) && Object.keys(value).length) {
      newKeys = leafKeys(value, scope + key + '.');
    }

    return keys.concat(newKeys);
  }, []);
}

export default leafKeys;
