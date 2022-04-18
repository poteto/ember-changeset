import { assert } from '@ember/debug';
import { dependentKeyCompat } from '@ember/object/compat';
import { ValidationChangeset, getKeyValues } from 'validated-changeset';
import ArrayProxy from '@ember/array/proxy';
import ObjectProxy from '@ember/object/proxy';
import { notifyPropertyChange } from '@ember/object';
import mergeDeep from './utils/merge-deep';
import isObject from './utils/is-object';
import { tracked } from '@glimmer/tracking';
import { get as safeGet, set as safeSet } from '@ember/object';
import { macroCondition, dependencySatisfies, importSync } from '@embroider/macros';

const CHANGES = '_changes';
const PREVIOUS_CONTENT = '_previousContent';
const CONTENT = '_content';

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

let Model;
if (macroCondition(dependencySatisfies('ember-data', '*'))) {
  Model = importSync('@ember-data/model').default;
}

export class EmberValidationChangeset extends ValidationChangeset {
  @tracked _changes;
  @tracked _errors;
  @tracked _content;

  isObject = isObject;

  maybeUnwrapProxy = maybeUnwrapProxy;

  // DO NOT override setDeep. Ember.set does not work wth empty hash and nested
  // key Ember.set({}, 'user.name', 'foo');
  // override base class
  // DO NOT override setDeep. Ember.set does not work with Ember.set({}, 'user.name', 'foo');
  getDeep = safeGet;
  mergeDeep = mergeDeep;

  safeGet(obj, key) {
    if (Model && obj.relationshipFor?.(key)?.meta?.kind == 'belongsTo') {
      return obj.belongsTo(key).value();
    }
    return safeGet(obj, key);
  }
  safeSet(obj, key, value) {
    return safeSet(obj, key, value);
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

    notifyPropertyChange(this, key);
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

    notifyPropertyChange(this, key);

    return { value, validation };
  }

  /**
   * Sets property or error on the changeset.
   * Returns value or error
   */
  _setProperty({ key, value, oldValue }) {
    super._setProperty({ key, value, oldValue });

    notifyPropertyChange(this, key);
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

    (keys || []).forEach((key) => notifyPropertyChange(this, key));

    return;
  }

  /**
   * Deletes a key off an object and notifies observers.
   */
  _deleteKey(objName, key = '') {
    const result = super._deleteKey(objName, key);

    notifyPropertyChange(this, key);

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
      oldContent = buildOldValues(content, getKeyValues(changes), this.getDeep);

      // we want mutation on original object
      // @tracked
      this[CONTENT] = this.mergeDeep(content, changes, { safeGet, safeSet });
    }

    this[PREVIOUS_CONTENT] = oldContent;

    return this;
  }
}

/**
 * Creates new changesets.
 */
export function changeset(obj) {
  assert('Underlying object for changeset is missing', Boolean(obj));
  assert('Array is not a valid type to pass as the first argument to `changeset`', !Array.isArray(obj));

  const c = new EmberValidationChangeset(obj);
  return c;
}

/**
 * Creates new changesets.
 * @function Changeset
 */
export function Changeset(obj) {
  const c = changeset(obj);

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
