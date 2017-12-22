// @flow

import ObjectProxy from '@ember/object/proxy';
import { get } from '@ember/object';
import { assert } from '@ember/debug';
import { isPresent } from '@ember/utils';

/*::
import type { ChangesetDef } from 'ember-changeset';
*/

/*::
export type RelayDef = {|
  changeset: ChangesetDef | null,
  key: string,
  content: Object | null,
  _changedKeys: Object,

  _super: () => void,
  init: () => void,
  unknownProperty: (string) => mixed,
  setUnknownProperty: (string, mixed) => mixed,
  rollback: () => void,
  destroy: () => void,
  notifyPropertyChange: (string) => void,
  isEqual: (RelayDef) => boolean,
|};
*/

/**
 * A Relay delegates property accesses to its changeset. The property
 * may optionally be prefixed by `key`.
 *
 * This is done as a workaround for Ember's `unknownProperty` behavior.
 * Given the key "foo.bar.baz", Ember breaks the key into "foo", "bar",
 * and "baz", then feeds each string into `unknownProperty`. However, we
 * need the entire key "foo.bar.baz" in order to look up the change on
 * the changeset. A Relay will hold the key "foo.bar", and let us look
 * up "foo.bar.baz" on the changeset when "baz" is requested.
 */
export default ObjectProxy.extend(({
  /*::
  _super() {},
  notifyPropertyChange() {},
  _changedKeys: {},
  */

  changeset: null,
  key: '',
  content: null,

  init() {
    let r /*: RelayDef */ = this;
    r._super(...arguments);
    r._changedKeys = {};
    assert('changeset must be present.', isPresent(get(this, 'changeset')));
    assert('content must be present.', isPresent(get(this, 'content')));
    assert('key must be present.', isPresent(get(this, 'key')));
  },

  unknownProperty(key) {
    let r /*: RelayDef */ = this;
    if (!r.changeset) throw new Error('Relay has no changeset.');
    return r.changeset._valueFor(`${r.key}.${key}`);
  },

  setUnknownProperty(key, value) {
    let r /*: RelayDef */ = this;
    r._changedKeys[key] = null;
    if (!r.changeset) throw new Error('Relay has no changeset.');
    r.changeset._validateAndSet(`${r.key}.${key}`, value);
    r.notifyPropertyChange(key);
    return value;
  },

  rollback() {
    let r /*: RelayDef */ = this;
    r._super(...arguments);
    for (let k of Object.keys(r._changedKeys)) r.notifyPropertyChange(k);
    r._changedKeys = {};
  },

  destroy() {
    let r /*: RelayDef */ = this;
    r._super(...arguments);
    r.changeset = null;
    r.content = null;
  },

  isEqual(other) {
    let r /*: RelayDef */ = this;
    let original = get(r, 'content');
    return r === other || original === other;
  },
} /*: RelayDef */));
