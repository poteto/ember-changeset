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
  let expectedChanges = { name: 'foo' };
  let dummyChangeset = new Changeset(dummyModel);
  dummyChangeset.set('name', 'foo');
  let changes = get(dummyChangeset, 'changes');

  assert.deepEqual(changes, expectedChanges, 'should add change');
});

test('#set does not add a change if invalid', function(assert) {
  let validations = {
    name(value) {
      return isPresent(value) && value.length > 3;
    }
  };
  let dummyChangeset = new Changeset(dummyModel, function(key, newValue, oldValue) {
    let validatorFn = validations[key];

    if (typeOf(validatorFn) === 'function') {
      return validatorFn(newValue, oldValue);
    }
  });
  dummyChangeset.set('name', 'a');
  let changes = get(dummyChangeset, 'changes');

  assert.deepEqual(changes, {}, 'should not add change');
});

test('#execute applies changes to content', function(assert) {
  let dummyChangeset = new Changeset(dummyModel);
  dummyChangeset.set('name', 'foo');

  assert.equal(get(dummyModel, 'name'), undefined, 'precondition');
  dummyChangeset.execute();
  assert.equal(get(dummyModel, 'name'), 'foo', 'should apply changes');
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
  dummyChangeset.set('firstName', 'foo');
  dummyChangeset.set('lastName', 'bar');

  assert.deepEqual(get(dummyChangeset, 'changes'), { firstName: 'foo', lastName: 'bar' }, 'precondition');
  dummyChangeset.rollback();
  assert.deepEqual(get(dummyChangeset, 'changes'), {}, 'should rollback');
});
