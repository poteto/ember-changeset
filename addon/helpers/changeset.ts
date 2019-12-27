import { helper } from '@ember/component/helper';
import Changeset from 'ember-changeset';
import { lookupValidator, isChangeset, isPromise, isObject, Types } from 'validated-changeset';

export function changeset(
  [obj, validations]: [object | Promise<any>, Types.ValidatorAction | Types.ValidatorMap],
  options: Types.Config = {}
): Changeset | Promise<Changeset> {
  if (isChangeset(obj)) {
    return obj;
  }

  if (isObject(validations)) {
    if (isPromise(obj)) {
      return (<Promise<any>>obj).then((resolved) =>
        new Changeset(resolved, lookupValidator(<Types.ValidatorMap>validations), <Types.ValidatorMap>validations, options)
      );
    }

    return new Changeset(obj, lookupValidator(<Types.ValidatorMap>validations), <Types.ValidatorMap>validations, options);
  }

  if (isPromise(obj)) {
    return Promise.resolve(obj).then((resolved: any) => new Changeset(resolved, <Types.ValidatorAction>validations, {}, options));
  }

  return new Changeset(obj, <Types.ValidatorAction>validations, {}, options);
}

export default helper(changeset);
