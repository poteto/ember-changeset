import uniq from 'ember-changeset/utils/uniq';
import { module, test } from 'qunit';

module('Unit | Utility | uniq');

test('it returns an array with unique values', function(assert) {
  let subject = [1, 1, 2, 1, 2, '1'];
  let expected = [1, 2, '1'];
  let result = uniq(subject);
  assert.deepEqual(result, expected);
});
