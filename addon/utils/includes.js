// @flow

import Ember from 'ember';

const { A: emberArray, assert, typeOf } = Ember;

export default function includes(
  arr /*: Array<mixed> */,
  ...args /*: Array<mixed> */
) {
  assert('must be array', typeOf(arr) === 'array');
  let wrapped = emberArray(arr);
  let inclusionFn = wrapped.includes || wrapped.contains;

  return inclusionFn.apply(arr, args);
}
