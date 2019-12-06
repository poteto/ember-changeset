import { ValidationResult } from 'ember-changeset/types/validation-result';

export type ValidatorAction = {
  (params: {
    key: string,
    newValue: unknown,
    oldValue: unknown,
    changes: unknown,
    content: object
  }): ValidationResult | Promise<ValidationResult>;
}

export type ValidatorMapFunc = {
  (
    key: string,
    newValue: unknown,
    oldValue: unknown,
    changes: unknown,
    content: object
  ): ValidationResult | Promise<ValidationResult>;
}

export type ValidatorMap = { [s: string]: ValidatorMapFunc | ValidatorMapFunc[] };
