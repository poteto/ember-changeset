import Ember from 'ember';
import Relay from 'ember-changeset/-private/relay';
import objectToArray from 'ember-changeset/utils/computed/object-to-array';
import isEmptyObject from 'ember-changeset/utils/computed/is-empty-object';
import isPromise from 'ember-changeset/utils/is-promise';
import isObject from 'ember-changeset/utils/is-object';
import leafKeys from 'ember-changeset/utils/leaf-keys';
import pureAssign from 'ember-changeset/utils/assign';
import objectWithout from 'ember-changeset/utils/object-without';
import includes from 'ember-changeset/utils/includes';
import take from 'ember-changeset/utils/take';
import isChangeset, { CHANGESET } from 'ember-changeset/utils/is-changeset';
import hasOwnNestedProperty from 'ember-changeset/utils/has-own-nested-property';
import Err from 'ember-changeset/-private/err';
import Change from 'ember-changeset/-private/change';
import deepSet from 'ember-deep-set';

const {
  Object: EmberObject,
  RSVP: { all, resolve },
  computed: { not, readOnly },
  Evented,
  A: emberArray,
  assert,
  get,
  isArray,
  isEmpty,
  isEqual,
  isNone,
  isPresent,
  set,
  setProperties,
  typeOf
} = Ember;
const { keys } = Object;
const CONTENT = '_content';
const CHANGES = '_changes';
const ERRORS = '_errors';
const VALIDATOR = '_validator';
const RELAY_CACHE = '_relayCache';
const OPTIONS = '_options';
const RUNNING_VALIDATIONS = '_runningValidations';
const BEFORE_VALIDATION_EVENT = 'beforeValidation';
const AFTER_VALIDATION_EVENT = 'afterValidation';

function defaultValidatorFn() {
  return true;
}

const defaultOptions = { skipValidate: false };

/**
 * Creates new changesets.
 *
 * @uses Ember.Evented
 * @param  {Object} obj
 * @param  {Function} validateFn
 * @param  {Object} validationMap
 * @param  {Object}  options
 * @return {Ember.Object}
 */
