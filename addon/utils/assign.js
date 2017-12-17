import { assign as EmberAssign } from '@ember/polyfills';
import { merge } from '@ember/polyfills'

const assign = EmberAssign || Object.assign || _assign;

function _assign(origin, ...sources) {
  return sources.reduce((acc, source) => merge(acc, source), merge({}, origin));
}

export default function pureAssign() {
  return assign({}, ...arguments);
}
