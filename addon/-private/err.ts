import { IErr, ValidationErr } from 'ember-changeset/types';

export default class Err implements IErr {
  value: any;
  validation: ValidationErr;

  constructor(value: any, validation: ValidationErr) {
    this.value = value;
    this.validation = validation;
  }
}
