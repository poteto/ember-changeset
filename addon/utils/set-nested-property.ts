import { assert, runInDebug } from '@ember/debug';

const { keys } = Object;

/**
 * Set a property on an `obj`.
 *
 * This function deletes every key prefixed by `key` in `obj`, as well
 * as every key in the path leading up to `key`.
 */
export default function setNestedProperty<T>(
  obj: { [key: string]: T },
  key: string,
  value: T
): T {
  let objKeys = keys(obj);

  // Ensure object keys are in correct format.
  runInDebug(() => {
    objKeys.forEach(k => {
      let parts = k.split('.');
      let condition = parts.length === parts.filter(Boolean).length;
      assert('Object must not have keys with empty parts.', condition);
    });
  });

  // Delete keys prefixed by `key`.
  objKeys
    .filter(k => k.indexOf(`${key}.`) === 0)
    .forEach(k => delete obj[k]);

  // Delete keys in path leading up to `key`.
  key.split('.').slice(0, -1).forEach((_, i, allParts) => {
    let key = allParts.slice(0, i+1).join('.');
    delete obj[key];
  });

  // Set value and return.
  obj[key] = value;
  return value;
}
