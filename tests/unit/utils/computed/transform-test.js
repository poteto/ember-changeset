import transform from 'ember-changeset/utils/computed/transform';
import EmberObject from '@ember/object';
import { module, test } from 'qunit';

module('Unit | Utility | computed/transform');

test('it works', function(assert) {
  let Thing = EmberObject.extend({
    changes: {
      'foo.bar.baz': 42,
      hello: 'world',
      blah: { foo: { bar: { baz: 42 } } },
    },
    transformed: transform('changes', value => ({ value })),
  });

  let actual   = Thing.create().get('transformed');
  let expected = {
    'foo.bar.baz': { value: 42 },
    hello: { value: 'world' },
    blah: { value: { foo: { bar: { baz: 42 } } } },
  };

  assert.deepEqual(actual, expected);
});
