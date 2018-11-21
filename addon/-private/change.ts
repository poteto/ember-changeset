import { IChange } from 'ember-changeset/types';

export default class Change implements IChange {
  value: number;

  constructor(value: number) {
    this.value = value;
  }
}
