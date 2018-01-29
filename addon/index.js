// @flow

import Relay from 'ember-changeset/-private/relay';
import objectToArray from 'ember-changeset/utils/computed/object-to-array';
import isEmptyObject from 'ember-changeset/utils/computed/is-empty-object';
import inflate from 'ember-changeset/utils/computed/inflate';
import transform from 'ember-changeset/utils/computed/transform';
import isPromise from 'ember-changeset/utils/is-promise';
import isObject from 'ember-changeset/utils/is-object';
import pureAssign from 'ember-changeset/utils/assign';
import includes from 'ember-changeset/utils/includes';
import take from 'ember-changeset/utils/take';
import isChangeset, { CHANGESET } from 'ember-changeset/utils/is-changeset';
import isRelay from 'ember-changeset/utils/is-relay';
import setNestedProperty from 'ember-changeset/utils/set-nested-property';
import mergeNested from 'ember-changeset/utils/merge-nested';
import validateNestedObj from 'ember-changeset/utils/validate-nested-obj';
import objectWithout from 'ember-changeset/utils/object-without';
import Err from 'ember-changeset/-private/err';
import Change from 'ember-changeset/-private/change';
import deepSet from 'ember-deep-set';
import EmberObject from '@ember/object';
import Evented from '@ember/object/evented';
import {
  A as emberArray,
  isArray,
} from '@ember/array';
import {
  all,
  resolve,
} from 'rsvp';
import { assert } from '@ember/debug';
import {
  isEmpty,
  isEqual,
  isNone,
  isPresent,
  typeOf,
} from '@ember/utils';
import { not } from '@ember/object/computed';
import {
  get,
  set,
} from '@ember/object';

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

type Snapshot = {
  changes: { [string]: mixed          },
  errors:  { [string]: ErrLike<mixed> },
};

type Inflated<T> = {
  [string]: Inflated<T> | T,
};

export type ChangesetDef = {|
  _content:            Object,
  _changes:            Changes,
  _errors:             Errors,
  _relayCache:         RelayCache,
  _validator:          ValidatorFunc,
  _options:            Config,
  _runningValidations: RunningValidations,
  __changeset__:       '__CHANGESET__',
  _bareChanges:        { [string]: mixed },

  changes: Array<{ key: string }>,
  errors:  Array<{ key: string }>,
  change:  Inflated<mixed>,
  error:   Inflated<ErrLike<mixed>>,

  isValid:    boolean,
  isPristine: boolean,
  isInvalid:  boolean,
  isDirty:    boolean,

  _super: () => void,
  init: () => void,
  unknownProperty: (string) => mixed,
  get: (string) => mixed,
  _valueFor: (string, ?boolean) => RelayDef | mixed,
  _relayFor: (string, Object) => RelayDef,
  toString: () => string,
  _deleteKey: (InternalMapKey, string) => void,
  notifyPropertyChange: (string) => void,
  addError: <T: string | ErrLike<*>>(string, T) => T,
  _setProperty: <T>(ValidationResult, NewProperty<T>) => (T | ErrLike<T>),
  _validateAndSet: <T>(string, T) => (Promise<T> | Promise<ErrLike<T>> | T | ErrLike<T>),
  _setIsValidating: (string, boolean) => void,
  _validate: (string, mixed, mixed) => (ValidationResult | Promise<ValidationResult>),
  trigger: (string, string) => void,
  isValidating: (string | void) => boolean,
  cast: (Array<string>) => ChangesetDef,
  willDestroy: () => void,
  setUnknownProperty: <T>(string, T) => (T | ErrLike<T> | Promise<T> | Promise<ErrLike<T>>),
  prepare: (({ [string]: mixed }) => ({ [string]: mixed })) => ChangesetDef,
  execute: () => ChangesetDef,
  _notifyVirtualProperties: (?Array<string>) => void,
  _rollbackKeys: () => Array<string>,
  rollback: () => ChangesetDef,
  save: (Object) => Promise<ChangesetDef | mixed>,
  merge: (ChangesetDef) => ChangesetDef,
  validate: (string | void) => (Promise<null> | Promise<mixed | ErrLike<mixed>> | Promise<Array<mixed | ErrLike<mixed>>>),
  pushErrors: (string, ...string) => ErrLike<mixed>,
  snapshot: () => Snapshot,
  restore: (Snapshot) => ChangesetDef,
|};
*/

