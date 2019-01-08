import { helper } from '@ember/component/helper';
import Changeset from 'ember-changeset';
import { Config } from 'ember-changeset/types/config';
import { ValidatorFunc } from 'ember-changeset/types/validator-func';
import isChangeset from 'ember-changeset/utils/is-changeset';
import isPromise from 'ember-changeset/utils/is-promise';

export function changeset(
  [obj, validations]: [object | Promise<any>, ValidatorFunc],
  options: Config = {}
): Changeset | Promise<Changeset> {
  if (isChangeset(obj)) {
    return obj;
  }

  if (isPromise(obj)) {
    return Promise.resolve(obj).then((resolved: any) => new Changeset(resolved, validations, {}, options));
  }

  return new Changeset(obj, validations, {}, options);
}

export default helper(changeset);
