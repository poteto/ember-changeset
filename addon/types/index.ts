
import { ValidatorFunc } from 'ember-changeset/types/validator-func';
import {
  ValidationResult,
  ValidationErr,
} from 'ember-changeset/types/validation-result';

export { ValidatorFunc };
export { ValidationErr, ValidationResult };
import { Config } from 'ember-changeset/types/config';
export { Config };

import ComputedProperty from '@ember/object/computed';

export interface IChange {
  value: any
}
export interface Changes {
  [s: string]: IChange
};

export interface Content {
  save?: Function | undefined,
  [key: string]: any
}

export interface IErr {
  value: any,
  validation: ValidationErr
}
export type Errors = {
  [s: string]: IErr
};
export type RunningValidations = {
  [s: string]: number
};

export type InternalMap =
  | Changes
  | Errors
  | RunningValidations;

export interface NewProperty<T> {
  key: string,
  value: T,
  oldValue?: any,
}

export type InternalMapKey =
  | '_changes'
  | '_errors'
  | '_runningValidations';

export type Snapshot = {
  changes: { [s: string]: any },
  errors:  { [s: string]: IErr },
};

export type Inflated<T> = {
  [s: string]: Inflated<T> | T,
};

export type PrepareChangesFn = (obj: ({ [s: string]: any })) => ({ [s: string]: any })

export interface ChangesetDef {
  __changeset__: '__CHANGESET__',

  _content: object,
  _changes: Changes,
  _errors: Errors,
  _validator: ValidatorFunc,
  _options: Config,
  _runningValidations: RunningValidations,
  _bareChanges: { [s: string]: any },

  changes: ComputedProperty<object[], object[]>,
  errors: ComputedProperty<object[], object[]>,
  change: Inflated<any>,
  error: Inflated<IErr>,
  data: object,

  isValid: ComputedProperty<boolean, boolean>,
  isPristine: ComputedProperty<boolean, boolean>,
  isInvalid: ComputedProperty<boolean, boolean>,
  isDirty: ComputedProperty<boolean, boolean>,

  _super: <T>(...args: Array<T>) => void,
  notifyPropertyChange: (s: string) => void,
  trigger: (k: string, v?: string | void) => void,
  init: () => void,
  unknownProperty: (s: string) => any,
  setUnknownProperty: <T>(key: string, value: T) => (T | IErr | Promise<T> | Promise<IErr>),
  toString: () => string,
  prepare: PrepareChangesFn,
  execute: () => ChangesetDef,
  save: (options: object) => Promise<ChangesetDef | any>,
  merge: (changeset: ChangesetDef) => ChangesetDef,
  rollback: () => ChangesetDef,
  rollbackInvalid: (key: string | void) => ChangesetDef,
  rollbackProperty: () => ChangesetDef,
  validate: (key: string | void) => (Promise<null> | Promise<any | IErr> | Promise<Array<any | IErr>>),
  addError: <T=(string | IErr)>(key: string, error: T) => T,
  pushErrors: (key: string, newErrors: string[]) => IErr,
  snapshot: () => Snapshot,
  restore: (obj: Snapshot) => ChangesetDef,
  cast: (allowed: Array<string>) => ChangesetDef,
  isValidating: (key: string | void) => boolean,
  _validateAndSet: <T>(key: string, value: T) => (Promise<T> | Promise<IErr> | T | IErr),
  _validate: (key: string, newValue: any, oldValue: any) => (ValidationResult | Promise<ValidationResult>),
  _setProperty: <T>(validation: ValidationResult, obj: NewProperty<T>) => (T | IErr),
  _setIsValidating: (key: string, value: boolean) => void,
  _valueFor: (s: string) => any,
  _notifyVirtualProperties: (keys?: string[]) => void,
  _rollbackKeys: () => Array<string>,
  _deleteKey: (objName: InternalMapKey, key: string) => void
};