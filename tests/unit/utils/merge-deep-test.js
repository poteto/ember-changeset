import mergeDeep from 'ember-changeset/utils/merge-deep';
import { module, test } from 'qunit';
import { get, set } from '@ember/object';

module('Unit | Utility | merge deep', () => {
  test('it returns merged objects', async function(assert) {
    let objA = { other: 'Ivan' };
    let objB = { foo: { value: 'bar' }, zoo: 'doo' };
    let value = mergeDeep(objA, objB);

    assert.deepEqual(value, { other: 'Ivan', foo: 'bar', zoo: 'doo' }, 'merges both values');
  });

  test('it unsets', async function(assert) {
    let objA = { other: 'Ivan' };
    let objB = { other: null };
    let value = mergeDeep(objA, objB);

    assert.deepEqual(value, { other: null }, 'unsets value');
  });

  test('it works with Ember.get and Ember.set', async function(assert) {
    let objA = { other: 'Ivan' };
    let objB = { other: null };
    let value = mergeDeep(objA, objB, { safeGet: get, safeSet: set });

    assert.deepEqual(value, { other: null }, 'unsets value');
  });

  test('it works with deeper nested objects', async function(assert) {
    let objA = { company: { employees: ['Ivan', 'Jan'] } };
    let objB = { company: { employees: { value: ['Jull', 'Olafur'] } } };
    let value = mergeDeep(objA, objB);

    assert.deepEqual(value, { company: { employees: ['Jull', 'Olafur']} }, 'has right employees');
  });

  test('it works with unsafe properties', async function(assert) {
    class A {
      _boo = 'bo';

      get boo() {
        return this._boo;
      }
      set boo(value) {
        this._boo = value;
      }

      foo = { baz: 'ba' };
    }

    class B extends A {
      other = 'Ivan';
    }

    const objA = new B();
    const objB = { boo: { value: 'doo' }, foo: { baz: { value: 'bar' } } };

    const value = mergeDeep(objA, objB, { safeGet: get, safeSet: set });

    assert.equal(value.boo, 'doo', 'unsafe plain property is merged');
    assert.equal(value.other, 'Ivan', 'safe property is not touched');
    assert.deepEqual(value.foo, { baz: 'bar' }, 'unsafe object property is merged');
  });
});
