import { assert } from '@ember/debug';
import { BufferedChangeset } from './-private/validated-changeset';
import { notifyPropertyChange } from '@ember/object';
import { tracked } from '@glimmer/tracking';
import { get as safeGet, set as safeSet } from '@ember/object';
import mergeDeep from 'ember-changeset/utils/merge-deep';
import {
  Config,
  Changes,
  Content,
  Errors,
  IErr,
  IChangeset,
  InternalMap,
  NewProperty,
  ValidatorAction,
  ValidatorMap,
  ValidationErr,
} from 'ember-changeset/types';

const CHANGES = '_changes';
const ERRORS = '_errors';
const CONTENT = '_content';
const defaultValidatorFn = () => true;

class EmberChangeset extends BufferedChangeset {
  @tracked
  '_changes': Changes;
  @tracked
  '_errors': Errors<any>;
  @tracked
  '_content': object;

  getDeep = safeGet as any;

  safeGet(obj: any, key: string) {
    return safeGet(obj, key);
  }

  /**
   * Manually add an error to the changeset. If there is an existing
   * error or change for `key`, it will be overwritten.
   *
   * @method addError
   */
  addError<T>(key: string, error: IErr<T>): IErr<T>
  addError(key: string, error: ValidationErr): ValidationErr
  addError<T>(key: string, error: IErr<T> | ValidationErr) {
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
  pushErrors(
    key: keyof IChangeset,
    ...newErrors: string[] | ValidationErr[]
  ) {
    const { value, validation } = super.pushErrors(key, ...newErrors);

    notifyPropertyChange(this, ERRORS);
    notifyPropertyChange(this, (<string>key));

    return { value, validation };
  }

  /**
   * Sets property or error on the changeset.
   * Returns value or error
   */
  _setProperty<T> (
    { key, value, oldValue }: NewProperty<T>
  ): void {
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
  _notifyVirtualProperties(
    keys?: string[]
  ): string[] | undefined {
    keys = super._notifyVirtualProperties(keys);

    (keys || []).forEach(key => notifyPropertyChange(this, key));

    return;
  }

  /**
   * Deletes a key off an object and notifies observers.
   */
  _deleteKey(
    objName: string,
    key = ''
  ): InternalMap {
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
  execute(): IChangeset {
    if (this.isValid && this.isDirty) {
      let content: Content = this[CONTENT];
      let changes: Changes = this[CHANGES];
      // we want mutation on original object
      // @tracked
      this[CONTENT] = mergeDeep(content, changes, { safeGet, safeSet });
    }

    return this;
  }
}

/**
 * Creates new changesets.
 */
export function changeset(
  obj: object,
  validateFn: ValidatorAction = defaultValidatorFn,
  validationMap: ValidatorMap = {},
  options: Config = {}
) {
  assert('Underlying object for changeset is missing', Boolean(obj));

  const c = new EmberChangeset(obj, validateFn, validationMap, options);

  return c;
}

export default class Changeset {
  /**
   * Changeset factory
   *
   * @class ValidatedChangeset
   * @constructor
   */
  constructor(
    obj: object,
    validateFn: ValidatorAction = defaultValidatorFn,
    validationMap: ValidatorMap = {},
    options: Config = {}
  ) {
    const c: IChangeset = changeset(obj, validateFn, validationMap, options);

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
