// @flow

/*::
import type { ValidationMsg } from 'ember-changeset/types/validation-message';
*/

export default class Err {
  /*::
  value: mixed;
  validation: ValidationMsg;
  */

  constructor(value /*: mixed */, validation /*: ValidationMsg */) {
    this.value = value;
    this.validation = validation;
  }
}
