import isObject from './is-object';

/**
 * Checks if a path exists in an object or any of it's children
 *
 * @param {Object} object
 * @param {String} path
 * @return {Boolean}
 */
export default function hasOwnNestedProperty(object, key) {
  let keyParts = key.split('.');
  let nextKey = keyParts.shift();

  if (nextKey in object) {
    /*
     * If there are no more keys to test we have reached
     * the end of the path and the key is present
    */
    if (keyParts.length === 0) {
      return true;
    }

    /*
     * If the next part of the object to test is not
     * an object then don't go any further
    */
    if (!isObject(object[nextKey])) {
      return false;
    }

    return hasOwnNestedProperty(object[nextKey], keyParts.join('.'));
  } else {
    return false;
  }
}
