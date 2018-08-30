// @flow

import { get } from '@ember/object';

export const RELAY = '__RELAY__';

export default function isRelay(relay /*: mixed */) /*: boolean */ {
  if (!relay) return false;
  return get(relay, '__relay__') === RELAY;
}
