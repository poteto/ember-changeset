import {
  A as emberArray,
  isArray,
} from '@ember/array';
import { assert } from '@ember/debug';
import EmberObject, {
  get,
  set,
} from '@ember/object';
import {
  not,
  readOnly,
} from '@ember/object/computed';
import Evented from '@ember/object/evented';
import {
  isEmpty,
  isEqual,
  isNone,
  isPresent,
} from '@ember/utils';
import Change from 'ember-changeset/-private/change';
import Err from 'ember-changeset/-private/err';
import pureAssign from 'ember-changeset/utils/assign';
import inflate from 'ember-changeset/utils/computed/inflate';
import isEmptyObject from 'ember-changeset/utils/computed/is-empty-object';
import objectToArray from 'ember-changeset/utils/computed/object-to-array';
import transform from 'ember-changeset/utils/computed/transform';
import includes from 'ember-changeset/utils/includes';
import isChangeset, { CHANGESET } from 'ember-changeset/utils/is-changeset';
import isObject from 'ember-changeset/utils/is-object';
import isPromise from 'ember-changeset/utils/is-promise';
import mergeNested from 'ember-changeset/utils/merge-nested';
import objectWithout from 'ember-changeset/utils/object-without';
import setNestedProperty from 'ember-changeset/utils/set-nested-property';
import take from 'ember-changeset/utils/take';
import validateNestedObj from 'ember-changeset/utils/validate-nested-obj';
import deepSet from 'ember-deep-set';
import {
  all,
  resolve,
} from 'rsvp';

