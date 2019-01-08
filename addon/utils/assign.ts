import { assign } from '@ember/polyfills';

export default function pureAssign(...objects: object[]): object {
  return assign({}, ...objects);
}
