import getDeep from 'ember-changeset/utils/get-deep';
import { module, test } from 'ember-qunit';

module('Unit | Utility | get deep', () => {
  test('it returns value', async function(assert) {
    let objA = { other: 'Ivan' };
    let value = getDeep(objA, 'foo');

    assert.equal(value, undefined, 'result has value');
  });

  test('it returns value from nested', async function(assert) {
    let objA = { name: { other: 'Ivan' } };
    let value = getDeep(objA, 'name');

    assert.deepEqual(value, { other: 'Ivan' }, 'result has value');
  });

  test('it returns value from deep nested', async function(assert) {
    let objA = { name: { other: 'Ivan' } };
    let value = getDeep(objA, 'name.other');

    assert.deepEqual(value, 'Ivan', 'result has value');
  });

  test('it returns multiple values from nested', async function(assert) {
    let objA = { name: { other: 'Ivan' }, foo: { other: 'bar' } };
    let value = getDeep(objA, 'name');

    assert.deepEqual(value, { other: 'Ivan' }, 'result has value');
  });
});
