import { IErr, ValidationErr } from 'ember-changeset/types';

export default class Err implements IErr<any> {
  value: any;
  validation: ValidationErr | ValidationErr[];

  constructor(value: any, validation: ValidationErr | ValidationErr[]) {
    this.value = value;
    this.validation = validation;
  }
}
