// @flow

import { assign } from '@ember/polyfills';

export default function pureAssign(...objects /*: Array<Object> */) /*: Object */ {
  return assign({}, ...objects);
}
