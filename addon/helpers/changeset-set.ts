import { helper } from '@ember/component/helper';
import isChangeset from 'ember-changeset/utils/is-changeset';
import { ChangesetDef } from 'ember-changeset/types';

/**
 * This is a drop in replacement for the `mut` helper
 *
 * @method changesetSet
 * @param params
 */
export function changesetSet(
  [obj, path]: [ChangesetDef, string],
): Function | void {
  if (isChangeset(obj)) {
    return (value: any) => {
      return obj.set(path, value);
    }
  }
}

export default helper(changesetSet);