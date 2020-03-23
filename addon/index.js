import { assert } from '@ember/debug';
import { BufferedChangeset, normalizeObject, pureAssign } from 'validated-changeset';
import mergeDeep from './utils/merge-deep';
import isObject from './utils/is-object';
import { isBelongsToRelationship } from './utils/is-belongs-to-relationship';
import { notifyPropertyChange } from '@ember/object';
import { tracked } from '@glimmer/tracking';
import { get as safeGet, set as safeSet } from '@ember/object';

const CHANGES = '_changes';
const ERRORS = '_errors';
const CONTENT = '_content';
const defaultValidatorFn = () => true;

export class EmberChangeset extends BufferedChangeset {
  @tracked '_changes';
  @tracked '_errors';
  @tracked '_content';

  getDeep = safeGet;

  safeGet(obj, key) {
    return safeGet(obj, key);
  }

  /**
   * Manually add an error to the changeset. If there is an existing
   * error or change for `key`, it will be overwritten.
   *
   * @method addError
   */
  addError(key, error) {
    super.addError(key, error);

    notifyPropertyChange(this, ERRORS);
    // Notify that `key` has changed.
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

    notifyPropertyChange(this, ERRORS);
    notifyPropertyChange(this, key);

    return { value, validation };
  }

  /**
   * Sets property or error on the changeset.
   * Returns value or error
   */
  _setProperty({ key, value, oldValue }) {
    super._setProperty({ key, value, oldValue })

    // Happy path: notify that `key` was added.
    notifyPropertyChange(this, CHANGES);
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

    (keys || []).forEach(key => notifyPropertyChange(this, key));

    return;
  }

  /**
   * Deletes a key off an object and notifies observers.
   */
  _deleteKey(objName, key = '') {
    const result = super._deleteKey(objName, key);

    notifyPropertyChange(this, `${objName}.${key}`);
    notifyPropertyChange(this, objName);

    return result;
  }

  /**
   * Executes the changeset if in a valid state.
   *
   * @method execute
   */
  execute() {
    if (this.isValid && this.isDirty) {
      let content = this[CONTENT];
      let changes = this[CHANGES];
      // we want mutation on original object
      // @tracked
      this[CONTENT] = mergeDeep(content, changes, { safeGet, safeSet });
    }

    return this;
  }

  /**
   * Proxied getter
   * TODO: Evaluate Ember Data particularities here and see how we can use
   * base class `get`
   *
   * @method get
   */
  get(key) {
    // 'person'
    // 'person.username'
    let [baseKey, ...remaining] = key.split('.');

    // 1. lets first check CHANGES
    if (Object.prototype.hasOwnProperty.call(this[CHANGES], baseKey)) {
      let changes = this[CHANGES];
      let result;

      if (remaining.length > 0) {
        let c = changes[baseKey];
        result = this.getDeep(normalizeObject(c), remaining.join('.'));
        if (typeof result !== 'undefined') {
          return result;
        }
      } else {
        result = changes[baseKey];
      }

      if ((result !== undefined && result !== null) && isObject(result)) {
        result = normalizeObject(result);
        let content = this[CONTENT];

        // Merge the content with the changes to have a complete object for a nested property.
        // Given a object with nested property and multiple properties inside of it, if the
        // requested key is the top most nested property and we have changes in of the properties, we need to
        // merge the original model data with the changes to have the complete object.
        // eg. model = { user: { name: 'not changed', email: 'changed@prop.com'} }
        if (
          !Array.isArray(result) &&
          isObject(content[baseKey]) &&
          !isBelongsToRelationship(content[baseKey])
        ) {
          let data = {};
          Object.keys(content[baseKey]).forEach(k => {
            data[k] = this.getDeep(content, `${baseKey}.${k}`)
          })

          return pureAssign(data, result);
        }

        return result
      }

      if (result) {
        return result.value;
      }
    }


    // 2. return getters/setters/methods on BufferedProxy instance
    if (typeof this[key] !== 'undefined') {
      return this[key];
    } else if (this[baseKey]) {
      const v = this[baseKey];
      if (isObject(v)) {
        const result = this.getDeep(v, remaining.join('.'));
        return result;
      }
    }

    // 3. Lastly return on underlying object if previous cases dont apply
    const result = this.getDeep(this[CONTENT], key);
    return result;
  }
}

/**
 * Creates new changesets.
 */
export function changeset(
  obj,
  validateFn = defaultValidatorFn,
  validationMap = {},
  options = {}
) {
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
export function Changeset(
  obj,
  validateFn = defaultValidatorFn,
  validationMap = {},
  options = {}
) {
  const c = changeset(obj, validateFn, validationMap, options);

  return new Proxy(c, {
    get(targetBuffer, key/*, receiver*/) {
      const res = targetBuffer.get(key.toString());
      return res;
    },

    set(targetBuffer, key, value/*, receiver*/) {
      targetBuffer.set(key.toString(), value);
      return true;
    }
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
  constructor(
    obj,
    validateFn = defaultValidatorFn,
    validationMap = {},
    options = {}
  ) {
    const c = changeset(obj, validateFn, validationMap, options);

    return new Proxy(c, {
      get(targetBuffer, key/*, receiver*/) {
        const res = targetBuffer.get(key.toString());
        return res;
      },

      set(targetBuffer, key, value/*, receiver*/) {
        targetBuffer.set(key.toString(), value);
        return true;
      }
    });
  }
}
