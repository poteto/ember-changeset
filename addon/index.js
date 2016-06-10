import Ember from 'ember';
import objectToArray from 'ember-changeset/utils/object-to-array';
import isPromise from 'ember-changeset/utils/is-promise';

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
const CONTENT = '_content';
const CHANGES = '_changes';
const ERRORS = '_errors';

/**
 * Changeset factory
 *
 * @param  {Object} content
 * @param  {Function} validate
 * @return {Ember.Object}
 */
export function changeset(content, validate) {
  assert('Invalid model for changeset', content);

  return EmberObject.extend({
    changes: objectToArray(CHANGES),
    errors: objectToArray(ERRORS),
    error: readOnly(ERRORS),

    isInvalid: not('isValid').readOnly(),
    isPristine: not('isDirty').readOnly(),

    isValid: computed(ERRORS, function() {
      return keys(get(this, ERRORS)).length === 0;
    }).readOnly(),

    isDirty: computed(CHANGES, function() {
      return keys(get(this, CHANGES)).length !== 0;
    }).readOnly(),

    init() {
      this._super(...arguments);
      this._content = content || null;
      this._changes = {};
      this._errors = {};
    },

    /**
     * Proxies `get` to the underlying content.
     *
     * @public
     * @param  {String} key
     * @return {Any}
     */
    unknownProperty(key) {
      let content = get(this, CONTENT);
      return get(content, key);
    },

    /**
     * Stores change on the changeset.
     *
     * @public
     * @param  {String} key
     * @param  {Any} value
     * @return {Any}
     */
    setUnknownProperty(key, value) {
      let changes = get(this, CHANGES);
      let errors = get(this, ERRORS);
      let validation = this._validate(key, value);

      if (isPromise(validation)) {
        return validation.then((resolvedValidation) => {
          return this._setProperty(changes, errors, resolvedValidation, { key, value });
        });
      }

      return this._setProperty(changes, errors, validation, { key, value });
    },

    /**
     * String representation for the changeset.
     *
     * @public
     * @return {String}
     */
    toString() {
      return `changeset:${get(this, CONTENT).toString()}`;
    },

    /**
     * Executes the changeset if in a valid state.
     *
     * @public
     * @return {Changeset}
     */
    execute() {
      if (get(this, 'isValid') && get(this, 'isDirty')) {
        let content = get(this, CONTENT);
        let changes = get(this, CHANGES);
        setProperties(content, changes);
      }

      return this;
    },

    /**
     * Executes the changeset and saves the underlying content.
     *
     * @public
     * @return {Promise}
     */
    save() {
      let content = get(this, CONTENT);

      if (typeOf(content.save) === 'function') {
        this.execute();

        return content
          .save()
          .then(() => this.rollback());
      }
    },

    /**
     * Returns the changeset to its pristine state, and discards changes.
     *
     * @public
     * @return {Changeset}
     */
    rollback() {
      // notify virtual properties
      let changeKeys = keys(get(this, CHANGES));

      for (let i = 0; i < changeKeys.length; i++) {
        this.notifyPropertyChange(changeKeys[i]);
      }

      set(this, CHANGES, {});
      set(this, ERRORS, {});

      return this;
    },

    /**
     * Validates a given key and value.
     *
     * @private
     * @param {String} key
     * @param {Any} newValue
     * @return {Boolean|String}
     */
    _validate(key, newValue) {
      let oldValue = get(this, `${CONTENT}.${key}`);

      if (typeOf(validate) === 'function') {
        let isValid = validate(key, newValue, oldValue);
        return isPresent(isValid) ? isValid : true;
      }

      return true;
    },

    /**
     * Sets property or error on the changeset.
     *
     * @private
     * @param {Object} changes
     * @param {Object} errors
     * @param {Boolean|Array|String} validation
     * @param {String} options.key
     * @param {Any} options.value
     * @return {Any}
     */
    _setProperty(changes, errors, validation, { key, value } = {}) {
      if (validation === true || isArray(validation) && validation[0] === true) {
        if (isPresent(get(errors, key))) {
          delete errors[key];
          this.notifyPropertyChange(`${ERRORS}.${key}`);
          this.notifyPropertyChange(ERRORS);
        }

        this.notifyPropertyChange(CHANGES);

        return set(changes, key, value);
      } else {
        this.notifyPropertyChange(ERRORS);

        return set(errors, key, { value, validation });
      }
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
