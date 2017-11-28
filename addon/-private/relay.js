import Ember from 'ember';

const {
  Object: EmberObject,
  get
} = Ember;

export default EmberObject.extend({
  changeset: null,
  key: null,

  init() {
    this._changedKeys = {};
  },

  unknownProperty(key) {
    return this.changeset._valueFor(`${get(this, 'key')}.${key}`);
  },

  setUnknownProperty(key, value) {
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
  }
});
