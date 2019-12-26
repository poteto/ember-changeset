import { helper } from '@ember/component/helper';
import { Changeset } from 'validated-changeset';
import { Config } from 'validated-changeset/types/config';
import { ValidatorAction, ValidatorMap } from 'validated-changeset/types/validator-action';
import lookupValidator from 'validated-changeset/utils/validator-lookup';
import isChangeset from 'validated-changeset/utils/is-changeset';
import isPromise from 'validated-changeset/utils/is-promise';
import isObject from 'ember-changeset/utils/is-object';

export function changeset(
  [obj, validations]: [object | Promise<any>, ValidatorAction | ValidatorMap],
  options: Config = {}
): Changeset | Promise<Changeset> {
  if (isChangeset(obj)) {
    return obj;
  }

  if (isObject(validations)) {
    if (isPromise(obj)) {
      return (<Promise<any>>obj).then((resolved) =>
        new Changeset(resolved, lookupValidator(<ValidatorMap>validations), <ValidatorMap>validations, options)
      );
    }

    return new Changeset(obj, lookupValidator(<ValidatorMap>validations), <ValidatorMap>validations, options);
  }

  if (isPromise(obj)) {
    return Promise.resolve(obj).then((resolved: any) => new Changeset(resolved, <ValidatorAction>validations, {}, options));
  }

  return new Changeset(obj, <ValidatorAction>validations, {}, options);
}

export default helper(changeset);
