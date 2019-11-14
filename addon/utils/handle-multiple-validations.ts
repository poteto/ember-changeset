import isPromise from 'ember-changeset/utils/is-promise';
import { ValidatorMapFunc, ValidationResult } from 'ember-changeset/types';

/**
 * Rejects `true` values from an array of validations. Returns `true` when there
 * are no errors, or the error object if there are errors.
 *
 * @private
 * @param  {Array} validations
 * @return {Promise<Boolean|Any>}
 */
async function handleValidationsAsync(validations: Array<ValidationResult | Promise<ValidationResult>>): Promise<any> {
  try {
    const result = await Promise.all(validations);

    const maybeFailed = result.filter(val => typeof val !== 'boolean' && val);
    return maybeFailed.length === 0 || maybeFailed;

  } catch(e) {
    return e;
  }
}

/**
 * Rejects `true` values from an array of validations. Returns `true` when there
 * are no errors, or the error object if there are errors.
 *
 * @private
 * @param  {Array} validations
 * @return {Boolean|Any}
 */
async function handleValidationsSync(validations: Array<ValidationResult | Promise<ValidationResult>>): Promise<any> {
  const maybeFailed = validations.filter(val => typeof val !== 'boolean' && val);
  return maybeFailed.length === 0 || maybeFailed;
}
/**
 * Handles an array of validators and returns Promise.all if any value is a
 * Promise.
 *
 * @public
 * @param  {Array} validators Array of validator functions
 * @param  {String} options.key
 * @param  {Any} options.newValue
 * @param  {Any} options.oldValue
 * @param  {Object} options.changes
 * @param  {Object} options.content
 * @return {Promise|Boolean|Any}
 */
export default function handleMultipleValidations(
  validators: ValidatorMapFunc[],
  { key, newValue, oldValue, changes, content }: { [s: string]: any }
): Boolean | any {
  let validations: Array<ValidationResult | Promise<ValidationResult>> = Array.from(
    validators.map((validator: ValidatorMapFunc): ValidationResult | Promise<ValidationResult> =>
      validator(key, newValue, oldValue, changes, content)
    )
  );

  if (validations.some(isPromise)) {
    return Promise.all(validations).then(handleValidationsAsync);
  }

  return handleValidationsSync(validations);
}
