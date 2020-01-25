import { helper } from '@ember/component/helper';

export function changesetGet([changeset, fieldPath]) {
  return changeset.get(fieldPath);
}

export default helper(changesetGet);
