import isObject from './is-object';

/**
 * traverse through target and unset `value` from leaf key so can access normally
 * {
 *  name: Change {
 *    value: 'Charles'
 *  }
 * }
 *
 * to
 *
 * {
 *  name: 'Charles'
 * }
 *
 * Shallow copy here is fine because we are swapping out the leaf nested object
 * rather than mutating a property in something with reference
 *
 * @method normalizeObject
 * @param target
 */
export default function normalizeObject<T extends { [key: string]: any}>(target: T): T {
  if ('value' in target) {
    return target.value
  }

  let obj = { ...target };

  for (let key in obj) {
    if (key === 'value') {
      return obj[key];
    }

    if (obj[key] && isObject(obj[key])) {
      if (Object.prototype.hasOwnProperty.call(obj[key], 'value')) {
        obj[key] = obj[key].value;
      } else {
        obj[key] = normalizeObject(obj[key]);
      }
    }
  }

  return obj;
}
