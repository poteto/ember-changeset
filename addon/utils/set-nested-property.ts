import { assert, runInDebug } from '@ember/debug';
import setDeep from '../-private/set-deep';

const { keys } = Object;

/**
 * Set a property on an `obj` with keys
 *
 * This function deletes every key prefixed by `key` in `obj`, as well
 * as every key in the path leading up to `key`. Keeps keys that don't match.
 * Then sets original key on obj after aforementioned cleanup
 * example ```
    obj: {
      'foo': 'happy',
      'foo.bar': 'freakin',
      'foo.bar.baz': 'holidays',
    },
 * ```
 */
export default function setNestedProperty<T>(
  obj: { [key: string]: T },
  key: string,
  value: T
): { [key: string]: T } {
  let objKeys = keys(obj);

  // Ensure object keys are in correct format.
  runInDebug(() => {
    objKeys.forEach(k => {
      let parts = k.split('.');
      let condition = parts.length === parts.filter(Boolean).length;
      assert('Object must not have keys with empty parts.', condition);
    });
  });

  // // Delete keys in path leading up to `key`.
  // key.split('.').slice(0, -1).forEach((_, i, allParts) => {
  //   let key = allParts.slice(0, i+1).join('.');
  //   delete obj[key];
  // });

  // Set value and return.
  // obj[key] = value;
  // return obj;
  return setDeep(obj, key, value);
}
