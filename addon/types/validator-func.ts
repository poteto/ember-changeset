import { ValidationResult } from 'ember-changeset/types/validation-result';

export type ValidatorFunc = {
  (params: {
    key: string,
    newValue: unknown,
    oldValue: unknown,
    changes: { [key: string]: unknown },
    content: object
  }): ValidationResult | Promise<ValidationResult>;
}

export type ValidatorMap = { [s: string]: ValidatorFunc | ValidatorFunc[] };
