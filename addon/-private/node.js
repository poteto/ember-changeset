// @flow

/*::
import type Change from 'ember-changeset/-private/change';
import type Err from 'ember-changeset/-private/err';
*/

export default class Node {
  /*::
  key: string;
  value: Change | Err;
  */

  constructor(k /*: string */, v /*: Change | Err */) {
    this.key = k;
    this.value = v;
  }
}
