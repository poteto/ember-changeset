import Ember from 'ember';
import Changeset from 'ember-changeset';
import wait from 'ember-test-helpers/wait';
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
let dummyModel2;
let dummyModel3;
let dummyModel4;
let dummyValidations = {
  name(value) {
    return isPresent(value) && value.length > 3 || 'too short';
  },
  password(value) {
    return value || ['foo', 'bar'];
  },
  passwordConfirmation(newValue, _oldValue, { password: changedPassword }, { password }) {
    return isPresent(newValue) && (changedPassword === newValue || password === newValue) || "password doesn't match";
  },
  async(value) {
    return resolve(value);
  },
  options(value) {
    return isPresent(value);
  }
};

function dummyValidator({ key, newValue, oldValue, changes, content }) {
  let validatorFn = dummyValidations[key];

  if (typeOf(validatorFn) === 'function') {
    return validatorFn(newValue, oldValue, changes, content);
  }
}

module('Unit | Utility | changeset subchangesets', {
  beforeEach() {
    let Dummy = EmberObject.extend({
      save() {
        return resolve(this);
      }
    });
    dummyModel = Dummy.create();
    dummyModel2 = Dummy.create();
    dummyModel3 = Dummy.create();
    dummyModel4 = Dummy.create();
  }
});

// Methods
test('get subchangesets', function(assert) {
  let dummyChangeset = new Changeset(dummyModel);
  let dummyChangeset2 = new Changeset(dummyModel2);
  let dummyChangeset3 = new Changeset(dummyModel3);
  let dummyChangeset4 = new Changeset(dummyModel4);
  set(dummyChangeset, 'a', 'a');
  set(dummyChangeset, 'b', dummyChangeset2);
  set(dummyChangeset, 'c', 'c');
  let arr = ['a', dummyChangeset3, 'c', dummyChangeset4, 'd'];
  set(dummyChangeset, 'd', arr);
  set(dummyChangeset, 'e', 'e');
  let result = get(dummyChangeset, 'subChangesets');

  assert.deepEqual(result, [dummyChangeset2, dummyChangeset3, dummyChangeset4], 'should return all subchangesets');
});

test('isAllValid invalid if changeset invalid', function(assert) {
  let dummyChangeset = new Changeset(dummyModel, dummyValidator);
  dummyChangeset.set('password', false);
  let isAllValid = get(dummyChangeset, 'isAllValid');
  let isAllInvalid = get(dummyChangeset, 'isAllInvalid');

  assert.notOk(isAllValid, 'should not be valid');
  assert.ok(isAllInvalid, 'should be invalid');
});

test('isAllValid invalid if a subchangeset invalid', function(assert) {
  let dummyChangeset = new Changeset(dummyModel, dummyValidator);
  let dummyChangeset2 = new Changeset(dummyModel2, dummyValidator);
  let dummyChangeset3 = new Changeset(dummyModel3, dummyValidator);
  dummyChangeset.set('password', true);
  dummyChangeset2.set('password', false);
  dummyChangeset3.set('password', true);
  set(dummyChangeset, 'a', dummyChangeset2);
  set(dummyChangeset, 'b', dummyChangeset3);

  let isAllValid = get(dummyChangeset, 'isAllValid');
  let isAllInvalid = get(dummyChangeset, 'isAllInvalid');

  assert.notOk(isAllValid, 'should not be valid');
  assert.ok(isAllInvalid, 'should be invalid');
});

test('isAllValid valid if changeset valid and all sub changesets valid', function(assert) {
  let dummyChangeset = new Changeset(dummyModel, dummyValidator);
  let dummyChangeset2 = new Changeset(dummyModel2, dummyValidator);
  dummyChangeset.set('password', true);
  dummyChangeset2.set('password', true);
  set(dummyChangeset, 'a', dummyChangeset2);

  let isAllValid = get(dummyChangeset, 'isAllValid');
  let isAllInvalid = get(dummyChangeset, 'isAllInvalid');

  assert.ok(isAllValid, 'should be valid');
  assert.notOk(isAllInvalid, 'should not be invalid');
});

