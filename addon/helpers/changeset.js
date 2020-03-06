import { helper } from '@ember/component/helper';
import { Changeset } from 'ember-changeset';
import { lookupValidator, isChangeset, isPromise, isObject } from 'validated-changeset';

export function changeset(
  [obj, validations],
  options= {}
) {
  if (isChangeset(obj)) {
    return obj;
  }

  if (isObject(validations)) {
    if (isPromise(obj)) {
      return obj.then((resolved) =>
        Changeset(resolved, lookupValidator(validations), validations, options)
      );
    }

    return Changeset(obj, lookupValidator(validations), validations, options);
  }

  if (isPromise(obj)) {
    return Promise.resolve(obj).then((resolved) => new Changeset(resolved, validations, {}, options));
  }

  return Changeset(obj, validations, {}, options);
}

export default helper(changeset);
