import normalizeObject from 'ember-changeset/utils/normalize-object';
import { module, test } from 'qunit';

module('Unit | Utility | normalize object', () => {
  test('it returns value', async function(assert) {
    let objA = { value: 'Ivan' };
    let value = normalizeObject(objA);

    assert.equal(value, 'Ivan', 'result has value');
  });

  test('it returns value from nested', async function(assert) {
    let objA = { name: { value: 'Ivan' } };
    let value = normalizeObject(objA);

    assert.deepEqual(value, { name: 'Ivan' }, 'result has value');
  });

  test('it returns multiple values from nested', async function(assert) {
    let objA = { name: { value: 'Ivan' }, foo: { value: 'bar' } };
    let value = normalizeObject(objA);

    assert.deepEqual(value, { name: 'Ivan', foo: 'bar' }, 'result has value');
  });
});
