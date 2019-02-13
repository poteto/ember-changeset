import {
  ValidationErr,
  ValidationResult,
} from 'ember-changeset/types/validation-result';
import { ValidatorFunc } from 'ember-changeset/types/validator-func';

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

export interface IErr<T> {
  value: T,
  validation: ValidationErr | ValidationErr[]
}

export type Errors<T> = {
  [s: string]: IErr<T>
};

export type RunningValidations = {
  [s: string]: number
};

export type InternalMap =
  | Changes
  | Errors<any>
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
  errors:  { [s: string]: IErr<any> },
};

export type Inflated<T> = {
  [s: string]: Inflated<T> | T,
};

export type PrepareChangesFn = (obj: ({ [s: string]: any })) => ({ [s: string]: any })

interface Any {
  [s: string]: any
}

export interface ChangesetDef extends Any {
  __changeset__: '__CHANGESET__',

  _content: object,
  _changes: Changes,
  _errors: Errors<any>,
  _validator: ValidatorFunc,
  _options: Config,
  _runningValidations: RunningValidations,
  _bareChanges: { [s: string]: any },

  changes: ComputedProperty<object[], object[]>,
  errors: ComputedProperty<object[], object[]>,
  change: Inflated<any>,
  error: Inflated<IErr<any>>,
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
  setUnknownProperty: <T>(key: string, value: T) => (T | IErr<T> | Promise<T> | Promise<ValidationResult | T | IErr<T>> | ValidationResult),
  get: (key: string) => any,
  set: <T>(key: string, value: T) => (void | T | IErr<T> | Promise<T> | Promise<ValidationResult | T | IErr<T>> | ValidationResult),
  toString: () => string,
  prepare: PrepareChangesFn,
  execute: () => ChangesetDef,
  save: (options: object) => Promise<ChangesetDef | any>,
  merge: (changeset: ChangesetDef) => ChangesetDef,
  rollback: () => ChangesetDef,
  rollbackInvalid: (key: string | void) => ChangesetDef,
  rollbackProperty: (key: string) => ChangesetDef,
  validate: (key: string | void) => (Promise<null> | Promise<any | IErr<any>> | Promise<Array<any | IErr<any>>>),
  addError: <T>(key: string, error: IErr<T> | ValidationErr) => IErr<T> | ValidationErr,
  pushErrors: (key: string, newErrors: string[]) => IErr<any>,
  snapshot: () => Snapshot,
  restore: (obj: Snapshot) => ChangesetDef,
  cast: (allowed: Array<string>) => ChangesetDef,
  isValidating: (key: string | void) => boolean,
  _validate: (key: string, newValue: any, oldValue: any) => (ValidationResult | Promise<ValidationResult>),
  _setProperty: <T>(obj: NewProperty<T>) => void,
  _setIsValidating: (key: string, value: boolean) => void,
  _valueFor: (s: string) => any,
  _notifyVirtualProperties: (keys?: string[]) => void,
  _rollbackKeys: () => Array<string>,
  _deleteKey: (objName: InternalMapKey, key: string) => void
};
