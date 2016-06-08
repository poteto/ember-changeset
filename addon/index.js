import Ember from 'ember';
import objectToArray from 'ember-changeset/utils/object-to-array';

const {
  Object: EmberObject,
  computed: { not, readOnly },
  computed,
  assert,
  get,
  isPresent,
  isArray,
  setProperties,
  set,
  typeOf
} = Ember;
const { keys } = Object;

export function changeset(content, validate) {
  assert('Invalid model for changeset', content);

  return EmberObject.extend({
    changes: objectToArray('_changes'),
    errors: objectToArray('_errors'),
    error: readOnly('_errors'),

    isInvalid: not('isValid'),
    isValid: computed('_errors', function() {
      return keys(get(this, '_errors')).length === 0;
    }),

    init() {
      this._content = content || null;
      this._changes = {};
      this._errors = {};
    },

    unknownProperty(key) {
      let content = get(this, '_content');
      return get(content, key);
    },

    setUnknownProperty(key, value) {
      let changes = get(this, '_changes');
      let errors = get(this, '_errors');
      let validation = this._validate(key, value);

      if (validation === true || isArray(validation) && validation[0] === true) {
        if (isPresent(get(errors, key))) {
          delete errors[key];
          this.notifyPropertyChange(`_errors.${key}`);
          this.notifyPropertyChange('_errors');
        }

        this.notifyPropertyChange('_changes');
        return set(changes, key, value);
      } else {
        this.notifyPropertyChange('_errors');
        return set(errors, key, { value, validation });
      }
    },

    toString() {
      return `changeset:${get(this, '_content').toString()}`;
    },

    execute() {
      if (get(this, 'isValid')) {
        setProperties(this._content, get(this, '_changes'));
      }
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
      let changeKeys = keys(this._changes);
      for (let i = 0; i < changeKeys.length; i++) {
        this.notifyPropertyChange(changeKeys[i]);
      }

      set(this, '_changes', {});
      set(this, '_errors', {});
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
