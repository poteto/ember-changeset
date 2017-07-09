import Ember from 'ember';
import objectToArray from 'ember-changeset/utils/computed/object-to-array';
import isEmptyObject from 'ember-changeset/utils/computed/is-empty-object';
import isPromise from 'ember-changeset/utils/is-promise';
import isObject from 'ember-changeset/utils/is-object';
import pureAssign from 'ember-changeset/utils/assign';
import objectWithout from 'ember-changeset/utils/object-without';
import includes from 'ember-changeset/utils/includes';
import take from 'ember-changeset/utils/take';
import isChangeset, { CHANGESET } from 'ember-changeset/utils/is-changeset';

const {
  Object: EmberObject,
  RSVP: { all, allSettled, resolve },
  computed: { not, readOnly },
  A: emberArray,
  assert,
  get,
  isArray,
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
const MODELNAME = 'modelName';
const STORE = 'store';

function defaultValidatorFn() {
  return true;
}

/**
 * Creates new changesets.
 *
 * @param  {Object} obj
 * @param  {Function} validateFn
 * @param  {Object} validationMap
 * @return {Ember.Object}
 */
export function changeset(obj, validateFn = defaultValidatorFn, validationMap = {}) {
  assert('Underlying object for changeset is missing', isPresent(obj));

  return EmberObject.extend({
    /**
     * Internal descriptor for changeset identification
     *
     * @private
     * @property __changeset__
     * @type {String}
     */
    __changeset__: CHANGESET,

    content: Ember.computed.alias(CONTENT),

    changes: objectToArray(CHANGES, false),
    errors: objectToArray(ERRORS, true),
    change: readOnly(CHANGES),
    error: readOnly(ERRORS),
    executed: false,

    subChangesets: Ember.computed('changes', function() {
      let c = this.get('changes');
      let out = Ember.A();

      c.forEach((item) => {
        if(isChangeset(item.value)){
          out.pushObject(item.value);
        }else if(Ember.typeOf(item.value.forEach) === 'function'){
          item.value.forEach((iitem) => {
            if(isChangeset(iitem)){
              out.pushObject(iitem);
            }
          });
        }
      });

      return out;
    }),

    isValid: isEmptyObject(ERRORS),
    isPristine: isEmptyObject(CHANGES),
    isInvalid: not('isValid').readOnly(),
    isDirty: not('isPristine').readOnly(),

    isAllValid: Ember.computed('isValid', 'subChangesets.@each.isAllValid', function() {
      if(!this.get('isValid')){
        return false;
      }
      return this.get('subChangesets').isEvery('isAllValid', true);
    }),

    isAllPristine: Ember.computed('isPristine', 'subChangesets.@each.isAllPristine', function() {
      if(!this.get('isPristine')){
        return false;
      }
      return this.get('subChangesets').isEvery('isAllPristine', true);
    }),

    isAllInvalid: not('isAllValid').readOnly(),
    isSomeDirty: not('isAllPristine').readOnly(),



    init() {
      this._super(...arguments);
      this[CONTENT] = obj;
      this[CHANGES] = {};
      this[ERRORS] = {};
      this[VALIDATOR] = validateFn;
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
      return this._validateAndSet(key, value);
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
      if (get(this, 'isAllValid') && get(this, 'isSomeDirty') && !get(this, 'executed')) { //TODO what happens when after execution something gets changed befor a rollback happens
        set(this, 'executed', true);
        let content = get(this, CONTENT);
        if(typeOf(content.createRecordFromChangeSet) === 'function'){
          content = content.createRecordFromChangeSet();
          set(this, CONTENT, content);
        }
        let changes = get(this, CHANGES);
        let changesA = this.get('changes');
        changesA.forEach((item) => {
          if(isChangeset(item.value)){
            item.value.execute();
            set(changes, item.key, item.value.get('content'));
          }else if(Ember.typeOf(item.value.forEach) === 'function'){
            let itemMapped = item.value.map((iitem) => {
              if(isChangeset(iitem)){
                iitem.execute();
                return iitem.get('content');
              }else{
                return iitem;
              }
            });
            set(changes, item.key, itemMapped);
          }
        });
        setProperties(content, changes);
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
      //TODO same ifs as in execute here?
      let content = get(this, CONTENT);
      let savePromise = resolve(this);

      this.execute();

      let promises = this.get('subChangesets').invoke('save', options); //TODO Test and return Hash of all promises

      if (typeOf(content.save) === 'function') {
        savePromise = content.save(options);
      }

      let mainPromis = savePromise.then((result) => {
        this.rollback();
        return result;
      });

      if(promises.length > 0){
        promises.pushObject(mainPromis);
        return allSettled(promises);
      }else {
        return mainPromis;
      }


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
      this._notifyVirtualProperties();
      set(this, CHANGES, {});
      set(this, ERRORS, {});
      set(this, 'executed', false);

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
      let newChangeset = new Changeset(content, get(this, VALIDATOR));
      let newErrors = objectWithout(keys(changesB), errorsA);
      let newChanges = objectWithout(keys(errorsB), changesA);
      let mergedChanges = pureAssign(newChanges, changesB);
      let mergedErrors = pureAssign(newErrors, errorsB);

      newChangeset[CHANGES] = mergedChanges;
      newChangeset[ERRORS] = mergedErrors;
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
            return this._validateAndSet(validationKey, this._valueFor(validationKey));
          });

        return all(maybePromise);
      }

      return resolve(this._validateAndSet(key, this._valueFor(key)));
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

      return set(errors, key, options);
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
      let oldValue = null;
      if(typeOf(content.createRecordFromChangeSet) !== 'function'){
          oldValue =  get(content, key);
      }
      let validation = this._validate(key, value, oldValue);

      if (isPromise(validation)) {
        return validation.then((resolvedValidation) => {
          return this._setProperty(resolvedValidation, { key, value, oldValue });
        });
      }

      return this._setProperty(validation, { key, value, oldValue });
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

      if (validation === true || isSingleValidationArray) {
        this._deleteKey(ERRORS, key);

        if (!isEqual(oldValue, value)) {
          set(changes, key, value);
        } else if (obj.hasOwnProperty(key)) {
          delete changes[key];
        }
        this.notifyPropertyChange(CHANGES);
        this.notifyPropertyChange(key);

        return value;
      }

      return this.addError(key, { value, validation });
    },

    /**
     * Value for change or the original value.
     *
     * @private
     * @param  {String} key
     * @return {Any}
     */
    _valueFor(key) {
      let changes = get(this, CHANGES);
      let errors = get(this, ERRORS);
      let content = get(this, CONTENT);

      if (errors.hasOwnProperty(key)) {
        return get(errors, `${key}.value`);
      }

      if (changes.hasOwnProperty(key)) {
        return get(changes, key);
      }

      if(typeOf(content.createRecordFromChangeSet) === 'function'){
        return null;
      }

      return get(content, key);
    },

    /**
     * Notifies all virtual properties set on the changeset of a change.
     *
     * @private
     * @return {Void}
     */
    _notifyVirtualProperties() {
      let rollbackKeys = [...keys(get(this, CHANGES)), ...keys(get(this, ERRORS))];

      for (let i = 0; i < rollbackKeys.length; i++) {
        this.notifyPropertyChange(rollbackKeys[i]);
      }
    },

    /**
     * Deletes a key off an object and notifies observers.
     *
     * @private
     * @param  {String} objName
     * @param  {String} key
     * @return {Void}
     */
    _deleteKey(objName, key) {
      let obj = get(this, objName);

      if (isNone(obj)) {
        return;
      }

      if (obj.hasOwnProperty(key)) {
        delete obj[key];
        this.notifyPropertyChange(`${objName}.${key}`);
        this.notifyPropertyChange(objName);
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


/**
 * Creates new newedmodel.
 *
 * @param  {String} modelName
 * @param  {Object} store
 * @return {Ember.Object}
 */
export function newedmodel(modelName, store) {
  assert('Model name is missing', isPresent(modelName));
  assert('Store name is missing', isPresent(store));

  return EmberObject.extend({

    init() {
      this._super(...arguments);
      this[MODELNAME] = modelName;
      this[STORE] = store;
    },

    /**
     * Create the record
     *
     * @private
     * @param  {Object} args
     * @return {Object}
     */
    createRecordFromChangeSet(args=[]) {
      return get(this, STORE).createRecord(get(this, MODELNAME), args);
    }
  });
}

export class NewEDModel {
  /**
   * NewEdModel factory
   *
   * @class NewEDModel
   * @constructor
   */
  constructor() {
    return newedmodel(...arguments).create();
  }
}
