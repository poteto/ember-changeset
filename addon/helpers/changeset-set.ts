import { helper } from '@ember/component/helper';
import { isChangeset, Types } from 'validated-changeset';

/**
 * This is a drop in replacement for the `mut` helper
 *
 * @method changesetSet
 * @param params
 */
export function changesetSet(
  [obj, path]: [Types.IChangeset, string],
): Function | void {
  if (isChangeset(obj)) {
    return (value: any) => {
      return obj.set(path, value);
    }
  }
}

export default helper(changesetSet);
