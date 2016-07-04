import pureAssign from 'ember-changeset/utils/assign';
import { module, test } from 'qunit';

module('Unit | Utility | assign');

test(`it does not mutate destination or source objects`, function(assert) {
  let foo = { name: 'foo' };
  let bar = { name: 'bar' };
  let result = pureAssign(foo, bar, { test: 1 });

  assert.deepEqual(result, { name: 'bar', test: 1 }, 'should assign object');
  assert.deepEqual(foo, { name: 'foo' }, 'should not mutate destination');
  assert.deepEqual(bar, { name: 'bar' }, 'should not mutate source');
});
