import keyInObject from 'ember-changeset/utils/key-in-object';
import { module, test } from 'qunit';

module('Unit | Utility | key-in-object', function() {

  test('it works with no key', function(assert) {
    let result = keyInObject({});
    assert.equal(result, false);
  });

  test('it works', function(assert) {
    let result = keyInObject({ b: 'a'}, 'b');
    assert.equal(result, true);

    result = keyInObject({ b: 'a'}, 'a');
    assert.equal(result, false);
  });

  test('it works with nested', function(assert) {
    let result = keyInObject({ b: { a: 'c' } }, 'b.a');
    assert.equal(result, true, 'nested key found');

    result = keyInObject({ b: { a: 'c' } }, 'b.c');
    assert.equal(result, false, 'nested key not found');
  });

  test('it works with nested key and only partially found', function(assert) {
    let result = keyInObject({ b: true }, 'b.a');
    assert.equal(result, false, 'partial match is false');
  });
});
