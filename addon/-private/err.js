// @flow

/*::
import type { ValidationErr } from 'ember-changeset/types/validation-result';

export type ErrLike = {
  value: mixed,
  validation: ValidationErr,
};
*/

export default class Err {
  /*::
  value: mixed;
  validation: ValidationErr;
  */

  constructor(value /*: mixed */, validation /*: ValidationErr */) {
    this.value = value;
    this.validation = validation;
  }
}
