// @flow

import Ember from 'ember';
import Changeset from 'ember-changeset';
import isChangeset from 'ember-changeset/utils/is-changeset';
import isPromise from 'ember-changeset/utils/is-promise';

/*::
import type { ValidatorFunc } from 'ember-changeset/types/validator-func';
import type { Config } from 'ember-changeset/types/config';
*/

const { Helper: { helper } } = Ember;

export function changeset(
  [obj, validations] /*: [Object, ValidatorFunc] */,
  options /*: Config */ = {}
) {
  if (isChangeset(obj)) {
    return obj;
  }

  if (isPromise(obj)) {
    return obj.then((resolved) => new Changeset(resolved, validations, {}, options));
  }

  return new Changeset(obj, validations, {}, options);
}

export default helper(changeset);
