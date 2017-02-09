import Ember from 'ember';

const { get } = Ember;

export const CHANGESET = '__CHANGESET__';

export default function isChangeset(changeset) {
  return get(changeset, '__changeset__') === CHANGESET;
}
