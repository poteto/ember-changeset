import take from 'ember-changeset/utils/take';
import { module, test } from 'qunit';

module('Unit | Utility | take', function() {
  test('it returns an object with only the specified keys', async function(assert) {
    let employee = {
      name: 'Milton Waddams',
      stapler: 'Red',
      deskLocation: 'basement'
    };
    let expectedResult = { name: 'Milton Waddams', deskLocation: 'basement' };
    let result = take(employee, ['name', 'deskLocation']);

    assert.deepEqual(result, expectedResult, 'it returns an object with only the specified keys');
  });
});
