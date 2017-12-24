// @flow

import { get } from '@ember/object';
import { isPresent } from '@ember/utils';

export const RELAY = '__RELAY__';

export default function isRelay(relay /*: Object */) /*: boolean */ {
  if (!isPresent(relay)) return false;
  return get(relay, '__relay__') === RELAY;
}
