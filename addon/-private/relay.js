import Ember from 'ember';

const {
  Object: EmberObject,
  get
} = Ember;

export default EmberObject.extend({
  changeset: null,
  key: null,

  unknownProperty(key) {
    return this.changeset._valueFor(`${get(this, 'key')}.${key}`);
  },

  setUnknownProperty(key, value) {
    const selfKey = get(this, 'key');
    this.changeset._validateAndSet(`${selfKey}.${key}`, value);
    if (!/\./.test(selfKey)) {
      this.notifyPropertyChange(key);
    }
    return value;
  },

  destroy() {
    this._super(...arguments);
    this.changeset = null;
  }
});
