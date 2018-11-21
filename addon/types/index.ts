
import { ValidatorFunc } from 'ember-changeset/types/validator-func';
import {
  ValidationResult,
  ValidationErr,
} from 'ember-changeset/types/validation-result';

export { ValidatorFunc };
export { ValidationErr, ValidationResult };
import { Config } from 'ember-changeset/types/config';
export { Config };

export interface IChange {
  value: number
}
export type Changes = {
  [s: string]: IChange
};
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

export type NewProperty<T> = {
  key:       string,
  value:     T,
  oldValue?: any,
};

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


export interface ChangesetDef {
  _content:            object,
  _changes:            Changes,
  _errors:             Errors,
  _validator:          ValidatorFunc,
  _options:            Config,
  _runningValidations: RunningValidations,
  __changeset__:       '__CHANGESET__',
  _bareChanges:        { [s: string]: any },

  changes: Array<{ key: string }>,
  errors:  Array<{ key: string }>,
  change:  Inflated<any>,
  error:   Inflated<IErr>,
  data:    object,

  isValid:    boolean,
  isPristine: boolean,
  isInvalid:  boolean,
  isDirty:    boolean,

  _super: () => void,
  init: () => void,
  unknownProperty: (s: string) => any,
  _valueFor: (s: string, b: boolean) => any,
  toString: () => string,
  _deleteKey: (objName: InternalMapKey, key: string) => void,
  notifyPropertyChange: (s: string) => void,
  addError: <T: string | IErr(s: string, T) => T,
  _setProperty: <T>(ValidationResult, NewProperty<T>) => (T | IErr<T>),
  _validateAndSet: <T>(string, T) => (Promise<T> | Promise<IErr<T>> | T | IErr<T>),
  _setIsValidating: (string, boolean) => void,
  _validate: (string, any, any) => (ValidationResult | Promise<ValidationResult>),
  trigger: (string, string | void) => void,
  isValidating: (string | void) => boolean,
  cast: (Array<string>) => ChangesetDef,
  setUnknownProperty: <T>(string, T) => (T | IErr<T> | Promise<T> | Promise<IErr<T>>),
  prepare: (({ [string]: any }) => ({ [string]: any })) => ChangesetDef,
  execute: () => ChangesetDef,
  _notifyVirtualProperties: (?Array<string>) => void,
  _rollbackKeys: () => Array<string>,
  rollback: () => ChangesetDef,
  rollbackInvalid: (string | void) => ChangesetDef,
  rollbackProperty: () => ChangesetDef,
  save: (object) => Promise<ChangesetDef | any>,
  merge: (ChangesetDef) => ChangesetDef,
  validate: (string | void) => (Promise<null> | Promise<any | IErr<any>> | Promise<Array<any | IErr<any>>>),
  pushErrors: (string, ...string) => IErr<any>,
  snapshot: () => Snapshot,
  restore: (Snapshot) => ChangesetDef,
};