import {
  Changes,
  ChangesetDef,
  Config,
  Content,
  Errors,
  IErr,
  InternalMap,
  NewProperty,
  PrepareChangesFn,
  RunningValidations,
  Snapshot,
  ValidationErr,
  ValidationResult,
  ValidatorFunc,
} from 'ember-changeset/types';

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
  validationMap: { [s: string]: ValidatorFunc | ValidatorFunc[] } = {},
  options: Config = {}
) {
  assert('Underlying object for changeset is missing', isPresent(obj));

  let changeset: any = { // ChangesetDef

    // notifyPropertyChange: (s: string) => void,
    // trigger: (k: string, v: string | void) => void,
    __changeset__: CHANGESET,

    _content: {},
    _changes: {},
    _errors: {},
    _validator: defaultValidatorFn,
    _options: defaultOptions,
    _runningValidations: {},
    _bareChanges: transform(CHANGES, (c: Change) => c.value),

    changes: objectToArray(CHANGES, (c: Change) => c.value, false),
    errors: objectToArray(ERRORS, (e: Err) => ({ value: e.value, validation: e.validation }), true),
    change: inflate(CHANGES, (c: Change) => c.value),
    error: inflate(ERRORS, (e: IErr<any>) => ({ value: e.value, validation: e.validation })),
    data: readOnly(CONTENT),

    isValid:    isEmptyObject(ERRORS),
    isPristine: isEmptyObject(CHANGES),
    isInvalid:  not('isValid').readOnly(),
    isDirty:    not('isPristine').readOnly(),

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
     *
     * @method setUnknownProperty
     */
    setUnknownProperty<T> (
      key: string,
      value: T
    ): Promise<ValidationResult | T | IErr<T>> | T | IErr<T> | ValidationResult {
      let config: Config = get(this, OPTIONS);
      let skipValidate: boolean | undefined = get(config, 'skipValidate');

      if (skipValidate) {
        let content: Content = get(this, CONTENT);
        let oldValue = get(content, key);
        this._setProperty({ key, value, oldValue });
        return this._handleValidation(true, { key, value });
      }

      let content: Content = get(this, CONTENT);
      let oldValue: any = get(content, key);
      this._setProperty({ key, value, oldValue });
      return this._validateKey(key, value);
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
     *
     * @method prepare
     */
    prepare(
      prepareChangesFn: PrepareChangesFn
    ): ChangesetDef {
      let changes: { [s: string]: any } = get(this, '_bareChanges');
      let preparedChanges = prepareChangesFn(changes);

      assert('Callback to `changeset.prepare` must return an object', isObject(preparedChanges));
      validateNestedObj('preparedChanges', preparedChanges);

      let newObj: Changes = {};
      let newChanges: Changes = keys(preparedChanges).reduce((newObj: Changes, key: keyof Changes) => {
        newObj[key] = new Change(preparedChanges[key]);
        return newObj;
      }, newObj);

      set(this, CHANGES, newChanges);
      return this;
    },

    /**
     * Executes the changeset if in a valid state.
     *
     * @method execute
     */
    execute(): ChangesetDef {
      if (get(this, 'isValid') && get(this, 'isDirty')) {
        let content: Content = get(this, CONTENT);
        let changes: Changes = get(this, CHANGES);
        keys(changes).forEach(key => deepSet(content, key, changes[key].value));
      }

      return this;
    },

    /**
     * Executes the changeset and saves the underlying content.
     *
     * @method save
     * @param {Object} options optional object to pass to content save method
     */
    save(
      options: object
    ): Promise<ChangesetDef | any> {
      let content: Content = get(this, CONTENT);
      let savePromise: any | Promise<ChangesetDef | any> = resolve(this);
      this.execute();

      if (typeof content.save === 'function') {
        savePromise = content.save(options);
      } else if (typeof get(content, 'save') === 'function') {
        // we might be getting this off a proxy object.  For example, when a
        // belongsTo relationship (a proxy on the parent model)
        // another way would be content(belongsTo).content.save
        let saveFunc: Function | undefined = get(content, 'save');
        if (saveFunc) {
          savePromise = saveFunc(options);
        }
      }

      return resolve(savePromise).then((result) => {
        this.rollback();
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
     *
     * @method merge
     */
    merge(
      changeset: ChangesetDef
    ): ChangesetDef {
      let content: Content = get(this, CONTENT);
      assert('Cannot merge with a non-changeset', isChangeset(changeset));
      assert('Cannot merge with a changeset of different content', get(changeset, CONTENT) === content);

      if (get(this, 'isPristine') && get(changeset, 'isPristine')) {
        return this;
      }

      let c1: Changes = get(this, CHANGES);
      let c2: Changes = get(changeset, CHANGES);
      let e1: Errors<any> = get(this, ERRORS);
      let e2: Errors<any> = get(changeset, ERRORS);

      let newChangeset: any = new Changeset(content, get(this, VALIDATOR)); // ChangesetDef
      let newErrors: Errors<any> = objectWithout(keys(c2), e1);
      let newChanges: Changes = objectWithout(keys(e2), c1);
      let mergedErrors: Errors<any> = mergeNested(newErrors, e2);
      let mergedChanges: Changes = mergeNested(newChanges, c2);

      newChangeset[ERRORS]  = mergedErrors;
      newChangeset[CHANGES] = mergedChanges;
      newChangeset._notifyVirtualProperties();
      return newChangeset;
    },

    /**
     * Returns the changeset to its pristine state, and discards changes and
     * errors.
     *
     * @method rollback
     */
    rollback(): ChangesetDef {
      // Get keys before reset.
      let c: ChangesetDef = this;
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
     * @method rollbackInvalid
     * @param {String} key optional key to rollback invalid values
     * @return {Changeset}
     */
    rollbackInvalid(key: string | void): ChangesetDef {
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
     * @method rollbackProperty
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
     *
     * @method validate
     */
    validate(
      key?: string | undefined
    ): Promise<null> | Promise<any | IErr<any>> | Promise<Array<any | IErr<any>>> {
      if (keys(validationMap).length === 0) {
        return resolve(null);
      }

      if (isNone(key)) {
        let maybePromise = keys(validationMap).map(validationKey => {
          return this._validateKey(validationKey, this._valueFor(validationKey));
        });

        return all(maybePromise);
      }

      return resolve(this._validateKey(key, this._valueFor(key)));
    },

    /**
     * Manually add an error to the changeset. If there is an existing
     * error or change for `key`, it will be overwritten.
     *
     * @method addError
     */
    addError<T> (
      key: string,
      error: IErr<T> | ValidationErr
    ): IErr<T> | ValidationErr {
      // Construct new `Err` instance.
      let newError;
      if (isObject(error)) {
        assert('Error must have value.', error.hasOwnProperty('value'));
        assert('Error must have validation.', error.hasOwnProperty('validation'));
        newError = new Err((<IErr<T>>error).value, (<IErr<T>>error).validation);
      } else {
        newError = new Err(get(this, key), (<ValidationErr>error));
      }

      // Add `key` to errors map.
      let errors: Errors<any> = get(this, ERRORS);
      setNestedProperty(errors, key, newError);
      this.notifyPropertyChange(ERRORS);

      // Notify that `key` has changed.
      this.notifyPropertyChange(key);

      // Return passed-in `error`.
      return error;
    },

    /**
     * Manually push multiple errors to the changeset as an array.
     *
     * @method pushErrors
     */
    pushErrors(
      key: keyof ChangesetDef,
      ...newErrors: string[] | ValidationErr[]
    ) {
      let errors: Errors<any> = get(this, ERRORS);
      let existingError: IErr<any> | Err = errors[key] || new Err(null, []);
      let validation: ValidationErr | ValidationErr[] = existingError.validation;
      let value: any = get(this, key);

      if (!isArray(validation) && isPresent(validation)) {
        existingError.validation = [validation];
      }

      let v = existingError.validation;
      validation = [...v, ...newErrors];
      let newError = new Err(value, validation);
      setNestedProperty(errors, (<string>key), newError);

      this.notifyPropertyChange(ERRORS);
      this.notifyPropertyChange((<string>key));

      return { value, validation };
    },

    /**
     * Creates a snapshot of the changeset's errors and changes.
     *
     * @method snapshot
     */
    snapshot(): Snapshot {
      let changes: Changes = get(this, CHANGES);
      let errors: Errors<any> = get(this, ERRORS);

      return {
        changes: keys(changes).reduce((newObj: Changes, key: keyof Changes) => {
          newObj[key] = changes[key].value;
          return newObj;
        }, {}),

        errors: keys(errors).reduce((newObj: Errors<any>, key: keyof Errors<any>) => {
          let e = errors[key]
          newObj[key] = { value: e.value, validation: e.validation };
          return newObj;
        }, {}),
      };
    },

    /**
     * Restores a snapshot of changes and errors. This overrides existing
     * changes and errors.
     *
     * @method restore
     */
    restore({ changes, errors }: Snapshot): ChangesetDef {
      validateNestedObj('snapshot.changes', changes);
      validateNestedObj('snapshot.errors',  errors);

      let newChanges: Changes = keys(changes).reduce((newObj: Changes, key: keyof Changes) => {
        newObj[key] = new Change(changes[key]);
        return newObj;
      }, {});

      let newErrors: Errors<any> = keys(errors).reduce((newObj: Changes, key: keyof Changes) => {
        let e: IErr<any> = errors[key];
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
     *
     * @method cast
     */
    cast(allowed: string[] = []): ChangesetDef {
      let changes: Changes = get(this, CHANGES);

      if (isArray(allowed) && allowed.length === 0) {
        return this;
      }

      let changeKeys: string[] = keys(changes);
      let validKeys = emberArray(changeKeys).filter((key: string) => includes(allowed, key));
      let casted = take(changes, validKeys);
      set(this, CHANGES, casted);
      return this;
    },

    /**
     * Checks to see if async validator for a given key has not resolved.
     * If no key is provided it will check to see if any async validator is running.
     *
     * @method isValidating
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
     * Validates a specific key
     *
     * @method _validateKey
     * @private
     */
    _validateKey<T> (
      key: string,
      value: T
    ): Promise<ValidationResult | T | IErr<T>> | T | IErr<T> | ValidationResult {
      let content: Content = get(this, CONTENT);
      let oldValue: any = get(content, key);
      let validation: ValidationResult | Promise<ValidationResult> =
        this._validate(key, value, oldValue);

      this.trigger(BEFORE_VALIDATION_EVENT, key);

      // TODO: Address case when Promise is rejected.
      if (isPromise(validation)) {
        this._setIsValidating(key, true);

        return (<Promise<ValidationResult>>validation).then((resolvedValidation: ValidationResult) => {
          this._setIsValidating(key, false);
          this.trigger(AFTER_VALIDATION_EVENT, key);

          return this._handleValidation(resolvedValidation, { key, value });
        });
      }

      let result = this._handleValidation(validation, { key, value });

      this.trigger(AFTER_VALIDATION_EVENT, key);

      return result;
    },

    /**
     * Takes resolved validation and adds an error or simply returns the value
     *
     * @method _handleValidation
     * @private
     */
    _handleValidation<T> (
      validation: ValidationResult,
      { key, value }: NewProperty<T>
    ): T | IErr<T> | ValidationErr {

      let isValid: boolean = validation === true
        || isArray(validation)
        && validation.length === 1
        && validation[0] === true;

      // Happy path: remove `key` from error map.
      this._deleteKey(ERRORS, key);

      // Error case.
      if (!isValid) {
        return this.addError(key, { value, validation } as IErr<T>);
      }

      return value;
    },

    /**
     * runs the validator with the key and value
     *
     * @method _validate
     * @private
     */
    _validate(
      key: string,
      newValue: any,
      oldValue: any
    ): ValidationResult | Promise<ValidationResult> {
      let validator: ValidatorFunc = get(this, VALIDATOR);
      let content: Content = get(this, CONTENT);

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
     * Returns value or error
     */
    _setProperty<T> (
      { key, value, oldValue }: NewProperty<T>
    ): void {
      let changes: Changes = get(this, CHANGES);

      // Happy path: update change map.
      if (!isEqual(oldValue, value)) {
        setNestedProperty(changes, key, new Change(value));
      } else if (key in changes) {
        this._deleteKey(CHANGES, key);
      }

      // Happy path: notify that `key` was added.
      this.notifyPropertyChange(CHANGES);
      this.notifyPropertyChange(key);
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

      deepSet(running, key, value ? count+1 : count-1);
    },

    /**
     * Value for change or the original value.
     */
    _valueFor(
      key: string
    ): any {
      let changes: Changes = get(this, CHANGES);
      let errors: Errors<any> = get(this, ERRORS);
      let content: Content = get(this, CONTENT);

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
          if(!value) {
            return value;
          }
          let result = get(value, keyParts.join('.'));
          return result;
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
      keys?: string[]
    ): void {
      if (!keys) {
        keys = this._rollbackKeys()
      }
      (keys || []).forEach(key => this.notifyPropertyChange(key));
    },

    /**
     * Gets the changes and error keys.
     */
    _rollbackKeys(): string[] {
      let changes: Changes = get(this, CHANGES);
      let errors: Errors<any> = get(this, ERRORS);
      return emberArray([...keys(changes), ...keys(errors)]).uniq();
    },

    /**
     * Deletes a key off an object and notifies observers.
     */
    _deleteKey(
      objName: string,
      key = ''
    ): void {
      let obj: InternalMap = get(this, objName);
      if (obj.hasOwnProperty(key)) {
        delete obj[key];
      }
      let c: ChangesetDef = this;
      c.notifyPropertyChange(`${objName}.${key}`);
      c.notifyPropertyChange(objName);
    },

    get(key: string): any {
      if (key.indexOf('.') > -1) {
        // pull off changes hash with full key instead of
        // breaking up key
        return this.unknownProperty(key);
      } else {
        return this._super(...arguments);
      }
    },

    set<T> (
      key: string,
      value: T
    ): void | Promise<ValidationResult | T | IErr<T>> | T | IErr<T> | ValidationResult {
      if (key.indexOf('.') > -1) {
        // Adds new CHANGE and avoids ember intenals setting directly on model
        // TODO: overriding `set(changeset, )` doesnt work
        return this.setUnknownProperty(key, value);
      } else {
        return this._super(...arguments);
      }
    }
  }

  return EmberObject.extend(Evented, changeset);
}

export default class Changeset {
  /**
   * Changeset factory
   *
   * @class Changeset
   * @constructor
   */
  constructor(
    obj: object,
    validateFn: ValidatorFunc = defaultValidatorFn,
    validationMap: { [s: string]: ValidatorFunc | ValidatorFunc[] } = {},
    options: Config = {}
  ) {
    return changeset(obj, validateFn, validationMap, options).create();
  }
}
