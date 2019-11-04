import { helper } from '@ember/component/helper';
import Changeset from 'ember-changeset';
import { Config } from 'ember-changeset/types/config';
import { ValidatorFunc, ValidatorMap } from 'ember-changeset/types/validator-func';
import lookupValidator from 'ember-changeset/utils/validator-lookup';
import isChangeset from 'ember-changeset/utils/is-changeset';
import isPromise from 'ember-changeset/utils/is-promise';
import isObject from 'ember-changeset/utils/is-object';

export function changeset(
  [obj, validations]: [object | Promise<any>, ValidatorFunc | ValidatorMap],
  options: Config = {}
): Changeset | Promise<Changeset> {
  if (isChangeset(obj)) {
    return obj;
  }

  if (isObject(validations)) {
    if (isPromise(obj)) {
      return (<Promise<any>>obj).then((resolved) => new Changeset(resolved, lookupValidator(<ValidatorMap>validations), <ValidatorMap>validations, options));
    }

    return new Changeset(obj, lookupValidator(<ValidatorMap>validations), <ValidatorMap>validations, options);
  }

  if (isPromise(obj)) {
    return Promise.resolve(obj).then((resolved: any) => new Changeset(resolved, <ValidatorFunc>validations, {}, options));
  }

  return new Changeset(obj, <ValidatorFunc>validations, {}, options);
}

export default helper(changeset);
