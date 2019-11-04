import { isEmpty } from '@ember/utils';
import { isArray } from '@ember/array';
import wrapInArray from 'ember-changeset/utils/wrap';
import handleMultipleValidations from 'ember-changeset/utils/handle-multiple-validations';
import isPromise from 'ember-changeset/utils/is-promise';
import { ValidatorFunc, ValidationResult, ValidatorMap } from 'ember-changeset/types';

/**
 * returns a closure to lookup and validate k/v pairs set on a changeset
 *
 * @method lookupValidator
 * @param validationMap
 */
export default function lookupValidator(validationMap: ValidatorMap): ValidatorFunc {
  return ({ key, newValue, oldValue, changes, content }) => {
    let validator: ValidatorFunc | ValidatorFunc[] = validationMap[key];

    if (isEmpty(validator)) {
      return true;
    }

    if (isArray(validator)) {
      return handleMultipleValidations(<ValidatorFunc[]>validator, { key, newValue, oldValue, changes, content });
    }

    let validation: ValidationResult | Promise<ValidationResult> = (<ValidatorFunc>validator)({ key, newValue, oldValue, changes, content });

    return isPromise(validation) ? (<Promise<ValidationResult>>validation).then(wrapInArray) : [validation];
  };
}

