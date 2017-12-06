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
    if (isObject(object[nextKey]) && keyParts.length) {
      return hasOwnNestedProperty(object[nextKey], keyParts.join('.'));
    } else {
      return true;
    }
  } else {
    return false;
  }
}
