// @flow

import Ember from 'ember';

const {
  Object: EmberObject,
  get
} = Ember;

// TODO: Convert to ES6 class so Flow can check?
// http://offirgolan.github.io/ember-light-table/docs/files/addon_classes_Row.js.html
export const Relay = {
  changeset: null,
  key: null,
  content: null,

  init() {
    this._changedKeys = {};
  },

  unknownProperty(key /*: string */) {
    return this.changeset._valueFor(`${get(this, 'key')}.${key}`);
  },

  setUnknownProperty(key /*: string */, value /*: mixed */) {
    this._changedKeys[key] = null;
    this.changeset._validateAndSet(`${get(this, 'key')}.${key}`, value);
    this.notifyPropertyChange(key);
    return value;
  },

  rollback() {
    for (let key of Object.keys(this._changedKeys)) {
      this.notifyPropertyChange(key);
    }

    this._changedKeys = {};
  },

  destroy() {
    this._super(...arguments);
    this.changeset = null;
    this.content = null;
  }
};

/**
 * A Relay is a workaround for Ember's `unknownProperty` and
 * `setUnknownProperty` behavior. `unknownProperty` breaks a nested key into
 * its constituent parts, so we need to store those parts in an object that
 * isn't the changeset.
 *
 * Property accesses on a Relay object delegate to the changeset, optionally
 * prefixed by a key scope.
 *
 * TODO: Relay should extend ObjectProxy.
 */
export default EmberObject.extend(Relay);
