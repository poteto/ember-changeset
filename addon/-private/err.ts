import { ValidationErr } from 'ember-changeset/types/validation-result';

export default class Err {
  value: any;
  validation: ValidationErr;

  constructor(value: any, validation: ValidationErr) {
    this.value = value;
    this.validation = validation;
  }
}
