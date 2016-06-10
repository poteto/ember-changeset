import Ember from 'ember';
import Changeset from 'ember-changeset';
import { isChangeset } from 'ember-changeset/-private/internals';

const { Helper: { helper } } = Ember;

export function changeset([obj, validations]) {
  if (isChangeset(obj)) {
    return obj;
  }

  return new Changeset(obj, validations);
}

export default helper(changeset);
