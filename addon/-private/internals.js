import Ember from 'ember';

const { get } = Ember;

export const CHANGESET = Symbol('changeset');

export function isChangeset(changeset) {
  return get(changeset, '__changeset__') === CHANGESET;
}
