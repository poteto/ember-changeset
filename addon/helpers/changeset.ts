import { helper } from '@ember/component/helper';
import { Changeset as ChangesetFactory } from 'ember-changeset';
import {
  IChangeset,
  Config,
  ValidatorAction,
  ValidatorMap
} from 'ember-changeset/types';
import lookupValidator from 'ember-changeset/utils/validator-lookup';
import isChangeset from 'ember-changeset/utils/is-changeset';
import isPromise from 'ember-changeset/utils/is-promise';
import isObject from 'ember-changeset/utils/is-object';

export function changeset(
  [obj, validations]: [object | Promise<any>, ValidatorAction | ValidatorMap],
  options: Config = {}
): IChangeset | Promise<IChangeset> {
  const isIChangeset = (obj: unknown): obj is IChangeset => isChangeset(obj);
  if (isIChangeset(obj)) {
    return obj;
  }

  if (isObject(validations)) {
    if (isPromise(obj)) {
      return (<Promise<any>>obj).then((resolved) =>
        ChangesetFactory(resolved, lookupValidator(<ValidatorMap>validations), <ValidatorMap>validations, options)
      );
    }

    return ChangesetFactory(obj, lookupValidator(<ValidatorMap>validations), <ValidatorMap>validations, options);
  }

  if (isPromise(obj)) {
    return Promise.resolve(obj).then((resolved: any) => ChangesetFactory(resolved, <ValidatorAction>validations, {}, options));
  }

  return ChangesetFactory(obj, <ValidatorAction>validations, {}, options);
}

export default helper(changeset);
