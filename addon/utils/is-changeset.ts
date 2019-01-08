import { get } from '@ember/object';

export const CHANGESET = '__CHANGESET__';

export default function isChangeset(changeset: any): boolean {
  return get(changeset, '__changeset__') === CHANGESET;
}
