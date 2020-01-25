import isObject from './is-object';
import Err from '../-private/err';
import {
  PublicErrors
} from 'ember-changeset/types';

let keysUpToValue: string[] = [];

/**
 * traverse through target and return leaf nodes with `value` property and key as 'person.name'
 *
 * @method getKeyValues
 * @return {Array} [{ 'person.name': value }]
 */
export function getKeyValues<T extends Record<string, any>>(obj: T): Record<string, any>[] {
  let map = [];

  for (let key in obj) {
    keysUpToValue.push(key);

    if (obj[key] && isObject(obj[key])) {
      if (Object.prototype.hasOwnProperty.call(obj[key], 'value')) {
        map.push({ key: keysUpToValue.join('.'), value: obj[key].value });
        // stop collecting keys
        keysUpToValue = [];
      } else if (key !== 'value') {
        map.push(...getKeyValues(obj[key]));
      }
    }
  }

  keysUpToValue = [];
  return map;
}

let errorKeysUpToValue: string[] = [];

/**
 * traverse through target and return leaf nodes with `value` property and key as 'person.name'
 *
 * @method getKeyErrorValues
 * @return {Array} [{ key: 'person.name', validation: '', value: '' }]
 */
export function getKeyErrorValues<T extends Record<string, any>>(obj: T): PublicErrors {
  let map = [];

  for (let key in obj) {
    errorKeysUpToValue.push(key);

    if (obj[key] && isObject(obj[key])) {
      if (Object.prototype.hasOwnProperty.call(obj[key], 'value') && obj[key] as any instanceof Err) {
        map.push({ key: errorKeysUpToValue.join('.'), validation: obj[key].validation, value: obj[key].value });
        // stop collecting keys
        errorKeysUpToValue = [];
      } else if (key !== 'value') {
        map.push(...getKeyErrorValues(obj[key]));
      }
    }
  }

  errorKeysUpToValue = [];
  return map;
}
