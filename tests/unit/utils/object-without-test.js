import objectWithout from 'ember-changeset/utils/object-without';
import { module, test } from 'qunit';

module('Unit | Utility | object without');

test('it exludes the given keys from all merged objects', function(assert) {
  let objA = { name: 'Ivan' };
  let objB = { name: 'John' };
  let objC = { age: 27 };
  let objD = objectWithout([ 'age' ], objA, objB, objC);

  assert.deepEqual(objD, { name: 'John' }, 'result only contains name');
  assert.deepEqual(objA.name, 'Ivan', 'does not mutate original object');
  assert.deepEqual(objC.age, 27, 'does not mutate original object');
});
