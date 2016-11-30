
import { arrayIndices } from 'dummy/helpers/array-indices';
import { module, test } from 'qunit';

module('Unit | Helper | array indices');

// Replace this with your real tests.
test('it works', function(assert) {
  let result = arrayIndices([{
    _length: function(){
      return 4;
    }
  }]);
  assert.deepEqual(result, [0, 1, 2, 3]);
});

