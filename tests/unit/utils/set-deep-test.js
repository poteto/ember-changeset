import setDeep from 'ember-changeset/utils/set-deep';
import { module, test } from 'qunit';

module('Unit | Utility | set deep', () => {
  test('it sets value', async function(assert) {
    let objA = { other: 'Ivan' };
    let value = setDeep(objA, 'foo', 'bar');

    assert.deepEqual(value, { other: 'Ivan', foo: 'bar'}, 'it sets value');
  });

  test('it sets deeper', async function(assert) {
    let objA = { other: 'Ivan' };
    let value = setDeep(objA, 'other.nick', 'bar');

    assert.deepEqual(value, { other: { nick: 'bar' } }, 'sets deeper');
  });

  test('it overrides leaf key', async function(assert) {
    let objA = { name: { other: 'Ivan' } };
    let value = setDeep(objA, 'name', 'foo');

    assert.deepEqual(value, { name: 'foo' }, 'result has value');
  });

  test('it handles nested key', async function(assert) {
    let objA = { name: { other: 'Ivan' } };
    let value = setDeep(objA, 'name.other', 'foo');

    assert.deepEqual(value, { name: { other: 'foo' }}, 'result has value');
  });

  test('it handles sibling keys', async function(assert) {
    let objA = { name: { other: 'Ivan', koala: 'bear' }, star: 'wars' };
    let value = setDeep(objA, 'name.other', 'foo');

    assert.deepEqual(value, { name: { other: 'foo', koala: 'bear' }, star: 'wars' }, 'keeps sibling key');
  });

  test('it works with multiple values', async function(assert) {
    let objA = { name: { other: 'Ivan' }, foo: { other: 'bar' } };
    let value = setDeep(objA, 'name', 'zoo');

    assert.deepEqual(value, { foo: { other: 'bar' }, name: 'zoo' }, 'result has value');
  });
});
