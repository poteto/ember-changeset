import isObject from 'ember-changeset/utils/is-object';
import { isArray } from '@ember/array';

/**
 * Recursivly loops over all sub object and
 * returns an array of keys in nesteted string format.
 *
 * eg. this object
 *  {
 *    item: {
 *      innerItem: {
 *        thing: 1,
 *        other: 2,
 *        nest: {
 *          thing: 3,
 *          other: 4
 *        }
 *      }
 *    }
 *  }
 *
 * into in array of keys
 *
 * [
 *   'item.innerItem.thing',
 *   'item.innerItem.other',
 *   'item.innerItem.nest.thing',
 *   'item.innerItem.nest.other',
 * ]
 *
 * @param  {Object} [object={}] Object whos keys to iterate over.
 * @param  {String} [scope=''] A sring that can be prepended to the key.
 * @return {Array}
 */
const recursiveKeys = function(object = {}, scope = '') {
  return Object.keys(object).reduce(function(keys, key) {
    const value = object[key];
    let newKeys = [scope + key];

    if (isObject(value) && !isArray(value) && Object.keys(value).length) {
      newKeys = recursiveKeys(value, scope + key + '.');
    }

    return keys.concat(newKeys);
  }, []);
}

export default recursiveKeys;
