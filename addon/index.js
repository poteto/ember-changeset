import Ember from 'ember';
import objectToArray from 'ember-changeset/utils/object-to-array';
import isPromise from 'ember-changeset/utils/is-promise';
import { CHANGESET, isChangeset } from 'ember-changeset/-private/internals';

const {
  Object: EmberObject,
  computed: { not, readOnly },
  assert,
  computed,
  get,
  isArray,
  isPresent,
  merge,
  set,
  setProperties,
  typeOf
} = Ember;
const assign = Ember.assign || Object.assign || _assign;
const { keys } = Object;
const CONTENT = '_content';
const CHANGES = '_changes';
const ERRORS = '_errors';
const VALIDATOR = '_validator';
const hasOwnProp = Object.prototype.hasOwnProperty;

function _assign(origin, ...sources) {
  return sources.reduce((acc, source) => merge(acc, source), merge({}, origin));
}

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
    __changeset__: CHANGESET,
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
      this[CONTENT] = content || null;
      this[CHANGES] = {};
      this[ERRORS] = {};
      this[VALIDATOR] = validate;
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
      let content = get(this, CONTENT);
      let oldValue = get(content, key);
      let validation = this._validate(key, value, oldValue);

      if (hasOwnProp.call(content, key) && value === oldValue) {
        return;
      }

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
     * Merges 2 valid changesets and returns a new changeset. Both changesets
     * must point to the same underlying object. The changeset target is the
     * origin. For example:
     *
     * ```
     * let changesetA = new Changeset(user, validatorFn);
     * let changesetB = new Changeset(user, validatorFn);
     * changesetA.set('firstName', 'Jim');
     * changesetB.set('firstName', 'Jimmy');
     * changesetB.set('lastName', 'Fallon');
     * let changesetC = changesetA.merge(changesetB);
     * changesetC.execute();
     * user.get('firstName'); // "Jimmy"
     * user.get('lastName'); // "Fallon"
     * ```
     *
     * @public
     * @param  {Changeset} changeset
     * @return {Changeset}
     */
    merge(changeset) {
      let content = get(this, CONTENT);
      assert('Cannot merge with a non-changeset', isChangeset(changeset));
      assert('Cannot merge with a changeset of different content', get(changeset, CONTENT) === content);
      assert('Cannot merge invalid changesets', get(this, 'isValid') && get(changeset, 'isValid'));

      if (get(this, 'isPristine') && get(changeset, 'isPristine')) {
        return this;
      }

      let changesA = get(this, CHANGES);
      let changesB = get(changeset, CHANGES);
      let mergedChanges = assign({}, changesA, changesB);
      let newChangeset = new Changeset(content, get(this, VALIDATOR));
      newChangeset[CHANGES] = mergedChanges;
      newChangeset.notifyPropertyChange(CHANGES);

      return newChangeset;
    },

    /**
     * Validates a given key and value.
     *
     * @private
     * @param {String} key
     * @param {Any} newValue
     * @param {Any} oldValue
     * @return {Boolean|String}
     */
    _validate(key, newValue, oldValue) {
      let validator = get(this, VALIDATOR);
      if (typeOf(validator) === 'function') {
        let isValid = validator(key, newValue, oldValue);
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
