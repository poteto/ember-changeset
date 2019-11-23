import pureAssign from 'ember-changeset/utils/assign';
import { module, test } from 'qunit';

module('Unit | Utility | assign', function() {
  test('it does not mutate destination or source objects', async function(assert) {
    let foo = { name: 'foo' };
    let bar = { name: 'bar' };
    let result = pureAssign(foo, bar, { test: 1 });

    assert.deepEqual(result, { name: 'bar', test: 1 }, 'should assign object');
    assert.deepEqual(foo, { name: 'foo' }, 'should not mutate destination');
    assert.deepEqual(bar, { name: 'bar' }, 'should not mutate source');
  });

  test('it keeps setter', async function(assert) {
    class Foo {
      name = 'foo'
      get nick() {
        return this._nick;
      }

      set nick(val) {
        this._nick = val;
      }
    }
    let foo = new Foo();
    let bar = { name: 'bar' };
    let result = pureAssign(foo, bar, { test: 1 });

    assert.deepEqual(result, { name: 'bar', test: 1 }, 'should assign object');
    assert.deepEqual(foo.name, 'foo', 'should not mutate destination');
    assert.deepEqual(bar, { name: 'bar' }, 'should not mutate source');

    result.nick = 'dood';

    assert.equal(result.nick, 'dood', 'should not mutate source');
  });
});

