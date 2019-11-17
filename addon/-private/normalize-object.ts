import isObject from '../utils/is-object';

/**
 * traverse through target and unset `value` from leaf key
 *
 * @method normalizeObject
 * @param target
 */
export default function normalizeObject<T extends { [key: string]: any}>(target: T): T {
  let obj = JSON.parse(JSON.stringify(target));

  for (let key in obj) {
    if (obj[key] && isObject(obj[key])) {
      if (Object.prototype.hasOwnProperty.apply(obj[key], ['value'])) {
        obj[key] = obj[key].value;
      } else {
        normalizeObject(obj[key]);
      }
    }

    if (key === 'value') {
      return obj[key];
    }
  }

  return obj;
}
