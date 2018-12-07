import { merge, assign as EmberAssign } from '@ember/polyfills';

const assign = EmberAssign || Object.assign || _assign;

function _assign(origin: object, ...sources: object[]): object {
  return sources.reduce((acc: object, source: object) => merge(acc, source), merge({}, origin));
}

export default function pureAssign(...objects: object[]): Object {
  return assign({}, ...objects);
}
