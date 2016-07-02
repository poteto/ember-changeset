import Ember from 'ember';
import Changeset from 'ember-changeset';
import { module, test } from 'qunit';

const {
  Object: EmberObject,
  RSVP: { resolve },
  run,
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
  password(value) {
    return value || ['foo', 'bar'];
  },
  passwordConfirmation(newValue, _oldValue, { password }) {
    return isPresent(newValue) && password === newValue || "password doesn't match";
  },
  async(value) {
    return resolve(value);
  }
};

function dummyValidator({ key, newValue, oldValue, changes }) {
  let validatorFn = dummyValidations[key];

  if (typeOf(validatorFn) === 'function') {
    return validatorFn(newValue, oldValue, changes);
  }
}

module('Unit | Utility | changeset', {
  beforeEach() {
    let Dummy = EmberObject.extend({
      save() {
        return resolve(this);
      }
    });
    dummyModel = Dummy.create();
  }
});

// Methods
test('#get proxies to content', function(assert) {
  set(dummyModel, 'name', 'Jim Bob');
  let dummyChangeset = new Changeset(dummyModel);
  let result = get(dummyChangeset, 'name');

  assert.equal(result, 'Jim Bob', 'should proxy to content');
});

test('#get returns change if present', function(assert) {
  set(dummyModel, 'name', 'Jim Bob');
  let dummyChangeset = new Changeset(dummyModel);
  set(dummyChangeset, 'name', 'Milton Waddams');
  let result = get(dummyChangeset, 'name');

  assert.equal(result, 'Milton Waddams', 'should proxy to change');
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
    { key: 'password', validation: ['foo', 'bar'], value: false }
  ];
  let dummyChangeset = new Changeset(dummyModel, dummyValidator);
  dummyChangeset.set('name', 'a');
  dummyChangeset.set('password', false);
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
  let options;
  set(dummyModel, 'save', (dummyOptions) => {
    result = 'ok';
    options = dummyOptions;
    return resolve(true);
  });
  let dummyChangeset = new Changeset(dummyModel);
  dummyChangeset.set('name', 'foo');

  assert.equal(result, undefined, 'precondition');
  dummyChangeset.save('test options');
  assert.equal(result, 'ok', 'should save');
  assert.equal(options, 'test options', 'should proxy options when saving');
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

test('#error returns the error object', function(assert) {
  let dummyChangeset = new Changeset(dummyModel, dummyValidator);
  let expectedResult = { name: { validation: 'too short', value: 'a' } };
  dummyChangeset.set('name', 'a');

  assert.deepEqual(get(dummyChangeset, 'error'), expectedResult, 'should return error object');
});

test('#change returns the changes object', function(assert) {
  let dummyChangeset = new Changeset(dummyModel);
  let expectedResult = { name: 'a' };
  dummyChangeset.set('name', 'a');

  assert.deepEqual(get(dummyChangeset, 'change'), expectedResult, 'should return changes object');
});

test('#merge merges 2 valid changesets', function(assert) {
  let dummyChangesetA = new Changeset(dummyModel);
  let dummyChangesetB = new Changeset(dummyModel);
  dummyChangesetA.set('firstName', 'Jim');
  dummyChangesetB.set('lastName', 'Bob');
  let dummyChangesetC = dummyChangesetA.merge(dummyChangesetB);
  let expectedChanges = [{ key: 'firstName', value: 'Jim' }, { key: 'lastName', value: 'Bob' }];

  assert.deepEqual(get(dummyChangesetC, 'changes'), expectedChanges, 'should merge 2 valid changesets');
  assert.deepEqual(get(dummyChangesetA, 'changes'), [{ key: 'firstName', value: 'Jim' }], 'should not mutate first changeset');
  assert.deepEqual(get(dummyChangesetB, 'changes'), [{ key: 'lastName', value: 'Bob' }], 'should not mutate second changeset');
});

test('#merge does not merge invalid changesets', function(assert) {
  let dummyChangesetA = new Changeset(dummyModel, dummyValidator);
  let dummyChangesetB = new Changeset(dummyModel, dummyValidator);
  dummyChangesetA.set('name', 'a');
  dummyChangesetB.set('name', 'b');

  assert.throws(() => dummyChangesetA.merge(dummyChangesetB), ({ message }) => {
    return message === 'Assertion Failed: Cannot merge invalid changesets';
  }, 'should throw error');
});

test('#merge does not merge a changeset with a non-changeset', function(assert) {
  let dummyChangesetA = new Changeset(dummyModel, dummyValidator);
  let dummyChangesetB = { _changes: { name: 'b' } };
  dummyChangesetA.set('name', 'a');

  assert.throws(() => dummyChangesetA.merge(dummyChangesetB), ({ message }) => {
    return message === 'Assertion Failed: Cannot merge with a non-changeset';
  }, 'should throw error');
});

test('#merge does not merge a changeset with different content', function(assert) {
  let dummyChangesetA = new Changeset(dummyModel, dummyValidator);
  let dummyChangesetB = new Changeset(EmberObject.create(), dummyValidator);

  assert.throws(() => dummyChangesetA.merge(dummyChangesetB), ({ message }) => {
    return message === 'Assertion Failed: Cannot merge with a changeset of different content';
  }, 'should throw error');
});

test('#merge preserves content and validator of origin changeset', function(assert) {
  let dummyChangesetA = new Changeset(dummyModel, dummyValidator);
  let dummyChangesetB = new Changeset(dummyModel);
  let dummyChangesetC = dummyChangesetA.merge(dummyChangesetB);
  let expectedErrors = [{ key: 'name', validation: 'too short', value: 'a' }];

  dummyChangesetC.set('name', 'a');
  assert.deepEqual(dummyChangesetC.get('errors'), expectedErrors, 'should preserve validator');

  run(() => {
    dummyChangesetC.set('name', 'Jim Bob');
    dummyChangesetC.save().then(() => {
      assert.equal(dummyModel.get('name'), 'Jim Bob', 'should set value on model');
    });
  });
});

test('#validate/0 validates all fields immediately', function(assert) {
  let done = assert.async();
  dummyModel.setProperties({ name: 'J', password: false });
  let dummyChangeset = new Changeset(dummyModel, dummyValidator, dummyValidations);

  run(() => {
    dummyChangeset.validate().then(() => {
      assert.deepEqual(get(dummyChangeset, 'error.password'), { validation: ['foo', 'bar'], value: false }, 'should validate immediately');
      assert.deepEqual(get(dummyChangeset, 'changes'), [], 'should not set changes');
      assert.equal(get(dummyChangeset, 'errors.length'), 4, 'should have 4 errors');
      done();
    });
  });
});

test('#validate/1 validates a single field immediately', function(assert) {
  let done = assert.async();
  dummyModel.setProperties({ name: 'J', password: '123' });
  let dummyChangeset = new Changeset(dummyModel, dummyValidator, dummyValidations);

  run(() => {
    dummyChangeset.validate('name').then(() => {
      assert.deepEqual(get(dummyChangeset, 'error.name'), { validation: 'too short', value: 'J' }, 'should validate immediately');
      assert.deepEqual(get(dummyChangeset, 'changes'), [], 'should not set changes');
      assert.equal(get(dummyChangeset, 'errors.length'), 1, 'should only have 1 error');
      done();
    });
  });
});

test('#validate works correctly with changeset values', function(assert) {
  let done = assert.async();
  dummyModel.setProperties({ name: undefined, password: false, async: true, passwordConfirmation: false });
  let dummyChangeset = new Changeset(dummyModel, dummyValidator, dummyValidations);

  run(() => {
    dummyChangeset.set('name', 'Jim Bob');
    dummyChangeset.validate().then(() => {
      assert.equal(get(dummyChangeset, 'errors.length'), 2, 'should have 2 errors');
      assert.ok(get(dummyChangeset, 'isInvalid'), 'should be invalid');
    });
  });

  run(() => {
    dummyChangeset.set('password', true);
    dummyChangeset.set('passwordConfirmation', true);
    dummyChangeset.validate().then(() => {
      assert.equal(get(dummyChangeset, 'errors.length'), 0, 'should have no errors');
      assert.ok(get(dummyChangeset, 'isValid'), 'should be valid');
      done();
    });
  });
});

// Behavior
test('it works with setProperties', function(assert) {
  let dummyChangeset = new Changeset(dummyModel);
  let expectedResult = [
    { key: 'firstName', value: 'foo' },
    { key: 'lastName', value: 'bar' }
  ];
  dummyChangeset.setProperties({ firstName: 'foo', lastName: 'bar' });

  assert.deepEqual(get(dummyChangeset, 'changes'), expectedResult, 'precondition');
});

test('it accepts async validations', function(assert) {
  let done = assert.async();
  let dummyChangeset = new Changeset(dummyModel, dummyValidator);
  let expectedChanges = [{ key: 'async', value: true }];
  let expectedError = { async: { validation: 'is invalid', value: 'is invalid' } };
  run(() => dummyChangeset.set('async', true));
  run(() => dummyChangeset.set('async', 'is invalid'));
  run(() => {
    assert.deepEqual(get(dummyChangeset, 'changes'), expectedChanges, 'should set change');
    assert.deepEqual(get(dummyChangeset, 'error'), expectedError, 'should set error');
    done();
  });
});

test('it clears errors when setting to original value', function(assert) {
  set(dummyModel, 'name', 'Jim Bob');
  let dummyChangeset = new Changeset(dummyModel, dummyValidator);
  dummyChangeset.set('name', '');

  assert.ok(get(dummyChangeset, 'isInvalid'), 'should be invalid');
  dummyChangeset.set('name', 'Jim Bob');
  assert.ok(get(dummyChangeset, 'isValid'), 'should be valid');
  assert.notOk(get(dummyChangeset, 'isInvalid'), 'should be valid');
});
