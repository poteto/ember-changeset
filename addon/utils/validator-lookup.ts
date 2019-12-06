import { isEmpty } from '@ember/utils';
import { isArray } from '@ember/array';
import wrapInArray from 'ember-changeset/utils/wrap';
import handleMultipleValidations from 'ember-changeset/utils/handle-multiple-validations';
import isPromise from 'ember-changeset/utils/is-promise';
import { ValidatorAction, ValidatorMapFunc, ValidationResult, ValidatorMap } from 'ember-changeset/types';

/**
 * returns a closure to lookup and validate k/v pairs set on a changeset
 *
 * @method lookupValidator
 * @param validationMap
 */
export default function lookupValidator(validationMap: ValidatorMap): ValidatorAction {
  return ({ key, newValue, oldValue, changes, content }) => {
    let validator: ValidatorMapFunc | ValidatorMapFunc[] = validationMap[key];

    if (isEmpty(validator)) {
      return true;
    }

    if (isArray(validator)) {
      return handleMultipleValidations(<ValidatorMapFunc[]>validator, { key, newValue, oldValue, changes, content });
    }

    let validation: ValidationResult | Promise<ValidationResult> = (<ValidatorMapFunc>validator)(key, newValue, oldValue, changes, content);

    return isPromise(validation) ? (<Promise<ValidationResult>>validation).then(wrapInArray) : [validation];
  };
}

