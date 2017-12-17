import { A as emberArray } from '@ember/array';
import { assert } from '@ember/debug';
import { typeOf } from '@ember/utils';

export default function includes(arr, ...args) {
  assert('must be array', typeOf(arr) === 'array');
  let wrapped = emberArray(arr);
  let inclusionFn = wrapped.includes || wrapped.contains;

  return inclusionFn.apply(arr, args);
}
