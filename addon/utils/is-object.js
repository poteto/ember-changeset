// @flow

import Ember from 'ember';

const { typeOf } = Ember;

export default function isObject(val /*: mixed */) {
  return typeOf(val) === 'object' || typeOf(val) === 'instance';
}
