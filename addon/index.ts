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
} from '@ember/utils';
import {
  not,
  readOnly,
} from '@ember/object/computed';
import {
  get,
  set,
} from '@ember/object';

import {
  Config,
  IErr,
  ChangesetDef,
  ValidatorFunc,
  ValidationResult,
  ValidationErr,
} from 'ember-changeset/types';
import EmberObjectNs from '@ember/object';

const { keys } = Object;
const CONTENT = '_content';
const CHANGES = '_changes';
const ERRORS = '_errors';
const VALIDATOR = '_validator';
const OPTIONS = '_options';
const RUNNING_VALIDATIONS = '_runningValidations';
const BEFORE_VALIDATION_EVENT = 'beforeValidation';
const AFTER_VALIDATION_EVENT = 'afterValidation';
const AFTER_ROLLBACK_EVENT = 'afterRollback';
const defaultValidatorFn = () => true;
const defaultOptions = { skipValidate: false };

/**
 * Creates new changesets.
 *
 * @uses Ember.Evented
 */
export function changeset(
  obj: object,
  validateFn: ValidatorFunc = defaultValidatorFn,
  validationMap: { [s: string]: ValidatorFunc } = {},
  options: Config = {}
): EmberObjectNs {
  assert('Underlying object for changeset is missing', isPresent(obj));

  return EmberObject.extend(Evented, ({
    __changeset__: CHANGESET,

    changes: objectToArray(CHANGES, (c: Change) => c.value, false),
    errors:  objectToArray(ERRORS, (e: Err) => ({ value: e.value, validation: e.validation }), true),
    change:  inflate(CHANGES, c => c.value),
    error:   inflate(ERRORS, e => ({ value: e.value, validation: e.validation })),
    data:    readOnly(CONTENT),

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
    _validator: defaultValidatorFn,
    _options: defaultOptions,
    _runningValidations: {},
    trigger() {},
    */

    init() {
      let c: ChangesetDef = this;
      c._super(...arguments);
      c[CONTENT] = obj;
      c[CHANGES] = {};
      c[ERRORS] = {};
      c[VALIDATOR] = validateFn;
      c[OPTIONS] = pureAssign(defaultOptions, options);
      c[RUNNING_VALIDATIONS] = {};
    },

    /**
     * Proxies `get` to the underlying content or changed value, if present.
     */
    unknownProperty(
      key: string
    ): any {
      return this._valueFor(key);
    },

    /**
     * Stores change on the changeset.
     */
    setUnknownProperty<T> (
      key: string,
      value: T
    ): T | IErr<T> | Promise<T> | Promise<IErr<T>> {
      let config: Config = get(this, OPTIONS);
      let skipValidate: boolean = get(config, 'skipValidate');
      let c: ChangesetDef = this;

      if (skipValidate) {
        let content = get(this, CONTENT);
        let oldValue = get(content, key);
        return c._setProperty(true, { key, value, oldValue });
      }

      return c._validateAndSet(key, value);
    },

    /**
     * String representation for the changeset.
     */
    toString(): string {
      let normalisedContent: object = pureAssign(get(this, CONTENT), {});
      return `changeset:${normalisedContent.toString()}`;
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
      prepareChangesFn: ({ [s: string]: any }) => ({ [s: string]: any })
    ): ChangesetDef {
      let changes: { [s: string]: any } = get(this, '_bareChanges');
      let preparedChanges = prepareChangesFn(changes);

      assert('Callback to `changeset.prepare` must return an object', isObject(preparedChanges));
      validateNestedObj('preparedChanges', preparedChanges);

      let newChanges: Changes = keys(preparedChanges).reduce((newObj, key) => {
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
        let content /*: object  */ = get(this, CONTENT);
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
      options: object
    ): Promise<ChangesetDef || any> {
      let content: object = get(this, CONTENT);
      let savePromise: any | Promise<ChangesetDef | any> = resolve(this);
      (this: ChangesetDef).execute();

      if (typeof content.save === 'function') {
        let result /*: any | Promise<any> */ = content.save(options);
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
      let content /*: object */ = get(this, CONTENT);
      assert('Cannot merge with a non-changeset', isChangeset(changeset));
      assert('Cannot merge with a changeset of different content', get(changeset, CONTENT) === content);

      if (get(this, 'isPristine') && get(changeset, 'isPristine')) {
        return this;
      }

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
      // Get keys before reset.
      let c /*: ChangesetDef     */ = this;
      let keys = c._rollbackKeys();

      // Reset.
      set(this, CHANGES, {});
      set(this, ERRORS, {});
      c._notifyVirtualProperties(keys)

      c.trigger(AFTER_ROLLBACK_EVENT);
      return this;
    },

    /**
     * Discards any errors, keeping only valid changes.
     *
     * @public
     * @chainable
     * @param {String} key optional key to rollback invalid values
     * @return {Changeset}
     */
    rollbackInvalid(key /*: string | void */) /*: ChangesetDef */ {
      let errorKeys = keys(get(this, ERRORS));

      if (key) {
        this._notifyVirtualProperties([key]);
        this._deleteKey(ERRORS, key);
        if (errorKeys.indexOf(key) > -1) {
          this._deleteKey(CHANGES, key);
        }
      } else {
        this._notifyVirtualProperties();
        set(this, ERRORS, {});

        // if on CHANGES hash, rollback those as well
        errorKeys.forEach((errKey) => {
          this._deleteKey(CHANGES, errKey);
        })
      }

      return this;
    },

    /**
     * Discards changes/errors for the specified properly only.
     *
     * @public
     * @chainable
     * @param {String} key key to delete off of changes and errors
     * @return {Changeset}
     */
    rollbackProperty(key: string): ChangesetDef {
      this._deleteKey(CHANGES, key);
      this._deleteKey(ERRORS, key);

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
    ) /*: Promise<null> | Promise<any | IErr<any>> | Promise<Array<any | IErr<any>>> */ {
      if (keys(validationMap).length === 0) {
        return resolve(null);
      }

      let c /*: ChangesetDef */ = this;

      if (isNone(key)) {
        let maybePromise = keys(validationMap).map(validationKey => {
          const isPlain = true;
          return c._validateAndSet(validationKey, c._valueFor(validationKey, isPlain));
        });

        return all(maybePromise);
      }

      let k /*: string */ = (key /*: any */);
      const isPlain = true;
      return resolve(c._validateAndSet(k, c._valueFor(k, isPlain)));
    },

    /**
     * Manually add an error to the changeset. If there is an existing
     * error or change for `key`, it will be overwritten.
     */
    addError /*:: <T: string | IErr<*>> */ (
      key   /*: string */,
      error /*: T      */
    ) /*: T */ {
      // Construct new `Err` instance.
      let newError /*: Err */;
      if (isObject(error)) {
        let errorLike /*: IErr<*> */ = (error /*: any */);
        assert('Error must have value.', errorLike.hasOwnProperty('value'));
        assert('Error must have validation.', errorLike.hasOwnProperty('validation'));
        newError = new Err(errorLike.value, errorLike.validation);
      } else {
        let validation /*: ValidationErr */ = (error /*: any */);
        newError = new Err(get(this, key), validation);
      }

      // Remove `key` from changes map.
      let c = (this /*: ChangesetDef */);

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
     * Manually push multiple errors to the changeset as an array.
     */
    pushErrors(
      key: string,
      ...newError: string[]
    ): IErr<any> {
      let errors /*: Errors */ = get(this, ERRORS);
      let existingError /*: Err */ = errors[key] || new Err(null, []);
      let validation /*: ValidationErr */ = existingError.validation;
      let value /*: any */ = get(this, key);

      if (!isArray(validation) && isPresent(validation)) {
        let v /*: string */ = (existingError.validation /*: any */);
        existingError.validation = [v];
      }

      let v /*: Array<string> */ = (existingError.validation /*: any */);
      validation = [...v, ...newErrors];

      let c = (this /*: ChangesetDef */)
      c.notifyPropertyChange(ERRORS);
      c.notifyPropertyChange(key);

      errors[key] = new Err(value, validation);
      return { value, validation };
    },

    /**
     * Creates a snapshot of the changeset's errors and changes.
     */
    snapshot(): Snapshot {
      let changes: Changes = get(this, CHANGES);
      let errors: Errors = get(this, ERRORS);

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
    restore({ changes, errors }: Snapshot): ChangesetDef {
      validateNestedObj('snapshot.changes', changes);
      validateNestedObj('snapshot.errors',  errors);

      let newChanges: Changes = keys(changes).reduce((newObj, key) => {
        newObj[key] = new Change(changes[key]);
        return newObj;
      }, {});

      let newErrors: Errors = keys(errors).reduce((newObj, key) => {
        let e: IErr<T> = errors[key];
        newObj[key] = new Err(e.value, e.validation);
        return newObj;
      }, {});

      set(this, CHANGES, newChanges);
      set(this, ERRORS,  newErrors);

      this._notifyVirtualProperties();
      return this;
    },

    /**
     * Unlike `Ecto.Changeset.cast`, `cast` will take allowed keys and
     * remove unwanted keys off of the changeset. For example, this method
     * can be used to only allow specified changes through prior to saving.
     */
    cast(allowed: string[] = []): ChangesetDef {
      let changes: Changes = get(this, CHANGES);

      if (isArray(allowed) && allowed.length === 0) {
        return this;
      }

      let changeKeys: string[] = keys(changes);
      let validKeys = emberArray(changeKeys).filter((key /*: string */) => includes(allowed, key));
      let casted = take(changes, validKeys);
      set(this, CHANGES, casted);
      return this;
    },

    /**
     * Checks to see if async validator for a given key has not resolved.
     * If no key is provided it will check to see if any async validator is running.
     */
    isValidating(key: string | void): boolean {
      let runningValidations: RunningValidations = get(this, RUNNING_VALIDATIONS);
      let ks: string[] = emberArray(keys(runningValidations));
      if (key) {
        return includes(ks, key);
      }
      return !isEmpty(ks);
    },

    /**
     * For a given key and value, set error or change.
     */
    _validateAndSet<T> (
      key: string,
      value: T
    ): Promise<T> | Promise<IErr<T>> | T | IErr<T> {
      let c          /*: ChangesetDef     */ = this;
      let content    /*: object           */ = get(this, CONTENT);
      let oldValue   /*: any            */ = get(content, key);
      let validation /*: ValidationResult | Promise<ValidationResult> */ =
        c._validate(key, value, oldValue);

      let v /*: ValidationResult */ = (validation /*: any */);

      c.trigger(BEFORE_VALIDATION_EVENT, key);
      let result = c._setProperty(v, { key, value, oldValue });

      // TODO: Address case when Promise is rejected.
      if (isPromise(validation)) {
        c._setIsValidating(key, true);

        let v /*: Promise<ValidationResult> */ = (validation /*: any */);
        return v.then(resolvedValidation => {
          c._setIsValidating(key, false);
          c.trigger(AFTER_VALIDATION_EVENT, key);
          return c._setProperty(resolvedValidation, { key, value, oldValue });
        });
      }

      c.trigger(AFTER_VALIDATION_EVENT, key);

      return result;
    },

    /**
     * Validates a given key and value.
     */
    _validate(
      key: string,
      newValue: any,
      oldValue: any
    ): ValidationResult | Promise<ValidationResult> {
      let validator: ValidatorFunc = get(this, VALIDATOR);
      let content: object = get(this, CONTENT);

      if (typeof validator === 'function') {
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
    _setProperty<T> (
      validation: ValidationResult,
      { key, value, oldValue }: NewProperty<T>
    ): T | IErr<T> {
      let changes /*: Changes */ = get(this, CHANGES);
      let isValid /*: boolean */ = validation === true
        || isArray(validation)
        && validation.length === 1
        && (validation /*: any */)[0] === true;

      // Shorthand for `this`.
      let c /*: ChangesetDef */ = this;

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

      // Error case.
      if (!isValid) {
        let v /*: ValidationErr */ = (validation /*: any */);
        return c.addError(key, { value, validation: v });
      }

      // Return new value.
      return value;
    },

    /**
     * Increment or decrement the number of running validations for a
     * given key.
     */
    _setIsValidating(
      key: string,
      value: boolean
    ): void {
      let running: RunningValidations = get(this, RUNNING_VALIDATIONS);
      let count: number = get(running, key) || 0;

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
      key: string
    ): any {
      let changes /*: Changes */ = get(this, CHANGES);
      let errors  /*: Errors  */ = get(this, ERRORS);
      let content /*: object  */ = get(this, CONTENT);

      if (errors.hasOwnProperty(key)) {
        let e: Err = errors[key];
        return e.value;
      }

      let original: any = get(content, key);

      if (changes.hasOwnProperty(key)) {
        let c: Change = changes[key];
        return c.value;
      }

      // nested thus circulate through `value` and see if match
      if (key.indexOf('.') !== -1) {
        let [baseKey, ...keyParts] = key.split('.');
        if (changes.hasOwnProperty(baseKey)) {
          let { value } = changes[baseKey];
          // make sure to return value if not object
          if(!value) { return value; }
          let result = get(value, keyParts.join('.'));
          if (result) {
            return result;
          }
        }
      }

      return original;
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
      keys: string[] = (this: ChangesetDef)._rollbackKeys()
    ): void {
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
      objName: string,
      key: string = ''
    ): void {
      let obj: InternalMap = get(this, objName);
      if (obj.hasOwnProperty(key)) {
        delete obj[key];
      }
      let c /*: ChangesetDef */ = this;
      c.notifyPropertyChange(`${objName}.${key}`);
      c.notifyPropertyChange(objName);
    }
  }: ChangesetDef));
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
