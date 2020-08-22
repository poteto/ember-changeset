import { helper } from '@ember/component/helper';
import { isChangeset } from 'validated-changeset';

/**
 * This is a drop in replacement for the `mut` helper
 *
 * @method changesetSet
 * @param params
 */
export function changesetSet([obj, path]) {
  if (isChangeset(obj)) {
    return (value) => {
      return obj.set(path, value);
    };
  }
}

export default helper(changesetSet);
