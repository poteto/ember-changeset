import Helper from '@ember/component/helper';
import { observer } from '@ember/object';
import { ChangesetDef } from 'ember-changeset/types';

const CONTENT = '_content';
const CHANGES = '_changes';

export default class ChangesetGet extends Helper.extend({
  invalidate: observer(`changeset.${CONTENT}`, `changeset.${CHANGES}`, function(
    this: ChangesetGet
  ) {
    this.recompute();
  })
}) {
  changeset: ChangesetDef | null = null;

  compute(this: ChangesetGet, [changeset, fieldPath]: [ChangesetDef, string]) {
    if (this.changeset === null) {
      this.set('changeset', changeset);
    }

    if (!this.changeset) {
      return;
    }

    return this.changeset.get(fieldPath);
  }
}
