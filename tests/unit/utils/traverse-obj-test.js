import traverse from 'ember-changeset/utils/traverse-obj';
import { module, test } from 'qunit';

module('Unit | Utility | traverse obj');

// Replace this with your real tests.
test('it works', function(assert) {
  let result = traverse();
  console.log(result)
  assert.ok(result);

  const obj = {
    foo: {
      bar: {
        baz: {
          whoop: 'dee-doo'
        }
      },

      hello: {
        world: 42
      }
    }
  };

  for (const {key, value} of traverse(obj)) {
    console.log(key, value);
  }
});