export function changeset(obj, validateFn = defaultValidatorFn, validationMap = {}, options = {}) {
  assert('Underlying object for changeset is missing', isPresent(obj));

  return EmberObject.extend(Evented, {
    /**
     * Internal descriptor for changeset identification
     *
     * @private
     * @property __changeset__
     * @type {String}
     */
    __changeset__: CHANGESET,

    changes: objectToArray(CHANGES, false),
    errors: objectToArray(ERRORS, true),
    change: readOnly(CHANGES),
    error: readOnly(ERRORS),

    isValid: isEmptyObject(ERRORS),
    isPristine: isEmptyObject(CHANGES),
    isInvalid: not('isValid').readOnly(),
    isDirty: not('isPristine').readOnly(),

    init() {
      this._super(...arguments);
      this[CONTENT] = obj;
      this[CHANGES] = {};
      this[ERRORS] = {};
      this[RELAY_CACHE] = {};
      this[VALIDATOR] = validateFn;
      this[OPTIONS] = pureAssign(defaultOptions, options);
      this[RUNNING_VALIDATIONS] = {};
    },

    /**
     * Proxies `get` to the underlying content or changed value, if present.
     *
     * @public
     * @param  {String} key
     * @return {Any}
     */
    unknownProperty(key) {
      return this._valueFor(key);
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
      let changesetOptions = get(this, OPTIONS);
      let skipValidate = get(changesetOptions, 'skipValidate');

      if (skipValidate) {
        return this._setProperty(true, { key, value });
      }

      return this._validateAndSet(key, value);
    },

    /**
     * String representation for the changeset.
     *
     * @public
     * @return {String}
     */
    toString() {
      let normalisedContent = pureAssign(get(this, CONTENT), {});
      return `changeset:${normalisedContent.toString()}`;
    },

    /**
     * Teardown relays from cache.
     *
     * @public
     * @return {Void}
     */
    willDestroy() {
      let relayCache = get(this, RELAY_CACHE);
      for (let key in relayCache) {
        relayCache[key].destroy();
      }
    },

    /**
     * Provides a function to run before emitting changes to the model. The
     * callback function must return a hash in the same shape:
     *
     * ```
     * changeset
     *   .prepare((changes) => {
     *     let modified = {};
     *
     *     for (let key in changes) {
     *       modified[underscore(key)] = changes[key];
     *     }
     *
     *    return modified; // { first_name: "Jim", last_name: "Bob" }
     *  })
     *  .execute(); // execute the changes
     * ```
     *
     * @public
     * @chainable
     * @param  {Function} prepareChangesFn
     * @return {Changeset}
     */
    prepare(prepareChangesFn) {
      let changes = pureAssign(get(this, CHANGES));
      let preparedChanges = prepareChangesFn(changes);

      assert('Callback to `changeset.prepare` must return an object', isObject(preparedChanges));

      set(this, CHANGES, preparedChanges);

      return this;
    },

    /**
     * Executes the changeset if in a valid state.
     *
     * @public
     * @chainable
     * @return {Changeset}
     */
    execute() {
      if (get(this, 'isValid') && get(this, 'isDirty')) {
        let content = get(this, CONTENT);
        let changes = get(this, CHANGES);

        let changedKeys = leafKeys(changes);
        let resetProperties = {};

        changedKeys.forEach(function(key) {
          let [root] = key.split('.');
          if (!resetProperties[root]) {
            resetProperties[root] = get(content, root);
          }
        });

        setProperties(content, changes);

        leafKeys(resetProperties).forEach(function(key) {
          if (!changedKeys.includes(key)) {
            deepSet(content, key, get(resetProperties, key));
          }
        });
      }
      return this;
    },

    /**
     * Executes the changeset and saves the underlying content.
     *
     * @async
     * @public
     * @param  {Object} options optional object to pass to content save method
     * @return {Promise}
     */
    save(options) {
      let content = get(this, CONTENT);
      let savePromise = resolve(this);

      this.execute();

      if (typeOf(content.save) === 'function') {
        savePromise = content.save(options);
      }

      return resolve(savePromise).then((result) => {
        this.rollback();
        return result;
      });
    },

    /**
     * Returns the changeset to its pristine state, and discards changes and
     * errors.
     *
     * @public
     * @chainable
     * @return {Changeset}
     */
    rollback() {
      let relayCache = get(this, RELAY_CACHE);

      for (let key in relayCache) {
        relayCache[key].rollback();
      }

      // Get keys before resetting
      let keys = this._rollbackKeys();

      set(this, RELAY_CACHE, {});
      set(this, CHANGES, {});
      set(this, ERRORS, {});
      this._notifyVirtualProperties(keys)

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
     * @chainable
     * @param  {Changeset} changeset
     * @return {Changeset}
     */
    merge(changeset) {
      let content = get(this, CONTENT);
      assert('Cannot merge with a non-changeset', isChangeset(changeset));
      assert('Cannot merge with a changeset of different content', get(changeset, CONTENT) === content);

      if (get(this, 'isPristine') && get(changeset, 'isPristine')) {
        return this;
      }

      let changesA = get(this, CHANGES);
      let changesB = get(changeset, CHANGES);
      let errorsA = get(this, ERRORS);
      let errorsB = get(changeset, ERRORS);
      let relayA = get(this, RELAY_CACHE);
      let relayB = get(changeset, RELAY_CACHE);
      let newChangeset = new Changeset(content, get(this, VALIDATOR));
      let newErrors = objectWithout(keys(changesB), errorsA);
      let newChanges = objectWithout(keys(errorsB), changesA);
      let mergedChanges = pureAssign(newChanges, changesB);
      let mergedErrors = pureAssign(newErrors, errorsB);
      let mergedRelays = pureAssign(relayA, relayB);

      newChangeset[CHANGES] = mergedChanges;
      newChangeset[ERRORS] = mergedErrors;
      newChangeset[RELAY_CACHE] = mergedRelays;
      newChangeset._notifyVirtualProperties();

      return newChangeset;
    },

    /**
     * Validates the changeset immediately against the validationMap passed in.
     * If no key is passed into this method, it will validate all fields on the
     * validationMap and set errors accordingly. Will throw an error if no
     * validationMap is present.
     *
     * @async
     * @public
     * @param  {String|Undefined} key
     * @return {Promise}
     */
    validate(key) {
      if (keys(validationMap).length === 0) {
        return resolve(null);
      }

      if (isNone(key)) {
        let maybePromise = keys(validationMap)
          .map((validationKey) => {
            return this._validateAndSet(validationKey, this._valueFor(validationKey, true));
          });

        return all(maybePromise);
      }

      return resolve(this._validateAndSet(key, this._valueFor(key)));
    },

    /**
     * Checks to see if async validator for a given key has not resolved.
     * If no key is provided it will check to see if any async validator is running.
     *
     * @public
     * @param  {String|Undefined} key
     * @return {boolean}
     */
    isValidating(key) {
      let runningValidations = get(this, RUNNING_VALIDATIONS);
      let ks = emberArray(keys(runningValidations));
      if (key) { return ks.includes(key); }

      return !isEmpty(ks);
    },


    /**
     * Manually add an error to the changeset. If there is an existing error or
     * change for `key`, it will be overwritten.
     *
     * @public
     * @param {String} key
     * @param {Any} options.value
     * @param {Any} options.validation Validation message
     * @return {Any}
     */
    addError(key, options) {
      let errors = get(this, ERRORS);
      if (!isObject(options)) {
        let value = get(this, key);
        options = { value, validation: options };
      }

      this._deleteKey(CHANGES, key);
      this.notifyPropertyChange(ERRORS);
      this.notifyPropertyChange(key);

      return deepSet(errors, key, options);
    },

    /**
     * Manually push multiple errors to the changeset as an array. If there is
     * an existing error or change for `key`. it will be overwritten.
     *
     * @param  {String} key
     * @param  {...[String]} newErrors
     * @return {Any}
     */
    pushErrors(key, ...newErrors) {
      let errors = get(this, ERRORS);
      let existingError = get(errors, key) || { validation: [] };
      let { validation } = existingError;
      let value = get(this, key);

      if (!isArray(validation) && isPresent(validation)) {
        existingError.validation = [existingError.validation];
      }

      validation = [...existingError.validation, ...newErrors];

      this._deleteKey(CHANGES, key);
      this.notifyPropertyChange(ERRORS);
      this.notifyPropertyChange(key);

      return set(errors, key, { value, validation });
    },

    /**
     * Creates a snapshot of the changeset's errors and changes.
     *
     * @public
     * @return {Object} snapshot
     */
    snapshot() {
      return {
        changes: pureAssign(get(this, CHANGES)),
        errors: pureAssign(get(this, ERRORS))
      };
    },

    /**
     * Restores a snapshot of changes and errors. This overrides existing
     * changes and errors.
     *
     * @public
     * @chainable
     * @param  {Object} options.changes
     * @param  {Object} options.errors
     * @return {Changeset}
     */
    restore({ changes, errors }) {
      set(this, CHANGES, changes);
      set(this, ERRORS, errors);
      this._notifyVirtualProperties();

      return this;
    },

    /**
     * Unlike `Ecto.Changeset.cast`, `cast` will take allowed keys and
     * remove unwanted keys off of the changeset. For example, this method
     * can be used to only allow specified changes through prior to saving.
     *
     * @public
     * @chainable
     * @param  {Array} allowed Array of allowed keys
     * @return {Changeset}
     */
    cast(allowed = []) {
      let changes = get(this, CHANGES);

      if (isArray(allowed) && allowed.length === 0) {
        return changes;
      }

      let changeKeys = keys(changes);
      let validKeys = emberArray(changeKeys).filter((key) => includes(allowed, key));
      let casted = take(changes, validKeys);

      set(this, CHANGES, casted);

      return this;
    },

    /**
     * For a given key and value, set error or change.
     *
     * @private
     * @param  {String} key
     * @param  {Any} value
     * @return {Any}
     */
    _validateAndSet(key, value) {
      let content = get(this, CONTENT);
      let oldValue = get(content, key);
      let validation = this._validate(key, value, oldValue);

      if (isPromise(validation)) {
        this._setIsValidating(key, true);
        this.trigger(BEFORE_VALIDATION_EVENT, key);
        return validation.then((resolvedValidation) => {
          this._setIsValidating(key, false);
          this.trigger(AFTER_VALIDATION_EVENT, key);
          return this._setProperty(resolvedValidation, { key, value, oldValue });
        });
      }

      this.trigger(BEFORE_VALIDATION_EVENT, key);
      this.trigger(AFTER_VALIDATION_EVENT, key);
      return this._setProperty(validation, { key, value, oldValue });
    },

    /**
     * Validates a given key and value.
     *
     * @private
     * @param {String} key
     * @param {Any} newValue
     * @param {Any} oldValue
     * @return {Boolean|String|Promise}
     */
    _validate(key, newValue, oldValue) {
      let changes = get(this, CHANGES);
      let validator = get(this, VALIDATOR);
      let content = get(this, CONTENT);

      if (typeOf(validator) === 'function') {
        let isValid = validator({
          key,
          newValue,
          oldValue,
          changes: pureAssign(changes),
          content,
        });

        return isPresent(isValid) ? isValid : true;
      }

      return true;
    },

    /**
     * Sets property or error on the changeset.
     *
     * @private
     * @param {Boolean|Array|String} validation
     * @param {String} options.key
     * @param {Any} options.value
     * @return {Any}
     */
    _setProperty(validation, { key, value, oldValue } = {}) {
      let changes = get(this, CHANGES);
      let isSingleValidationArray =
        isArray(validation) &&
        validation.length === 1 &&
        validation[0] === true;
      let [root] = key.split('.');

      if (validation === true || isSingleValidationArray) {
        this._deleteKey(ERRORS, key);

        if (!isEqual(oldValue, value)) {
          deepSet(changes, key, value);
        } else if (hasOwnNestedProperty(changes, key)) {
          this._deleteKey(CHANGES, key);
        }
        this.notifyPropertyChange(CHANGES);
        this.notifyPropertyChange(root);

        let errors = get(this, ERRORS);
        if (errors['__ember_meta__'] && errors['__ember_meta__']['values']) {
          let path = key.split('.');
          if (path.length === 1) {
            delete errors['__ember_meta__']['values'][key];
          } else {
            let branch = path.slice(0, -1).join('.');
            let [leaf] = path.slice(-1);
            let obj = get(errors, branch);
            if (obj) delete obj['__ember_meta__']['values'][leaf];
          }
          set(this, ERRORS, errors);
        }

        return value;
      }

      return this.addError(key, { value, validation });
    },

    /**
     * Updates the cache that stores the number of running validations
     * for a given key.
     *
     * @private
     * @param {String} key
     * @param {Boolean} value
     */
    _setIsValidating(key, value) {
      let runningValidations = get(this, RUNNING_VALIDATIONS);
      let count = get(runningValidations, key) || 0;

      if (value) {
        set(runningValidations, key, count + 1);
      } else {
        if (count === 1) {
          delete runningValidations[key];
        } else {
          set(runningValidations, key, count - 1);
        }
      }
    },

    /**
     * Value for change or the original value.
     *
     * @private
     * @param {String} key
     * @param {Boolean} [plainValue=false]
     * @return {Error|Change|Relay|Any}
     */
    _valueFor(key, plainValue = false) {
      let changes = get(this, CHANGES);
      let errors = get(this, ERRORS);
      let content = get(this, CONTENT);

      // If `errors` has a nested property at `key` that is an `Err`,
      if (hasOwnNestedProperty(errors, key, Err)) {
        // Return the value of that `Err`.
        return get(errors, `${key}.value`);
      }

      // If `changes` has a nested property at `key` that is a `Change`,
      if (hasOwnNestedProperty(changes, key, Change)) {
        // Return the value of that `Change`.
        return get(changes, `${key}.value`);
      }

      let original = get(content, key);

      if (isObject(original) && !plainValue) {
        return this._relayFor(key, original);
      }

      return original;
    },

    /**
     * Setup a small changeset relay for sub objects.
     *
     * @private
     * @param {String} key
     * @param {Any} value
     * @param {Boolean} [shouldInvalidate=false]
     * @return {Any}
     */
    _relayFor(key, value, shouldInvalidate = false) {
      let cache = get(this, RELAY_CACHE);
      let found = cache[key];

      if (shouldInvalidate) {
        found && found.destroy();
        delete cache[key];
      }

      if (isPresent(found)) {
        return found;
      }

      let relay = Relay.create({ key, changeset: this, content: value });
      cache[key] = relay;
      return relay;
    },

    /**
     * Notifies virtual properties set on the changeset of a change.
     * You can specify which keys are notified by passing in an array.
     *
     * @private
     * @param {Array} keys
     * @return {Void}
     */
    _notifyVirtualProperties(keys = this._rollbackKeys()) {
      for (let i = 0; i < keys.length; i++) {
        this.notifyPropertyChange(keys[i]);
      }
    },

    /**
     * Gets the changes and error keys.
     *
     * @private
     * @return {Array}
     */
    _rollbackKeys() {
      return [
        ...keys(get(this, CHANGES)),
        ...keys(get(this, ERRORS))
      ];
    },

    /**
     * Deletes a key off an object and notifies observers.
     *
     * @private
     * @param  {String} objName
     * @param  {String} key
     * @return {Void}
     */
    _deleteKey(objName, key = '') {
      let obj = get(this, objName);

      if (isNone(obj)) {
        return;
      }

      let keyPath = key.split('.');
      let isNestedKey = keyPath.length > 1;

      if (isNestedKey) {
        let path = keyPath.slice(0, -1).join('.');
        let [leaf] = keyPath.slice(-1);
        let branch = get(obj, path);
        branch && delete branch[leaf];
      } else if (obj.hasOwnProperty(key)) {
        delete obj[key];
      }

      this.notifyPropertyChange(`${objName}.${key}`);
      this.notifyPropertyChange(objName);
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
