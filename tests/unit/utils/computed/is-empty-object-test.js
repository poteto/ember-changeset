import Ember from 'ember';
import isEmptyObject from 'ember-changeset/utils/computed/is-empty-object';
import { module, test } from 'qunit';

const { Object: EmberObject } = Ember;

module('Unit | Utility | is empty object');

test('it returns true if the object has no keys', function(assert) {
  let Dummy = EmberObject.extend({
    _object: {},
    isEmpty: isEmptyObject('_object')
  });
  let result = Dummy.create().get('isEmpty');
  assert.ok(result, 'should be true');
});

test('it returns false if the object has at least 1 key', function(assert) {
  let Dummy = EmberObject.extend({
    _object: { foo: 'bar' },
    isEmpty: isEmptyObject('_object')
  });
  let result = Dummy.create().get('isEmpty');
  assert.notOk(result, 'should be false');
});

test('it throws if invoked without dependent key', function(assert) {
  assert.throws(() => EmberObject.extend({ isEmpty: isEmptyObject() }), ({ message }) => {
    return message === 'Assertion Failed: `dependentKey` must be defined';
  }, 'should throw error');
});
