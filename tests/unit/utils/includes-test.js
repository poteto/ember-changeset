import includes from 'ember-changeset/utils/includes';
import { module, test } from 'qunit';

module('Unit | Utility | includes');

test('it throws an error if not an array', function(assert) {
  assert.throws(() => includes('foo', 'bar'), 'should throw error');
});

test('it returns true if item is in array', function(assert) {
  let x = { x: 1 };
  assert.ok(includes([1, 2, 3], 3));
  assert.ok(includes(['foo', 'bar'], 'foo'));
  assert.ok(includes([x], x));
});

test('it returns false if item is not in array', function(assert) {
  let x = { x: 1 };
  assert.notOk(includes([1, 2, 3], 4));
  assert.notOk(includes(['foo', 'bar'], 'baz'));
  assert.notOk(includes([x], { x: 1 }));
});
