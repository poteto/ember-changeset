import { helper } from '@ember/component/helper';
import { IChangeset } from 'validated-changeset/types';
import isChangeset from 'validated-changeset/utils/is-changeset';

/**
 * This is a drop in replacement for the `mut` helper
 *
 * @method changesetSet
 * @param params
 */
export function changesetSet(
  [obj, path]: [IChangeset, string],
): Function | void {
  if (isChangeset(obj)) {
    return (value: any) => {
      return obj.set(path, value);
    }
  }
}

export default helper(changesetSet);
