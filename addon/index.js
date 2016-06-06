import Ember from 'ember';

const {
  Object: EmberObject,
  computed: { readOnly },
  assert,
  get,
  isPresent,
  setProperties,
  set,
  typeOf
} = Ember;

export default function changeset(content, validate) {
  assert('Invalid model for changeset', content);

  return EmberObject.extend({
    changes: readOnly('_changes'),

    init() {
      this._content = content || null;
      this._changes = {};
    },

    unknownProperty(key) {
      let content = get(this, '_content');
      return get(content, key);
    },

    setUnknownProperty(key, value) {
      let changes = get(this, '_changes');

      if (this._validate(key, value)) {
        return set(changes, key, value);
      }
    },

    toString() {
      return `changeset:${get(this, '_content').toString()}`;
    },

    execute() {
      setProperties(this._content, get(this, '_changes'));
      return this;
    },

    save() {
      if (typeOf(this._content.save) === 'function') {
        return this._content
          .save()
          .then(() => { this.rollback(); });
      }
    },

    rollback() {
      // notify virtual properties
      let changeKeys = Object.keys(this._changes);
      for (let i = 0; i < changeKeys.length; i++) {
        this.notifyPropertyChange(changeKeys[i]);
      }

      set(this, '_changes', {});
      return this;
    },

    _validate(key, newValue) {
      let oldValue = get(this, `_content.${key}`);

      if (typeOf(validate) === 'function') {
        let isValid = validate(key, newValue, oldValue);
        return isPresent(isValid) ? isValid : true;
      }

      return true;
    }
  });
}

export default class Changeset {
  /**
   * Changeset factory
   *
   * @class Changeset
   * @constructor
   */
  constructor() {
    return changeset(...arguments).create();
  }
}
