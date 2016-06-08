import Ember from 'ember';
import Changeset from 'dummy/utils/changeset';
import { module, test } from 'qunit';

const {
  Object: EmberObject,
  RSVP: { resolve },
  get,
  isPresent,
  set,
  typeOf
} = Ember;

let dummyModel;
let dummyValidations = {
  name(value) {
    return isPresent(value) && value.length > 3 || 'too short';
  },
  password() {
    return ['foo', 'bar'];
  }
};
function dummyValidator(key, newValue, oldValue) {
  let validatorFn = dummyValidations[key];

  if (typeOf(validatorFn) === 'function') {
    return validatorFn(newValue, oldValue);
  }
}

module('Unit | Utility | changeset', {
  beforeEach() {
    dummyModel = EmberObject.create();
  }
});

test('#get proxies to content', function(assert) {
  set(dummyModel, 'name', 'Jim Bob');
  let dummyChangeset = new Changeset(dummyModel);
  let result = get(dummyChangeset, 'name');

  assert.equal(result, 'Jim Bob', 'should proxy to content');
});

test('#set adds a change if valid', function(assert) {
  let expectedChanges = [{ key: 'name', value: 'foo' }];
  let dummyChangeset = new Changeset(dummyModel);
  dummyChangeset.set('name', 'foo');
  let changes = get(dummyChangeset, 'changes');

  assert.deepEqual(changes, expectedChanges, 'should add change');
});

test('#set does not add a change if invalid', function(assert) {
  let expectedErrors = [
    { key: 'name', validation: 'too short', value: 'a' },
    { key: 'password', validation: ['foo', 'bar'], value: 'foo' }
  ];
  let dummyChangeset = new Changeset(dummyModel, dummyValidator);
  dummyChangeset.set('name', 'a');
  dummyChangeset.set('password', 'foo');
  let changes = get(dummyChangeset, 'changes');
  let errors = get(dummyChangeset, 'errors');
  let isValid = get(dummyChangeset, 'isValid');
  let isInvalid = get(dummyChangeset, 'isInvalid');

  assert.deepEqual(changes, [], 'should not add change');
  assert.deepEqual(errors, expectedErrors, 'should have errors');
  assert.notOk(isValid, 'should not be valid');
  assert.ok(isInvalid, 'should be invalid');
});

test('#execute applies changes to content if valid', function(assert) {
  let dummyChangeset = new Changeset(dummyModel);
  dummyChangeset.set('name', 'foo');

  assert.equal(get(dummyModel, 'name'), undefined, 'precondition');
  assert.ok(get(dummyChangeset, 'isValid'), 'should be valid');
  dummyChangeset.execute();
  assert.equal(get(dummyModel, 'name'), 'foo', 'should apply changes');
});

test('#execute does not apply changes to content if invalid', function(assert) {
  let dummyChangeset = new Changeset(dummyModel, dummyValidator);
  dummyChangeset.set('name', 'a');

  assert.equal(get(dummyModel, 'name'), undefined, 'precondition');
  assert.ok(get(dummyChangeset, 'isInvalid'), 'should be invalid');
  dummyChangeset.execute();
  assert.equal(get(dummyModel, 'name'), undefined, 'should not apply changes');
});

test('#save proxies to content', function(assert) {
  let result;
  set(dummyModel, 'save', () => {
    result = 'ok';
    return resolve(true);
  });
  let dummyChangeset = new Changeset(dummyModel);
  dummyChangeset.set('name', 'foo');

  assert.equal(result, undefined, 'precondition');
  dummyChangeset.execute().save();
  assert.equal(result, 'ok', 'should save');
});

test('#rollback restores old values', function(assert) {
  let dummyChangeset = new Changeset(dummyModel);
  let expectedResult = [
    { key: 'firstName', value: 'foo' },
    { key: 'lastName', value: 'bar' }
  ];
  dummyChangeset.set('firstName', 'foo');
  dummyChangeset.set('lastName', 'bar');

  assert.deepEqual(get(dummyChangeset, 'changes'), expectedResult, 'precondition');
  dummyChangeset.rollback();
  assert.deepEqual(get(dummyChangeset, 'changes'), [], 'should rollback');
});

test('#rollback resets valid state', function(assert) {
  let dummyChangeset = new Changeset(dummyModel, dummyValidator);
  dummyChangeset.set('name', 'a');

  assert.ok(get(dummyChangeset, 'isInvalid'), 'should be invalid');
  dummyChangeset.rollback();
  assert.ok(get(dummyChangeset, 'isValid'), 'should be valid');
});

test('it works with setProperties', function(assert) {
  let dummyChangeset = new Changeset(dummyModel);
  let expectedResult = [
    { key: 'firstName', value: 'foo' },
    { key: 'lastName', value: 'bar' }
  ];
  dummyChangeset.setProperties({ firstName: 'foo', lastName: 'bar' });

  assert.deepEqual(get(dummyChangeset, 'changes'), expectedResult, 'precondition');
});

test('#error returns the error object', function(assert) {
  let dummyChangeset = new Changeset(dummyModel, dummyValidator);
  let expectedResult = { name: { validation: 'too short', value: 'a' } };
  dummyChangeset.set('name', 'a');

  assert.deepEqual(get(dummyChangeset, 'error'), expectedResult, 'should return error object');
});
