// @flow

import { typeOf } from '@ember/utils';

export default function isObject(val /*: mixed */) {
  return typeOf(val) === 'object' || typeOf(val) === 'instance';
}
