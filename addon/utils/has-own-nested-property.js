import isObject from './is-object';

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
