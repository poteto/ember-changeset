import { assert } from '@ember/debug';
import { dependentKeyCompat } from '@ember/object/compat';
import { BufferedChangeset, Change, keyInObject } from 'validated-changeset';
import ArrayProxy from '@ember/array/proxy';
import ObjectProxy from '@ember/object/proxy';
import { notifyPropertyChange } from '@ember/object';
import mergeDeep from './utils/merge-deep';
import isObject from './utils/is-object';
import { tracked } from 'tracked-built-ins';
import { get as safeGet, set as safeSet } from '@ember/object';
import { addObserver, removeObserver } from '@ember/object/observers';

const CHANGES = '_changes';
const PREVIOUS_CONTENT = '_previousContent';
const CONTENT = '_content';
const VIRTUAL_MIRROR = '_virtualMirror';
const defaultValidatorFn = () => true;

export function buildOldValues(content, changes, getDeep) {
  const obj = Object.create(null);

  for (let change of changes) {
    obj[change.key] = getDeep(content, change.key);
  }

  return obj;
}

function isProxy(o) {
  return !!(o && (o instanceof ObjectProxy || o instanceof ArrayProxy));
}

function maybeUnwrapProxy(o) {
  return isProxy(o) ? maybeUnwrapProxy(safeGet(o, 'content')) : o;
}

function deepNotifyPropertyChange(changeset, path) {
  let paths = path.split('.');
  let maybeDynamicPathToNotify = null,
    lastPath = paths.pop(),
    current = changeset,
    i;

  for (i = 0; i < paths.length; ++i) {
    if (Object.prototype.hasOwnProperty.call(current, paths[i])) {
      current = safeGet(current, paths[i]);
    } else {
      maybeDynamicPathToNotify = paths[i];
      break;
    }
  }
  const pathToNotify = maybeDynamicPathToNotify ? maybeDynamicPathToNotify : lastPath;
  notifyPropertyChange(current, pathToNotify);
}

function deepHasOwnProperty(obj, path) {
  if (!path) {
    return false;
  }

  let paths = path.split('.'),
    current = obj,
    i;

  for (i = 0; i < paths.length; ++i) {
    if (!current || !Object.prototype.hasOwnProperty.call(current, paths[i])) {
      return false;
    } else {
      current = current[paths[i]];
    }
  }

  return true;
}

function deepAddObserver(obj, path, callback) {
  let paths = path.split('.');
  let lastPath = paths.pop(),
    current = obj,
    i;
  for (i = 0; i < paths.length; ++i) {
    if (Object.prototype.hasOwnProperty.call(current, paths[i])) {
      current = safeGet(current, paths[i]);
    } else {
      throw new Error('You cant add an observer to an undefined obj');
    }
  }
  addObserver(current, lastPath, callback);
}

function deepRemoveObserver(obj, path, callback) {
  let paths = path.split('.');
  let lastPath = paths.pop(),
    current = obj,
    i;
  for (i = 0; i < paths.length; ++i) {
    if (Object.prototype.hasOwnProperty.call(current, paths[i])) {
      current = safeGet(current, paths[i]);
    } else {
      throw new Error('You cant add an observer to an undefined obj');
    }
  }
  removeObserver(current, lastPath, callback);
}

export class EmberChangeset extends BufferedChangeset {
  @tracked _changes;
  @tracked _errors;
  @tracked _content;
  @tracked _virtualMirror = {};

  isObject = isObject;

  maybeUnwrapProxy = maybeUnwrapProxy;

  // DO NOT override setDeep. Ember.set does not work wth empty hash and nested
  // key Ember.set({}, 'user.name', 'foo');
  // override base class
  // DO NOT override setDeep. Ember.set does not work with Ember.set({}, 'user.name', 'foo');
  getDeep = safeGet;
  mergeDeep = mergeDeep;

  // override base class
  safeGet(obj, key) {
    return safeGet(obj, key);
  }
  safeSet(obj, key, value) {
    return safeSet(obj, key, value);
  }

  @dependentKeyCompat
  get mirror() {
    return this[VIRTUAL_MIRROR];
  }

  /**
   * @property isValid
   * @type {Array}
   */
  @dependentKeyCompat
  get isValid() {
    return super.isValid;
  }

  /**
   * @property isInvalid
   * @type {Boolean}
   */
  @dependentKeyCompat
  get isInvalid() {
    return super.isInvalid;
  }

  /**
   * @property isPristine
   * @type {Boolean}
   */
  @dependentKeyCompat
  get isPristine() {
    return super.isPristine;
  }

  /**
   * @property isDirty
   * @type {Boolean}
   */
  @dependentKeyCompat
  get isDirty() {
    return super.isDirty;
  }

  get pendingData() {
    let content = this[CONTENT];
    let changes = this[CHANGES];

    let pendingChanges = this.mergeDeep(Object.create(Object.getPrototypeOf(content)), content, { safeGet, safeSet });

    return this.mergeDeep(pendingChanges, changes, { safeGet, safeSet });
  }

