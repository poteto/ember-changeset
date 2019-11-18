import isObject from '../utils/is-object';

// 'foo.bar.zaz'
let keysUpToValue: any[] = [];

/**
 * traverse through target and return leaf nodes with `value` property
 *
 * @method keyValues
 * @param target
 */
export default function keyValues<T extends { [key: string]: any}>(obj: T): object[] {
  let map = [];
  for (let key in obj) {
    keysUpToValue.push(key);

    if (obj[key] && isObject(obj[key])) {
      if (Object.prototype.hasOwnProperty.apply(obj[key], ['value'])) {
        map.push({ key: keysUpToValue.join('.'), value: obj[key].value });
        // stop collecting keys
        keysUpToValue = [];
      } else if (key !== 'value') {
        map.push(...keyValues(obj[key]));
      }
    }
  }

  return map;
}