/**
 * Creates new changesets.
 *
 * @uses Ember.Evented
 */
export function changeset(
  obj           /*: Object                      */,
  validateFn    /*: ValidatorFunc               */ = defaultValidatorFn,
  validationMap /*: { [string]: ValidatorFunc } */ = {},
  options       /*: Config                      */ = {}
) /*: Class<ChangesetDef> */ {
  assert('Underlying object for changeset is missing', isPresent(obj));

  return EmberObject.extend(Evented, ({
    /**
     * Internal descriptor for changeset identification.
     */
    __changeset__: CHANGESET,

    changes: objectToArray(CHANGES, (c /*: Change */) => c.value, false),
    errors:  objectToArray(ERRORS, (e /*: Err */) => ({ value: e.value, validation: e.validation }), true),
    change:  inflate(CHANGES, c => c.value),
    error:   inflate(ERRORS, e => ({ value: e.value, validation: e.validation })),

    isValid:    isEmptyObject(ERRORS),
    isPristine: isEmptyObject(CHANGES),
    isInvalid:  not('isValid').readOnly(),
    isDirty:    not('isPristine').readOnly(),

    _bareChanges: transform(CHANGES, c => c.value),

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
     */
    unknownProperty(
      key /*: string */
    ) /*: RelayDef | mixed */ {
      return (this /*: ChangesetDef */)._valueFor(key);
    },

    /**
     * Stores change on the changeset.
     */
    setUnknownProperty /*:: <T> */ (
      key   /*: string */,
      value /*: T      */
    ) /*: T | ErrLike<T> | Promise<T> | Promise<ErrLike<T>> */ {
      let config       /*: Config       */ = get(this, OPTIONS);
      let skipValidate /*: boolean      */ = get(config, 'skipValidate');
      let c            /*: ChangesetDef */ = this;

      if (skipValidate) {
        return c._setProperty(true, { key, value });
      }

      return c._validateAndSet(key, value);
    },

    /**
     * String representation for the changeset.
     */
    toString() /*: string */ {
      let normalisedContent /*: Object */ = pureAssign(get(this, CONTENT), {});
      return `changeset:${normalisedContent.toString()}`;
    },

    /**
     * Teardown relays from cache.
     */
    willDestroy() /*: void */ {
      let relayCache /*: RelayCache */ = get(this, RELAY_CACHE);
      for (let key in relayCache) relayCache[key].destroy();
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
     */
    prepare(
      prepareChangesFn /*: ({ [string]: mixed }) => ({ [string]: mixed }) */
    ) /*: ChangesetDef */ {
      let changes /*: { [string]: mixed } */ = get(this, '_bareChanges');
      let preparedChanges = prepareChangesFn(changes);

      assert('Callback to `changeset.prepare` must return an object', isObject(preparedChanges));
      validateNestedObj('preparedChanges', preparedChanges);

      let newChanges /*: Changes */ = keys(preparedChanges).reduce((newObj, key) => {
        newObj[key] = new Change(preparedChanges[key]);
        return newObj;
      }, {});

      set(this, CHANGES, newChanges);
      return this;
    },

    /**
     * Executes the changeset if in a valid state.
     */
    execute() /*: ChangesetDef */ {
      if (get(this, 'isValid') && get(this, 'isDirty')) {
        let content /*: Object  */ = get(this, CONTENT);
        let changes /*: Changes */ = get(this, CHANGES);
        keys(changes).forEach(key => deepSet(content, key, changes[key].value));
      }

      return this;
    },

    /**
     * Executes the changeset and saves the underlying content.
     *
     * @param {Object} options optional object to pass to content save method
     */
    save(
      options /*: Object */
    ) /*: Promise<ChangesetDef | mixed> */ {
      let content     /*: Object */ = get(this, CONTENT);
      let savePromise /*: mixed | Promise<ChangesetDef | mixed> */ = resolve(this);
      (this /*: ChangesetDef */).execute();

      if (typeOf(content.save) === 'function') {
        let result /*: mixed | Promise<mixed> */ = content.save(options);
        savePromise = result;
      }

      return resolve(savePromise).then((result) => {
        (this /*: ChangesetDef */).rollback();
        return result;
      });
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
     */
    merge(
      changeset /*: ChangesetDef */
    ) /*: ChangesetDef */ {
      let content /*: Object */ = get(this, CONTENT);
      assert('Cannot merge with a non-changeset', isChangeset(changeset));
      assert('Cannot merge with a changeset of different content', get(changeset, CONTENT) === content);

      if (get(this, 'isPristine') && get(changeset, 'isPristine')) {
        return this;
      }

      // Note: we do not need to merge the RelayCache because the new
      // changeset will create its own relays if necessary.

      let c1 /*: Changes    */ = get(this, CHANGES);
      let c2 /*: Changes    */ = get(changeset, CHANGES);
      let e1 /*: Errors     */ = get(this, ERRORS);
      let e2 /*: Errors     */ = get(changeset, ERRORS);

      let newChangeset  /*: ChangesetDef */ = new Changeset(content, get(this, VALIDATOR));
      let newErrors     /*: Errors  */      = objectWithout(keys(c2), e1);
      let newChanges    /*: Changes */      = objectWithout(keys(e2), c1);
      let mergedErrors  /*: Errors  */      = mergeNested(newErrors, e2);
      let mergedChanges /*: Changes */      = mergeNested(newChanges, c2);

      newChangeset[ERRORS]  = mergedErrors;
      newChangeset[CHANGES] = mergedChanges;
      newChangeset._notifyVirtualProperties();
      return newChangeset;
    },

    /**
     * Returns the changeset to its pristine state, and discards changes and
     * errors.
     */
    rollback() /*: ChangesetDef */ {
      // Notify keys contained in relays.
      let relayCache /*: RelayCache */ = get(this, RELAY_CACHE);
      for (let key in relayCache) relayCache[key].rollback();

      // Get keys before reset.
      let keys = (this /*: ChangesetDef */)._rollbackKeys();

      // Reset.
      set(this, RELAY_CACHE, {});
      set(this, CHANGES, {});
      set(this, ERRORS, {});
      (this /*: ChangesetDef */)._notifyVirtualProperties(keys)

      return this;
    },

    /**
     * Validates the changeset immediately against the validationMap passed in.
     * If no key is passed into this method, it will validate all fields on the
     * validationMap and set errors accordingly. Will throw an error if no
     * validationMap is present.
     */
    validate(
      key /*: string | void */
    ) /*: Promise<null> | Promise<mixed | ErrLike<mixed>> | Promise<Array<mixed | ErrLike<mixed>>> */ {
      if (keys(validationMap).length === 0) {
        return resolve(null);
      }

      let c /*: ChangesetDef */ = this;

      if (isNone(key)) {
        let maybePromise = keys(validationMap).map(validationKey => {
          return c._validateAndSet(validationKey, c._valueFor(validationKey));
        });

        return all(maybePromise);
      }

      let k /*: string */ = (key /*: any */);
      return resolve(c._validateAndSet(k, c._valueFor(k)));
    },

    /**
     * Manually add an error to the changeset. If there is an existing
     * error or change for `key`, it will be overwritten.
     */
    addError /*:: <T: string | ErrLike<*>> */ (
      key   /*: string */,
      error /*: T      */
    ) /*: T */ {
      // Construct new `Err` instance.
      let newError /*: Err */;
      if (isObject(error)) {
        let errorLike /*: ErrLike<*> */ = (error /*: any */);
        assert('Error must have value.', errorLike.hasOwnProperty('value'));
        assert('Error must have validation.', errorLike.hasOwnProperty('validation'));
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
      setNestedProperty(errors, key, newError);
      c.notifyPropertyChange(ERRORS);

      // Notify that `key` has changed.
      c.notifyPropertyChange(key);

      // Return passed-in `error`.
      return error;
    },

    /**
     * Manually push multiple errors to the changeset as an array. If there is
     * an existing error or change for `key`. it will be overwritten.
     */
    pushErrors(
      key          /*: string        */,
      ...newErrors /*: Array<string> */
    ) /*: ErrLike<mixed> */ {
      let errors /*: Errors */ = get(this, ERRORS);
      let existingError /*: Err */ = errors[key] || new Err(null, []);
      let validation /*: ValidationErr */ = existingError.validation;
      let value /*: mixed */ = get(this, key);

      if (!isArray(validation) && isPresent(validation)) {
        let v /*: string */ = (existingError.validation /*: any */);
        existingError.validation = [v];
      }

      let v /*: Array<string> */ = (existingError.validation /*: any */);
      validation = [...v, ...newErrors];

      let c = (this /*: ChangesetDef */)
      c._deleteKey(CHANGES, key);
      c.notifyPropertyChange(ERRORS);
      c.notifyPropertyChange(key);

      errors[key] = new Err(value, validation);
      return { value, validation };
    },

    /**
     * Creates a snapshot of the changeset's errors and changes.
     */
    snapshot() /*: Snapshot */ {
      let changes /*: Changes */ = get(this, CHANGES);
      let errors  /*: Errors  */ = get(this, ERRORS);

      return {
        changes: keys(changes).reduce((newObj, key) => {
          newObj[key] = changes[key].value;
          return newObj;
        }, {}),

        errors: keys(errors).reduce((newObj, key) => {
          let e = errors[key]
          newObj[key] = { value: e.value, validation: e.validation };
          return newObj;
        }, {}),
      };
    },

    /**
     * Restores a snapshot of changes and errors. This overrides existing
     * changes and errors.
     */
    restore({ changes, errors } /*: Snapshot */) /*: ChangesetDef */ {
      validateNestedObj('snapshot.changes', changes);
      validateNestedObj('snapshot.errors',  errors);

      let newChanges /*: Changes */ = keys(changes).reduce((newObj, key) => {
        newObj[key] = new Change(changes[key]);
        return newObj;
      }, {});

      let newErrors /*: Errors */ = keys(errors).reduce((newObj, key) => {
        let e /*: ErrLike<*> */ = errors[key];
        newObj[key] = new Err(e.value, e.validation);
        return newObj;
      }, {});

      set(this, CHANGES, newChanges);
      set(this, ERRORS,  newErrors);

      (this /*: ChangesetDef */)._notifyVirtualProperties();
      return this;
    },

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
      let validator /*: ValidatorFunc */ = get(this, VALIDATOR);
      let content   /*: Object        */ = get(this, CONTENT);

      if (typeOf(validator) === 'function') {
        let isValid = validator({
          key,
          newValue,
          oldValue,
          changes: get(this, 'change'),
          content,
        });

        return isPresent(isValid) ? isValid : true;
      }

      return true;
    },

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
        setNestedProperty(changes, key, new Change(value));
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
        let e /*: Err */ = errors[key];
        return e.value;
      }

      let original /*: mixed */ = get(content, key);
      let hasChanged /*: boolean */ = changes.hasOwnProperty(key);
      if (isObject(original) && !plainValue && !hasChanged) {
        let c /*: ChangesetDef */ = this;
        let o /*: Object       */ = (original /*: any */);
        return c._relayFor(key, o);
      }

      if (hasChanged) {
        let c /*: Change */ = changes[key];
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

    /**
     * Notifies virtual properties set on the changeset of a change.
     * You can specify which keys are notified by passing in an array.
     *
     * @private
     * @param {Array} keys
     * @return {Void}
     */
    _notifyVirtualProperties(
      keys /*: ?Array<string> */ = (this /*: ChangesetDef */)._rollbackKeys()
    ) /*: void */ {
      (keys || []).forEach(key => (this /*: ChangesetDef */).notifyPropertyChange(key));
    },

    /**
     * Gets the changes and error keys.
     */
    _rollbackKeys() /*: Array<string> */ {
      let changes /*: Changes */ = get(this, CHANGES);
      let errors  /*: Errors  */ = get(this, ERRORS);
      return emberArray([...keys(changes), ...keys(errors)]).uniq();
    },

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
    },

    /**
     * Overrides `Ember.Object.get`.
     *
     * If the returned value is a Relay, return the Relay's underlying
     * content instead.
     *
     * Otherwise, this method is equivalent to `Ember.Object.get`.
     */
    get(keyName /*: string */) /*: mixed */ {
      let result = this._super(keyName);
      if (isRelay(result)) return get(result, 'content');
      return result;
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