  /**
   * Manually add an error to the changeset. If there is an existing
   * error or change for `key`, it will be overwritten.
   *
   * @method addError
   */
  addError(key, error) {
    super.addError(key, error);

    deepNotifyPropertyChange(this, key);
    // Return passed-in `error`.
    return error;
  }

  /**
   * Manually push multiple errors to the changeset as an array.
   *
   * @method pushErrors
   */
  pushErrors(key, ...newErrors) {
    const { value, validation } = super.pushErrors(key, ...newErrors);

    deepNotifyPropertyChange(this, key);

    return { value, validation };
  }

  /**
   * Sets property or error on the changeset.
   * Returns value or error
   */
  _setProperty({ key, value, oldValue }) {
    let changes = this[CHANGES];
    let mirror = this[VIRTUAL_MIRROR];

    this.setDeep(mirror, key, true, {
      safeSet: this.safeSet,
    });

    //We always set
    this.setDeep(changes, key, new Change(value), {
      safeSet: this.safeSet,
    });

    //If the newValue is equals to the wrapped value, delete key from changes
    if (oldValue === value && keyInObject(changes, key)) {
      this._deleteKey(CHANGES, key);
    }

    //Notitify deep
    deepNotifyPropertyChange(this[VIRTUAL_MIRROR], key);
    notifyPropertyChange(this, 'changes');
  }

  /**
   * Notifies virtual properties set on the changeset of a change.
   * You can specify which keys are notified by passing in an array.
   *
   * @private
   * @param {Array} keys
   * @return {Void}
   */
  _notifyVirtualProperties(keys) {
    keys = super._notifyVirtualProperties(keys);

    (keys || []).forEach((key) => deepNotifyPropertyChange(this[VIRTUAL_MIRROR], key));

    return;
  }

  /**
   * Deletes a key off an object and notifies observers.
   */
  _deleteKey(objName, key = '') {
    const result = super._deleteKey(objName, key);
    deepNotifyPropertyChange(this[VIRTUAL_MIRROR], key);
    return result;
  }

  /**
   * Executes the changeset if in a valid state.
   *
   * @method execute
   */
  execute() {
    let oldContent;
    if (this.isValid && this.isDirty) {
      let content = this[CONTENT];
      let changes = this[CHANGES];

      // keep old values in case of error and we want to rollback
      oldContent = buildOldValues(content, this.changes, this.getDeep);

      // we want mutation on original object
      // @tracked
      this[CONTENT] = this.mergeDeep(content, changes, { safeGet, safeSet });
    }

    this[PREVIOUS_CONTENT] = oldContent;

    return this;
  }

  get(key) {
    safeGet(this[VIRTUAL_MIRROR], key); //consume tag for native tracked dependencies
    return super.get(...arguments);
  }

  addObserver(key, callback) {
    if (!deepHasOwnProperty(this[VIRTUAL_MIRROR], key)) {
      this.setDeep(this[VIRTUAL_MIRROR], key);
    }

    deepAddObserver(this[VIRTUAL_MIRROR], key, callback);
  }

  removeObserver(key, callback) {
    if (!deepHasOwnProperty(this[VIRTUAL_MIRROR], key)) {
      this.setDeep(this[VIRTUAL_MIRROR], key);
    }
    deepRemoveObserver(this[VIRTUAL_MIRROR], key, callback);
  }
}

/**
 * Creates new changesets.
 */
export function changeset(obj, validateFn = defaultValidatorFn, validationMap = {}, options = {}) {
  assert('Underlying object for changeset is missing', Boolean(obj));
  assert('Array is not a valid type to pass as the first argument to `changeset`', !Array.isArray(obj));

  if (options.changeset) {
    return new options.changeset(obj, validateFn, validationMap, options);
  }

  const c = new EmberChangeset(obj, validateFn, validationMap, options);
  return c;
}

/**
 * Creates new changesets.
 * @function Changeset
 */
export function Changeset(obj, validateFn = defaultValidatorFn, validationMap = {}, options = {}) {
  const c = changeset(obj, validateFn, validationMap, options);

  return new Proxy(c, {
    get(targetBuffer, key /*, receiver*/) {
      const res = targetBuffer.get(key.toString());
      return res;
    },

    set(targetBuffer, key, value /*, receiver*/) {
      targetBuffer.set(key.toString(), value);
      return true;
    },
  });
}

export default class ChangesetKlass {
  /**
   * Changeset factory
   * TODO: deprecate in favor of factory function
   *
   * @class ChangesetKlass
   * @constructor
   */
  constructor(obj, validateFn = defaultValidatorFn, validationMap = {}, options = {}) {
    const c = changeset(obj, validateFn, validationMap, options);

    return new Proxy(c, {
      get(targetBuffer, key /*, receiver*/) {
        const res = targetBuffer.get(key.toString());
        return res;
      },

      set(targetBuffer, key, value /*, receiver*/) {
        targetBuffer.set(key.toString(), value);
        return true;
      },
    });
  }
}
