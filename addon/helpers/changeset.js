import Ember from 'ember';
import Changeset from 'ember-changeset';

const { Helper: { helper } } = Ember;

export function changeset([model, validations]) {
  return new Changeset(model, validations);
}

export default helper(changeset);
