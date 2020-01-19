import Helper from '@ember/component/helper';
import { IChangeset } from 'ember-changeset/types';

export default class ChangesetGet extends Helper.extend() {
  compute(this: ChangesetGet, [changeset, fieldPath]: [IChangeset, string]) {
    return changeset.get(fieldPath);
  }
}
