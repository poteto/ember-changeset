import { A as emberArray } from '@ember/array';
import { assert } from '@ember/debug';
import { typeOf } from '@ember/utils';

export default function includes<T>(arr: T[], ...args: T[]): boolean {
  assert('must be array', typeOf(arr) === 'array');
  const wrapped = emberArray(arr);
  const inclusionFn = wrapped.includes || wrapped.contains;

  return inclusionFn.apply(arr, args);
}
