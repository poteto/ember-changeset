import EmberObject from '@ember/object';
import objectToArray from 'ember-changeset/utils/computed/object-to-array';
import { module, test } from 'qunit';

module('Unit | Utility | object to array');

test('it converts an object into an array', function(assert) {
  let Dummy = EmberObject.extend({
    _object: {
      firstName: 'Jim',
      lastName: 'Bob'
    },

    values: objectToArray('_object')
  });
  let result = Dummy.create().get('values');
  let expectedResult = [
    { key: 'firstName', value: 'Jim' },
    { key: 'lastName', value: 'Bob' }
  ];
  assert.deepEqual(result, expectedResult, 'should convert to array');
});

test('it maintains shallow objects when flattenObjects is false', function(assert) {
  let Dummy = EmberObject.extend({
    _object: {
      firstName: {
        value: 'Jim',
        validation: 'Too short'
      }
    },

    values: objectToArray('_object', false)
  });
  let result = Dummy.create().get('values');
  let expectedResult = [{ key: 'firstName', value: { value: 'Jim', validation: 'Too short' }}];
  assert.deepEqual(result, expectedResult, 'should convert to array');
});

test('it flattens shallow object values when flattenObjects is true', function(assert) {
  let Dummy = EmberObject.extend({
    _object: {
      firstName: {
        value: 'Jim',
        validation: 'Too short'
      }
    },

    values: objectToArray('_object', true)
  });
  let result = Dummy.create().get('values');
  let expectedResult = [{ key: 'firstName', value: 'Jim', validation: 'Too short' }];
  assert.deepEqual(result, expectedResult, 'should convert to array');
});
