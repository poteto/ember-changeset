import Ember from 'ember';
import Changeset from 'ember-changeset';
import { isChangeset } from 'ember-changeset/-private/internals';

const { Helper: { helper } } = Ember;

export function changeset([obj, validations], options = {}) {
  if (isChangeset(obj)) {
    return obj;
  }

  return new Changeset(obj, validations, {}, options);
}

export default helper(changeset);
