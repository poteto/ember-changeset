import { IChange } from 'ember-changeset/types';

export default class Change implements IChange {
  value: any;

  constructor(value: any) {
    this.value = value;
  }
}
