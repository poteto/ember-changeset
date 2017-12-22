// @flow

import Ember from 'ember';
import Relay from 'ember-changeset/-private/relay';
import objectToArray from 'ember-changeset/utils/computed/object-to-array';
import isEmptyObject from 'ember-changeset/utils/computed/is-empty-object';
import computedFacade from 'ember-changeset/utils/computed/facade';
import inflate from 'ember-changeset/utils/computed/inflate';
import isPromise from 'ember-changeset/utils/is-promise';
import isObject from 'ember-changeset/utils/is-object';
import pureAssign from 'ember-changeset/utils/assign';
import objectWithout from 'ember-changeset/utils/object-without';
import includes from 'ember-changeset/utils/includes';
import take from 'ember-changeset/utils/take';
import pairs from 'ember-changeset/utils/pairs';
import isChangeset, { CHANGESET } from 'ember-changeset/utils/is-changeset';
import hasOwnNestedProperty from 'ember-changeset/utils/has-own-nested-property';
import facade from 'ember-changeset/utils/facade';
import Err from 'ember-changeset/-private/err';
import Change from 'ember-changeset/-private/change';
import deepSet from 'ember-deep-set';

/*::
import type { ValidatorFunc } from 'ember-changeset/types/validator-func';
import type {
  ValidationResult,
  ValidationErr,
} from 'ember-changeset/types/validation-result';
import type { RelayDef } from 'ember-changeset/-private/relay';
import type { Config } from 'ember-changeset/types/config';
import type { ErrLike } from 'ember-changeset/-private/err';
*/

const {
  Object: EmberObject,
  RSVP: { all, resolve },
  computed: { not },
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
  typeOf,
  runInDebug
} = Ember;
const { keys } = Object;
const CONTENT = '_content';
const CHANGES = '_changes';
const ERRORS = '_errors';
const RELAY_CACHE = '_relayCache';
const VALIDATOR = '_validator';
const OPTIONS = '_options';
const RUNNING_VALIDATIONS = '_runningValidations';
const BEFORE_VALIDATION_EVENT = 'beforeValidation';
const AFTER_VALIDATION_EVENT = 'afterValidation';
const defaultValidatorFn = () => true;
const defaultOptions = { skipValidate: false };

