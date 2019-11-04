import { A as emberArray } from '@ember/array';
import { all, reject } from 'rsvp';
import { get } from '@ember/object';
import isPromise from 'ember-changeset/utils/is-promise';
import { ValidatorFunc, ValidationResult } from 'ember-changeset/types';

/**
 * Rejects `true` values from an array of validations. Returns `true` when there
 * are no errors, or the error object if there are errors.
 *
 * @private
 * @param  {Array} validations
 * @return {Boolean|Any}
 */
function handleValidations(validations: Array<ValidationResult | Promise<ValidationResult>>): Boolean | any {
  let maybeRejected = emberArray(validations)
    .reject((validation) => typeof validation === 'boolean' && validation);

  return get(maybeRejected, 'length') === 0 || maybeRejected;
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
  validators: ValidatorFunc[],
  { key, newValue, oldValue, changes, content }: { [s: string]: any }
): Boolean | any {
  let validations: Array<ValidationResult | Promise<ValidationResult>> = emberArray(
    validators.map((validator: ValidatorFunc): ValidationResult | Promise<ValidationResult> =>
      validator({ key, newValue, oldValue, changes, content })
    )
  );

  if (emberArray(validations).any(isPromise)) {
    return all(validations).then(handleValidations);
  }

  return handleValidations(validations);
}

