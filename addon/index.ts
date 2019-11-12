import { assert } from '@ember/debug';
import { BufferedChangeset } from './-private/validated-changeset';
import EmberObject from '@ember/object';
import {
  Config,
  IErr,
  IChangeset,
  NewProperty,
  ValidatorAction,
  ValidatorMap,
  ValidationErr,
} from 'ember-changeset/types';

const CHANGES = '_changes';
const ERRORS = '_errors';
const defaultValidatorFn = () => true;

class EmberChangeset extends BufferedChangeset {
  notifyPropertyChange(arg: any) {
    return arg;
  }

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
    super.addError(key, error);

    this.notifyPropertyChange(ERRORS);
    // Notify that `key` has changed.
    this.notifyPropertyChange(key);

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

    this.notifyPropertyChange(ERRORS);
    this.notifyPropertyChange((<string>key));

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
    this.notifyPropertyChange(CHANGES);
    this.notifyPropertyChange(key);
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
  ): void {
    super._notifyVirtualProperties(keys);

    (keys || []).forEach(key => this.notifyPropertyChange(key));
  }

  /**
   * Deletes a key off an object and notifies observers.
   */
  _deleteKey(
    objName: string,
    key = ''
  ): void {
    super._deleteKey(objName, key);

    this.notifyPropertyChange(`${objName}.${key}`);
    this.notifyPropertyChange(objName);
  }
}

applyMixins(EmberChangeset, [EmberObject]);

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
        const res = targetBuffer.getProperty(key.toString());
        return res;
      },

      set(targetBuffer, key, value/*, receiver*/) {
        targetBuffer.setProperty(key.toString(), value);
        return true;
      }
    });
  }
}

function applyMixins(derivedCtor: any, baseCtors: any[]) {
  baseCtors.forEach(baseCtor => {
      Object.getOwnPropertyNames(baseCtor.prototype).filter(i => i !== 'constructor').forEach(name => {
          Object.defineProperty(
            derivedCtor.prototype,
            name,
            Object.getOwnPropertyDescriptor(baseCtor.prototype, name)
          );
      });
  });
}