/*::
type Changes            = { [string]: Change   };
type Errors             = { [string]: Err      };
type RelayCache         = { [string]: RelayDef };
type RunningValidations = { [string]: number   };

type InternalMap =
  | Changes
  | Errors
  | RelayCache
  | RunningValidations;

type NewProperty<T> = {
  key:       string,
  value:     T,
  oldValue?: mixed,
};

type InternalMapKey =
  | '_changes'
  | '_errors'
  | '_relayCache'
  | '_runningValidations';

export type ChangesetDef = {|
  _content: Object,
  _changes: Changes,
  _errors: Errors,
  _relayCache: RelayCache,
  _validator: ValidatorFunc,
  _options: Config,
  _runningValidations: RunningValidations,
  __changeset__: '__CHANGESET__',
  _inflatedChanges: { [string]: mixed },

  isValid: boolean,
  isPristine: boolean,
  isInvalid: boolean,
  isDirty: boolean,

  _super: () => void,
  init: () => void,
  unknownProperty: (string) => mixed,
  _valueFor: (string, ?boolean) => RelayDef | mixed,
  _relayFor: (string, Object) => RelayDef,
  toString: () => string,
  _deleteKey: (InternalMapKey, string) => void,
  notifyPropertyChange: (string) => void,
  addError: <T: ValidationErr | ErrLike<*>>(string, T) => T,
  _setProperty: <T>(ValidationResult, NewProperty<T>) => (T | ErrLike<T>),
  _validateAndSet: <T>(string, T) => (Promise<T> | Promise<ErrLike<T>> | T | ErrLike<T>),
  _setIsValidating: (string, boolean) => void,
  _validate: (string, mixed, mixed) => (ValidationResult | Promise<ValidationResult>),
  trigger: (string, string) => void,
  isValidating: (string | void) => boolean,
  cast: (Array<string>) => ChangesetDef,
|};
*/

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
export function changeset(
  obj /*: Object */,
  validateFn /*: ValidatorFunc */ = defaultValidatorFn,
  validationMap /*: { [string]: ValidatorFunc } */ = {},
  options /*: Config */ = {}
) {
  assert('Underlying object for changeset is missing', isPresent(obj));

  return EmberObject.extend(Evented, ({
    /**
     * Internal descriptor for changeset identification
     *
     * @private
     * @property __changeset__
     * @type {String}
     */
    __changeset__: CHANGESET,

    /*
    changes: objectToArray(CHANGES, false),
    errors: objectToArray(ERRORS, true),
    change: readOnly(CHANGES),
    error: readOnly(ERRORS),
    */

    isValid: isEmptyObject(ERRORS),
    isPristine: isEmptyObject(CHANGES),
    isInvalid: not('isValid').readOnly(),
    isDirty: not('isPristine').readOnly(),

    _inflatedChanges: inflate(CHANGES, c => c.value),

    /*::
    _super() {},
    notifyPropertyChange() {},
    _content: {},
    _changes: {},
    _errors: {},
    _relayCache: {},
    _validator: defaultValidatorFn,
    _options: defaultOptions,
    _runningValidations: {},
    trigger() {},
    */

    init() {
      let c /*: ChangesetDef */ = this;
      c._super(...arguments);
      c[CONTENT] = obj;
      c[CHANGES] = {};
      c[ERRORS] = {};
      c[RELAY_CACHE] = {};
      c[VALIDATOR] = validateFn;
      c[OPTIONS] = pureAssign(defaultOptions, options);
      c[RUNNING_VALIDATIONS] = {};
    },

    /**
     * Proxies `get` to the underlying content or changed value, if present.
     *
     * @public
     * @param  {String} key
     * @return {Any}
     */
    unknownProperty(key) {
      return (this /*: ChangesetDef */)._valueFor(key);
    },

    /**
     * Stores change on the changeset.
     *
     * @public
     * @param  {String} key
     * @param  {Any} value
     * @return {Any}
     */
    //setUnknownProperty(key, value) {
      /*
      let changesetOptions = get(this, OPTIONS);
      let skipValidate = get(changesetOptions, 'skipValidate');

      if (skipValidate) {
        return this._setProperty(true, { key, value });
      }

      return this._validateAndSet(key, value);
      */
    //},

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
    //willDestroy() {
      /*
      let relayCache = get(this, RELAY_CACHE);
      for (let key in relayCache) {
        relayCache[key].destroy();
      }
      */
    //},

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
    //prepare(prepareChangesFn) {
      /*
      let changes = pureAssign(get(this, CHANGES));
      changes = facade(changes, Change, ch => ch.value);
      let preparedChanges = prepareChangesFn(changes);
      assert('Callback to `changeset.prepare` must return an object', isObject(preparedChanges));
      preparedChanges = facade(preparedChanges, null, ch => new Change(ch));
      set(this, CHANGES, preparedChanges);
      return this;
      */
    //},

//     /**
//      * Executes the changeset if in a valid state.
//      *
//      * @public
//      * @chainable
//      * @return {Changeset}
//      */
//     execute() {
//       if (get(this, 'isValid') && get(this, 'isDirty')) {
//         let content = get(this, CONTENT);
//         let changes = get(this, CHANGES);
//         let changePairs = pairs(changes).filter(c => c.value instanceof Change);
//         changePairs.forEach(({ key, value: c }) => deepSet(content, key, c.value));
//       }
//
//       return this;
//     },
//
//     /**
//      * Executes the changeset and saves the underlying content.
//      *
//      * @async
//      * @public
//      * @param  {Object} options optional object to pass to content save method
//      * @return {Promise}
//      */
//     save(options) {
//       let content = get(this, CONTENT);
//       let savePromise = resolve(this);
//
//       this.execute();
//
//       if (typeOf(content.save) === 'function') {
//         savePromise = content.save(options);
//       }
//
//       return resolve(savePromise).then((result) => {
//         this.rollback();
//         return result;
//       });
//     },

//     /**
//      * Merges 2 valid changesets and returns a new changeset. Both changesets
//      * must point to the same underlying object. The changeset target is the
//      * origin. For example:
//      *
//      * ```
//      * let changesetA = new Changeset(user, validatorFn);
//      * let changesetB = new Changeset(user, validatorFn);
//      * changesetA.set('firstName', 'Jim');
//      * changesetB.set('firstName', 'Jimmy');
//      * changesetB.set('lastName', 'Fallon');
//      * let changesetC = changesetA.merge(changesetB);
//      * changesetC.execute();
//      * user.get('firstName'); // "Jimmy"
//      * user.get('lastName'); // "Fallon"
//      * ```
//      *
//      * @public
//      * @chainable
//      * @param  {Changeset} changeset
//      * @return {Changeset}
//      */
//     merge(changeset) {
//       let content = get(this, CONTENT);
//       assert('Cannot merge with a non-changeset', isChangeset(changeset));
//       assert('Cannot merge with a changeset of different content', get(changeset, CONTENT) === content);
//
//       if (get(this, 'isPristine') && get(changeset, 'isPristine')) {
//         return this;
//       }
//
//       let changesA = get(this, CHANGES);
//       let changesB = get(changeset, CHANGES);
//       let errorsA = get(this, ERRORS);
//       let errorsB = get(changeset, ERRORS);
//       let relayA = get(this, RELAY_CACHE);
//       let relayB = get(changeset, RELAY_CACHE);
//       let newChangeset = new Changeset(content, get(this, VALIDATOR));
//       let newErrors = objectWithout(keys(changesB), errorsA);
//       let newChanges = objectWithout(keys(errorsB), changesA);
//       let mergedChanges = pureAssign(newChanges, changesB);
//       let mergedErrors = pureAssign(newErrors, errorsB);
//       let mergedRelays = pureAssign(relayA, relayB);
//
//       newChangeset[CHANGES] = mergedChanges;
//       newChangeset[ERRORS] = mergedErrors;
//       newChangeset[RELAY_CACHE] = mergedRelays;
//       newChangeset._notifyVirtualProperties();
//
//       return newChangeset;
//     },

//     /**
//      * Returns the changeset to its pristine state, and discards changes and
//      * errors.
//      *
//      * @public
//      * @chainable
//      * @return {Changeset}
//      */
//     rollback() {
//       let relayCache = get(this, RELAY_CACHE);
//
//       for (let key in relayCache) {
//         relayCache[key].rollback();
//       }
//
//       // Get keys before resetting
//       let keys = this._rollbackKeys();
//
//       set(this, RELAY_CACHE, {});
//       set(this, CHANGES, {});
//       set(this, ERRORS, {});
//       this._notifyVirtualProperties(keys)
//
//       return this;
//     },
//
//     /**
//      * Validates the changeset immediately against the validationMap passed in.
//      * If no key is passed into this method, it will validate all fields on the
//      * validationMap and set errors accordingly. Will throw an error if no
//      * validationMap is present.
//      *
//      * @async
//      * @public
//      * @param  {String|Undefined} key
//      * @return {Promise}
//      */
//     validate(key) {
//       if (keys(validationMap).length === 0) {
//         return resolve(null);
//       }
//
//       if (isNone(key)) {
//         let maybePromise = keys(validationMap)
//           .map((validationKey) => {
//             return this._validateAndSet(validationKey, this._valueFor(validationKey, true));
//           });
//
//         return all(maybePromise);
//       }
//
//       return resolve(this._validateAndSet(key, this._valueFor(key)));
//     },

    /**
     * Manually add an error to the changeset. If there is an existing
     * error or change for `key`, it will be overwritten.
     */
    addError /*:: <T: ValidationErr | ErrLike<*>> */ (
      key   /*: string */,
      error /*: T      */
    ) /*: T */ {
      // Construct new `Err` instance.
      let newError /*: Err */;
      if (isObject(error)) {
        let errorLike /*: ErrLike<*> */ = (error /*: any */);
        assert('Error must have value.', isPresent(errorLike.value));
        assert('Error must have validation.', isPresent(errorLike.validation));
        newError = new Err(errorLike.value, errorLike.validation);
      } else {
        let validation /*: ValidationErr */ = (error /*: any */);
        newError = new Err(get(this, key), validation);
      }

      // Remove `key` from changes map.
      let c = (this /*: ChangesetDef */);
      c._deleteKey(CHANGES, key);

      // Add `key` to errors map.
      let errors /*: Errors */ = get(this, ERRORS);
      errors[key] = newError;
      c.notifyPropertyChange(ERRORS);

      // Notify that `key` has changed.
      c.notifyPropertyChange(key);

      // Return passed-in `error`.
      return error;
    },

//     /**
//      * Manually push multiple errors to the changeset as an array. If there is
//      * an existing error or change for `key`. it will be overwritten.
//      *
//      * @param  {String} key
//      * @param  {...[String]} newErrors
//      * @return {Any}
//      */
//     pushErrors(key, ...newErrors) {
//       let errors = get(this, ERRORS);
//       let existingError = get(errors, key) || { validation: [] };
//       let { validation } = existingError;
//       let value = get(this, key);
//
//       if (!isArray(validation) && isPresent(validation)) {
//         existingError.validation = [existingError.validation];
//       }
//
//       validation = [...existingError.validation, ...newErrors];
//
//       this._deleteKey(CHANGES, key);
//       this.notifyPropertyChange(ERRORS);
//       this.notifyPropertyChange(key);
//
//       return set(errors, key, { value, validation });
//     },
//
//     /**
//      * Creates a snapshot of the changeset's errors and changes.
//      *
//      * @public
//      * @return {Object} snapshot
//      */
//     snapshot() {
//       return {
//         changes: facade(get(this, CHANGES), Change, ch => ch.value),
//         errors: facade(get(this, ERRORS), Err, e => {
//           return { value: e.value, validation: e.validation }
//         })
//       };
//     },
//
//     /**
//      * Restores a snapshot of changes and errors. This overrides existing
//      * changes and errors.
//      *
//      * @public
//      * @chainable
//      * @param  {Object} options.changes
//      * @param  {Object} options.errors
//      * @return {Changeset}
//      */
//     restore({ changes, errors }) {
//       let newChanges = keys(changes).forEach(k => new Change(changes[k]));
//       let newErrors = keys(errors).forEach(k => new Err(errors[k].value, errors[k].validation));
//
//       set(this, CHANGES, newChanges);
//       set(this, ERRORS, newErrors);
//       this._notifyVirtualProperties();
//
//       return this;
//     },

    /**
     * Unlike `Ecto.Changeset.cast`, `cast` will take allowed keys and
     * remove unwanted keys off of the changeset. For example, this method
     * can be used to only allow specified changes through prior to saving.
     */
    cast(allowed /*: Array<string> */ = []) /*: ChangesetDef */ {
      let changes /*: Changes */ = get(this, CHANGES);

      if (isArray(allowed) && allowed.length === 0) {
        return this;
      }

      let changeKeys /*: Array<string> */ = keys(changes);
      let validKeys = emberArray(changeKeys).filter((key /*: string */) => includes(allowed, key));
      let casted = take(changes, validKeys);

      set(this, CHANGES, casted);

      return this;
    },

    /**
     * Checks to see if async validator for a given key has not resolved.
     * If no key is provided it will check to see if any async validator is running.
     */
    isValidating(key /*: string | void */) /*: boolean */ {
      let runningValidations /*: RunningValidations */ = get(this, RUNNING_VALIDATIONS);
      let ks /*: Array<string> */ = emberArray(keys(runningValidations));
      if (key) return includes(ks, key);
      return !isEmpty(ks);
    },

    /**
     * For a given key and value, set error or change.
     */
    _validateAndSet /*:: <T> */ (
      key   /*: string */,
      value /*: T      */
    ) /*: Promise<T> | Promise<ErrLike<T>> | T | ErrLike<T> */ {
      let c          /*: ChangesetDef     */ = this;
      let content    /*: Object           */ = get(this, CONTENT);
      let oldValue   /*: mixed            */ = get(content, key);
      let validation /*: ValidationResult | Promise<ValidationResult> */ =
        c._validate(key, value, oldValue);

      // TODO: Address case when Promise is rejected.
      if (isPromise(validation)) {
        c._setIsValidating(key, true);
        c.trigger(BEFORE_VALIDATION_EVENT, key);

        let v /*: Promise<ValidationResult> */ = (validation /*: any */);
        return v.then(resolvedValidation => {
          c._setIsValidating(key, false);
          c.trigger(AFTER_VALIDATION_EVENT, key);
          return c._setProperty(resolvedValidation, { key, value, oldValue });
        });
      }

      c.trigger(BEFORE_VALIDATION_EVENT, key);
      c.trigger(AFTER_VALIDATION_EVENT, key);
      let v /*: ValidationResult */ = (validation /*: any */);
      return c._setProperty(v, { key, value, oldValue });
    },

    /**
     * Validates a given key and value.
     */
    _validate(
      key      /*: string */,
      newValue /*: mixed  */,
      oldValue /*: mixed  */
    ) /*: ValidationResult | Promise<ValidationResult> */ {
      let changes   /*: Changes       */ = get(this, CHANGES);
      let validator /*: ValidatorFunc */ = get(this, VALIDATOR);
      let content   /*: Object        */ = get(this, CONTENT);

      if (typeOf(validator) === 'function') {
        let isValid = validator({
          key,
          newValue,
          oldValue,
          changes: get(this, '_inflatedChanges'),
          content,
        });

        return isPresent(isValid) ? isValid : true;
      }

      return true;
    },

//     _setChange(key, value) {
//       let changes = get(this, CHANGES);
//       let changePairs = pairs(changes).filter(ch => ch.value instanceof Change);
//
//       // Delete changed keys prefixed by `key`.
//       changePairs
//         .filter(p => p.key.indexOf(key) === 0)
//         .forEach(p => this._deleteKey(CHANGES, p.key));
//
//       // Determine if there are other changes at the same level.
//       let parts = key.split('.');
//       let branch = parts.slice(0, -1).join('.');
//       let hasOtherLeaves = changePairs
//         .filter(p => (
//           p.key.indexOf(branch) === 0 &&
//           p.key.split('.').length === parts.length
//         ))
//         .length > 0;
//
//       // If there are no other changes at the same level,
//       if (!hasOtherLeaves) {
//         // Delete any keys in path leading up to `key`.
//         key.split('.').slice(0, -1).forEach((_, i, allKeys) => {
//           let key = allKeys.slice(0, i+1).join('.');
//           this._deleteKey(CHANGES, key);
//         });
//       }
//
//       deepSet(changes, key, new Change(value));
//     },
//
    /**
     * Sets property or error on the changeset.
     */
    _setProperty /*:: <T> */ (
      validation               /*: ValidationResult */,
      { key, value, oldValue } /*: NewProperty<T>   */
    ) /*: T | ErrLike<T> */ {
      let changes /*: Changes */ = get(this, CHANGES);
      let isValid /*: boolean */ = validation === true
        || isArray(validation)
        && validation.length === 1
        && (validation /*: any */)[0] === true;

      // Shorthand for `this`.
      let c /*: ChangesetDef */ = this;

      // Error case.
      if (!isValid) {
        let v /*: ValidationErr */ = (validation /*: any */);
        return c.addError(key, { value, validation: v });
      }

      // Happy path: remove `key` from error map.
      c._deleteKey(ERRORS, key);

      // Happy path: update change map.
      if (!isEqual(oldValue, value)) {
        changes[key] = new Change(value);
      } else if (key in changes) {
        c._deleteKey(CHANGES, key);
      }

      // Happy path: notify that `key` was added.
      c.notifyPropertyChange(CHANGES);
      c.notifyPropertyChange(key);

      // Return new value.
      return value;
    },

    /**
     * Increment or decrement the number of running validations for a
     * given key.
     */
    _setIsValidating(
      key   /*: string  */,
      value /*: boolean */
    ) /*: void */ {
      let running /*: RunningValidations */ = get(this, RUNNING_VALIDATIONS);
      let count   /*: number             */ = get(running, key) || 0;

      if (!value && count === 1) {
        delete running[key];
        return;
      }

      set(running, key, value ? count+1 : count-1);
    },

    /**
     * Value for change or the original value.
     */
    _valueFor(
      key        /*: string  */,
      plainValue /*: ?boolean */ = false
    ) /*: RelayDef | mixed */ {
      let changes /*: Changes */ = get(this, CHANGES);
      let errors  /*: Errors  */ = get(this, ERRORS);
      let content /*: Object  */ = get(this, CONTENT);

      if (errors.hasOwnProperty(key)) {
        let e /*: Err */ = get(errors, key);
        return e.value;
      }

      let original /*: mixed */ = get(content, key);
      if (isObject(original) && !plainValue) {
        let c /*: ChangesetDef */ = this;
        let o /*: Object       */ = (original /*: any */);
        return c._relayFor(key, o);
      }

      if (changes.hasOwnProperty(key)) {
        let c /*: Change */ = get(changes, key);
        return c.value;
      }

      return original;
    },

    /**
     * Construct a Relay instance for an object.
     */
    _relayFor(
      key   /*: string */,
      value /*: Object */
    ) /*: RelayDef */ {
      let cache /*: RelayCache */ = get(this, RELAY_CACHE);

      if (!(key in cache)) {
        cache[key] = Relay.create({ key, changeset: this, content: value });
      }

      return cache[key];
    },

//     /**
//      * Notifies virtual properties set on the changeset of a change.
//      * You can specify which keys are notified by passing in an array.
//      *
//      * @private
//      * @param {Array} keys
//      * @return {Void}
//      */
//     _notifyVirtualProperties(keys = this._rollbackKeys()) {
//       for (let i = 0; i < keys.length; i++) {
//         this.notifyPropertyChange(keys[i]);
//       }
//     },
//
//     /**
//      * Gets the changes and error keys.
//      *
//      * @private
//      * @return {Array}
//      */
//     _rollbackKeys() {
//       return [
//         ...keys(get(this, CHANGES)),
//         ...keys(get(this, ERRORS))
//       ];
//     },

    /**
     * Deletes a key off an object and notifies observers.
     */
    _deleteKey(
      objName /*: string */,
      key     /*: string */ = ''
    ) /*: void */ {
      let obj /*: InternalMap */ = get(this, objName);
      if (obj.hasOwnProperty(key)) delete obj[key];
      let c /*: ChangesetDef */ = this;
      c.notifyPropertyChange(`${objName}.${key}`);
      c.notifyPropertyChange(objName);
    }
  } /*: ChangesetDef */));
}

export default class Changeset {
  /**
   * Changeset factory
   *
   * @class Changeset
   * @constructor
   */
  constructor(...args /*: Array<any> */) {
    return changeset(...args).create();
  }
}
