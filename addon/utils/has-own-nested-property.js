import isObject from './is-object';
import { isPresent, isBlank, typeOf } from '@ember/utils';
import { assert, runInDebug } from '@ember/debug';

/**
 * Checks if a path exists in an object or any of it's children.
 *
 * Optionally test that the value at the path is an instanceof a type.
 *
 * TODO: Add a test case for circular dependencies.
 *
 * @param {Object} object
 * @param {String} path
 * @param {Class} type
 * @return {Boolean}
 */
export default function hasOwnNestedProperty(object, key, type) {
  runInDebug(() => {
    let condition =
      isBlank(type) ||
      isPresent(type) && typeOf(type) === 'function';
    assert("Passed-in type should be a class.", condition);
  });

  let [nextKey, ...keyParts] = key.split('.');

  if (object.hasOwnProperty(nextKey)) {
    let value = object[nextKey];

    // If there are no more keys to test, we have reached the end of the
    // path and the key is present.
    if (keyParts.length === 0) {
      return isPresent(type) ? value instanceof type : true;
    }

    // If the next part of the object to test is not an object, then
    // don't go any further.
    if (!isObject(value)) {
      return false;
    }

    return hasOwnNestedProperty(object[nextKey], keyParts.join('.'), type);
  } else {
    return false;
  }
}
