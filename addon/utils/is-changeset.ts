export const CHANGESET = '__CHANGESET__';

export default function isChangeset(changeset: any): boolean {
  return changeset.get('__changeset__') === CHANGESET;
}
