import isObject from './is-object';
import Err from '../-private/err';

/**
 * traverse through target and return leaf nodes with `value` property and key as 'person.name'
 *
 * @method getKeyValues
 * @return {Array} [{ 'person.name': value }]
 */
export function getKeyValues<T extends Record<string, any>>(obj: T, keysUpToValue: string[] = []): object[] {
  let map = [];

  for (let key in obj) {
    keysUpToValue.push(key);

    if (obj[key] && isObject(obj[key])) {
      if (Object.prototype.hasOwnProperty.call(obj[key], 'value')) {
        map.push({ key: keysUpToValue.join('.'), value: obj[key].value });
        // stop collecting keys
        keysUpToValue = [];
      } else if (key !== 'value') {
        map.push(...getKeyValues(obj[key], keysUpToValue));
      }
    }
  }

  return map;
}

/**
 * traverse through target and return leaf nodes with `value` property and key as 'person.name'
 *
 * @method getKeyErrorValues
 * @return {Array} [{ key: 'person.name', validation: '', value: '' }]
 */
export function getKeyErrorValues<T extends Record<string, any>>(
  obj: T,
  keysUpToValue: string[] = []
): object[] {
  let map = [];

  for (let key in obj) {
    keysUpToValue.push(key);

    if (obj[key] && isObject(obj[key])) {
      if (Object.prototype.hasOwnProperty.call(obj[key], 'value') && obj[key] as any instanceof Err) {
        map.push({ key: keysUpToValue.join('.'), validation: obj[key].validation, value: obj[key].value });
        // stop collecting keys
        keysUpToValue = [];
      } else if (key !== 'value') {
        map.push(...getKeyErrorValues(obj[key], keysUpToValue));
      }
    }
  }

  return map;
}
