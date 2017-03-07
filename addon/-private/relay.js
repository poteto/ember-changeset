import Ember from 'ember';

const {
  Object: EmberObject,
  get
} = Ember;

export default EmberObject.extend({
  changeset: null,
  key: null,

  unknownProperty(key) {
    return this.getValue(key);
  },

  setUnknownProperty(key, value) {
    this.setValue(key, value);
    return value;
  },

  getValue(key) {
    return this.changeset.valueFor(`${get(this, 'key')}.${key}`);
  },

  setValue(key, value) {
    return this.changeset.validateAndSet(`${get(this, 'key')}.${key}`, value);
  },

  destroy() {
    this._super(...arguments);
    this.changeset = null;
  }
});
