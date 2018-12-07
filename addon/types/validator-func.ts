import { ValidationResult } from 'ember-changeset/types/validation-result';

export type ValidatorFunc = {
  (params: {
    key: string,
    newValue: any,
    oldValue: any,
    changes: { [key: string]: any },
    content: object
  }): ValidationResult | Promise<ValidationResult>;
}
