import IEvented, { INotifier } from 'ember-changeset/types/evented';
import {
  ValidationErr,
  ValidationResult,
} from 'ember-changeset/types/validation-result';
import { ValidatorAction, ValidatorMapFunc, ValidatorMap } from 'ember-changeset/types/validator-action';

export { IEvented, INotifier };
export { ValidatorAction, ValidatorMapFunc, ValidatorMap };
export { ValidationErr, ValidationResult };
import { Config } from 'ember-changeset/types/config';
export { Config };

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

export type PublicErrors = { key: string; value: any; validation: ValidationErr | ValidationErr[] }[];

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

export type PrepareChangesFn = (obj: ({ [s: string]: any })) => ({ [s: string]: any })

export interface ChangesetDef {
  __changeset__: string,

  _content: object,
  _changes: Changes,
  _errors: Errors<any>,
  _validator: ValidatorAction,
  _options: Config,
  _runningValidations: RunningValidations,
  _bareChanges: { [s: string]: any },

  changes: Record<string, any>[],
  errors: PublicErrors,
  error: object,
  change: object,
  data: object,

  isValid: boolean,
  isPristine: boolean,
  isInvalid: boolean,
  isDirty: boolean,

  get: (key: string) => any,
  set: <T>(key: string, value: T) => (void | T | IErr<T> | Promise<T> | Promise<ValidationResult | T | IErr<T>> | ValidationResult),
  getDeep: any;
  setDeep: any;
  safeGet: (obj: any, key: string) => any,
  prepare(preparedChangedFn: PrepareChangesFn): ChangesetDef,
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
  _notifyVirtualProperties: (keys?: string[]) => string[] | undefined,
  _rollbackKeys: () => Array<string>,
  _deleteKey: (objName: InternalMapKey, key: string) => InternalMap
};

export interface IChangeset extends ChangesetDef, IEvented {}