test('isAllPristine is false if changeset is not pristine', function(assert) {
  let dummyChangeset = new Changeset(dummyModel);
  dummyChangeset.set('password', false);
  let isAllPristine = get(dummyChangeset, 'isAllPristine');
  let isSomeDirty = get(dummyChangeset, 'isSomeDirty');

  assert.notOk(isAllPristine, 'should not be pristine');
  assert.ok(isSomeDirty, 'should be dirty');
});

test('isAllPristine is true if changeset is pristine', function(assert) {
  let dummyChangeset = new Changeset(dummyModel);
  let isAllPristine = get(dummyChangeset, 'isAllPristine');
  let isSomeDirty = get(dummyChangeset, 'isSomeDirty');

  assert.ok(isAllPristine, 'should be pristine');
  assert.notOk(isSomeDirty, 'should not be dirty');
});

test('execute should execute all subchangesets and replace the changesets with the content', function(assert) {
  let dummyChangeset = new Changeset(dummyModel);
  let dummyChangeset2 = new Changeset(dummyModel2);
  let dummyChangeset3 = new Changeset(dummyModel3);
  let dummyChangeset4 = new Changeset(dummyModel4);
  set(dummyChangeset, 'a', 'a');
  set(dummyChangeset2, 'a', 'a');
  set(dummyChangeset, 'b', dummyChangeset2);
  set(dummyChangeset, 'c', 'c');
  set(dummyChangeset3, 'a', 'a');
  set(dummyChangeset4, 'a', 'a');
  let arr = ['a', dummyChangeset3, 'c', dummyChangeset4, 'd'];
  set(dummyChangeset, 'd', arr);
  set(dummyChangeset, 'e', 'e');

  dummyChangeset.execute();


  assert.equal(dummyModel.get('a'), 'a', 'should update changes (a)');
  assert.equal(dummyModel.get('b'), dummyModel2, 'should update changes (b)');
  assert.equal(dummyModel2.get('a'), 'a', 'should update changes (b.a)');
  assert.equal(dummyModel.get('c'), 'c', 'should update changes (c)');
  assert.deepEqual(dummyModel.get('d'), ['a', dummyModel3, 'c', dummyModel4, 'd'], 'should update changes (d)');
  assert.equal(dummyModel3.get('a'), 'a', 'should update changes (d.1.a)');
  assert.equal(dummyModel4.get('a'), 'a', 'should update changes (d.2.a)');
  assert.equal(dummyModel.get('e'), 'e', 'should update changes (d)');
});

test('save should save all subchangesets', function(assert) {
  assert.expect(14);
  let result;
  let options;
  set(dummyModel, 'save', (dummyOptions) => {
    result = 'ok';
    options = dummyOptions;
    return resolve('saveResult');
  });
  let result2;
  let options2;
  set(dummyModel2, 'save', (dummyOptions) => {
    result2 = 'ok';
    options2 = dummyOptions;
    return resolve('saveResult');
  });
  let result3;
  let options3;
  set(dummyModel3, 'save', (dummyOptions) => {
    result3 = 'ok';
    options3 = dummyOptions;
    return resolve('saveResult');
  });

  let dummyChangeset = new Changeset(dummyModel);
  let dummyChangeset2 = new Changeset(dummyModel2);
  let dummyChangeset3 = new Changeset(dummyModel3);
  set(dummyChangeset, 'a', dummyChangeset2);
  set(dummyChangeset, 'b', [dummyChangeset3]);

  assert.equal(result, undefined, 'precondition');
  assert.equal(result2, undefined, 'precondition');
  assert.equal(result3, undefined, 'precondition');
  let promise = dummyChangeset.save('test options');
  assert.equal(result, 'ok', 'should save');
  assert.equal(result2, 'ok', 'should save');
  assert.equal(result3, 'ok', 'should save');
  assert.equal(options, 'test options', 'should proxy options when saving');
  assert.equal(options2, 'test options', 'should proxy options when saving');
  assert.equal(options3, 'test options', 'should proxy options when saving');
  assert.ok(!!promise && typeof promise.then === 'function', 'save returns a promise');

  promise.then((saveResult) => {
    assert.equal(saveResult.length, 3, 'should be array with three objects');
    assert.equal(saveResult[0].value, 'saveResult', 'save proxies to save promise of content');
    assert.equal(saveResult[1].value, 'saveResult', 'save proxies to save promise of content');
    assert.equal(saveResult[2].value, 'saveResult', 'save proxies to save promise of content');
  });
  return wait();



});




