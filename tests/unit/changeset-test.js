/* eslint-disable ember/no-computed-properties-in-native-classes */
import { Changeset, EmberChangeset, Changeset as ChangesetFactory } from 'ember-changeset';
import { settled } from '@ember/test-helpers';
import { module, test, todo } from 'qunit';
import { setupTest } from 'ember-qunit';
import { lookupValidator, Change } from 'validated-changeset';

import EmberObject, { get, set, setProperties } from '@ember/object';

import { computed } from '@ember/object';
import { reads } from '@ember/object/computed';
import ObjectProxy from '@ember/object/proxy';
import { dasherize } from '@ember/string';
import { isPresent } from '@ember/utils';
import { next } from '@ember/runloop';
import { macroCondition, dependencySatisfies } from '@embroider/macros';

function classToObj(klass) {
  return JSON.parse(JSON.stringify(klass));
}

let dummyModel;
let exampleArray = [];
let dummyValidations = {
  name(value) {
    return (isPresent(value) && value.length > 3) || 'too short';
  },
  password(value) {
    return value || ['foo', 'bar'];
  },
  passwordConfirmation(newValue, _oldValue, { password: changedPassword }, { password }) {
    return (isPresent(newValue) && (changedPassword === newValue || password === newValue)) || "password doesn't match";
  },
  async(value) {
    return Promise.resolve(value);
  },
  options(value) {
    return isPresent(value);
  },
  org: {
    isCompliant(value) {
      return !!value || 'is not set';
    },
    usa: {
      ny(value) {
        return isPresent(value) || 'must be present';
      },
    },
  },
};

let resetDummyValidations;

function dummyValidator({ key, newValue, oldValue, changes, content }) {
  let validatorFn = get(dummyValidations, key);

  if (typeof validatorFn === 'function') {
    return validatorFn(newValue, oldValue, changes, content);
  }
}

module('Unit | Utility | changeset', function (hooks) {
  setupTest(hooks);

  hooks.beforeEach(function () {
    let Dummy = class extends EmberObject {
      save() {
        return Promise.resolve(this);
      }
    };
    dummyModel = Dummy.create({ exampleArray });
    resetDummyValidations = { ...dummyValidations };
  });

  hooks.afterEach(function () {
    dummyValidations = resetDummyValidations;
  });
  /**
   * #toString
   */

  test('content can be an empty hash', async function (assert) {
    assert.expect(1);

    let emptyObject = Object.create(null);
    let dummyChangeset = Changeset(emptyObject, dummyValidator);

    assert.strictEqual(dummyChangeset.toString(), 'changeset:[object Object]');
  });

  /**
   * #error
   */

  test('#error returns the error object and keeps changes', async function (assert) {
    let dummyChangeset = Changeset(dummyModel, dummyValidator);
    let expectedResult = { name: { validation: 'too short', value: 'a' } };
    dummyChangeset.set('name', 'a');

    assert.deepEqual(classToObj(dummyChangeset.error), expectedResult, 'should return error object');
    assert.deepEqual(classToObj(dummyChangeset.get('error').name), expectedResult.name, 'should return nested error');
    assert.deepEqual(classToObj(dummyChangeset.get('error.name')), expectedResult.name, 'should return nested error');
    assert.deepEqual(dummyChangeset.change, { name: 'a' }, 'should return change object');
    assert.deepEqual(dummyChangeset.get('change.name'), 'a', 'should return nested change');
    assert.deepEqual(dummyChangeset.get('change').name, 'a', 'should return nested change');
  });

  test('can get nested values in the error object', function (assert) {
    let dummyChangeset = Changeset(dummyModel, dummyValidator);
    let expectedResult = { validation: 'too short', value: 'a' };
    dummyChangeset.set('name', 'a');

    assert.deepEqual(
      classToObj(dummyChangeset.get('error.name')),
      expectedResult,
      'should return error object for `name` key'
    );
  });

  /**
   * #change
   */

  test('#change returns the changes object', async function (assert) {
    let dummyChangeset = Changeset(dummyModel);
    let expectedResult = { name: 'a' };
    dummyChangeset.set('name', 'a');

    assert.deepEqual(get(dummyChangeset, 'change'), expectedResult, 'should return changes object');
    assert.deepEqual(dummyChangeset.name, 'a', 'should return new value');
    assert.deepEqual(dummyModel.name, undefined, 'should return original value');
  });

  test('#change supports `undefined`', async function (assert) {
    let model = { name: 'a' };
    let dummyChangeset = Changeset(model);
    let expectedResult = { name: undefined };
    dummyChangeset.set('name', undefined);

    assert.deepEqual(
      get(dummyChangeset, 'change'),
      expectedResult,
      'property changed to `undefined` should be included in change object'
    );
  });

  test('#change works with arrays', async function (assert) {
    let dummyChangeset = Changeset(dummyModel);
    const newArray = [...exampleArray, 'new'];
    let expectedResult = { exampleArray: newArray, name: 'a' };

    dummyChangeset.set('name', 'a');
    dummyChangeset.set('exampleArray', newArray);

    assert.deepEqual(get(dummyChangeset, 'change'), expectedResult, 'should return new changes');
    assert.deepEqual(dummyChangeset.exampleArray, expectedResult.exampleArray, 'should return changes object');
    assert.deepEqual(dummyChangeset.name, 'a', 'should return new value');
    assert.deepEqual(dummyModel.exampleArray, [], 'should keep original array');
    assert.deepEqual(dummyModel.name, undefined, 'should keep original array');
  });

  /**
   * #errors
   */
  test('#errors returns the error object and keeps changes', async function (assert) {
    let dummyChangeset = Changeset(dummyModel, dummyValidator);
    let expectedResult = [{ key: 'name', validation: 'too short', value: 'a' }];
    dummyChangeset.set('name', 'a');

    assert.deepEqual(dummyChangeset.errors, expectedResult, 'should return errors object');
    assert.deepEqual(dummyChangeset.get('errors'), expectedResult, 'should return nested errors');
    assert.deepEqual(dummyChangeset.change, { name: 'a' }, 'should return change object');
  });

  test('can get nested values in the errors object', function (assert) {
    let dummyChangeset = Changeset(dummyModel, dummyValidator);
    dummyChangeset.set('unknown', 'wat');
    dummyChangeset.set('org.usa.ny', '');
    dummyChangeset.set('name', '');

    let expectedErrors = [
      { key: 'org.usa.ny', validation: 'must be present', value: '' },
      { key: 'name', validation: 'too short', value: '' },
    ];
    assert.deepEqual(
      dummyChangeset.get('errors'),
      expectedErrors,
      'should return errors object for `org.usa.ny` key and `name` key'
    );
  });

  /**
   * #changes
   */

  /**
   * #data
   */

  test('data reads the changeset CONTENT', async function (assert) {
    let dummyChangeset = Changeset(dummyModel);

    assert.strictEqual(get(dummyChangeset, 'data'), dummyModel, 'should return data');
  });

  test('data is readonly', async function (assert) {
    assert.expect(1);

    let dummyChangeset = Changeset(dummyModel);

    try {
      set(dummyChangeset, 'data', { foo: 'bar' });
    } catch ({ message }) {
      assert.throws(
        ({ message }) => message === "Cannot set read-only property 'data' on object: changeset:[object Object]",
        'should throw error'
      );
    }
  });

  /**
   * #isValid
   */

  /**
   * #isInvalid
   */

  /**
   * #isPristine
   */

  test("isPristine returns true if changes are equal to content's values", async function (assert) {
    dummyModel.set('name', 'Bobby');
    dummyModel.set('thing', 123);
    dummyModel.set('nothing', null);
    let dummyChangeset = Changeset(dummyModel, dummyValidator);
    dummyChangeset.set('name', 'Bobby');
    dummyChangeset.set('nothing', null);

    assert.ok(dummyChangeset.get('isPristine'), 'should be pristine');
  });

  test("isPristine returns false if changes are not equal to content's values", async function (assert) {
    dummyModel.set('name', 'Bobby');
    let dummyChangeset = Changeset(dummyModel, dummyValidator);
    dummyChangeset.set('name', 'Bobby');
    dummyChangeset.set('thing', 123);

    assert.notOk(dummyChangeset.get('isPristine'), 'should not be pristine');
  });

  test('isPristine works with `null` values', async function (assert) {
    dummyModel.set('name', null);
    dummyModel.set('age', 15);
    let dummyChangeset = Changeset(dummyModel);

    assert.ok(dummyChangeset.get('isPristine'), 'should be pristine');

    dummyChangeset.set('name', 'Kenny');
    assert.notOk(dummyChangeset.get('isPristine'), 'should not be pristine');

    dummyChangeset.set('name', null);
    assert.ok(dummyChangeset.get('isPristine'), 'should be pristine');
  });

  /**
   * #isDirty
   */
  test('changeset accepts changeset keys', async function (assert) {
    let dummyChangeset = Changeset(dummyModel, dummyValidator, null, { changesetKeys: ['name'] });
    dummyChangeset.set('_somePrivate', 'a');

    assert.false(dummyChangeset.isDirty, 'changeset is not dirty');
  });

  test('changeset accepts changeset keys without validations', async function (assert) {
    let dummyChangeset = Changeset(dummyModel, null, null, { changesetKeys: ['name'] });
    dummyChangeset.set('_somePrivate', 'a');

    assert.false(dummyChangeset.isDirty, 'changeset is not dirty');
  });

  test('changeset isDirty property notifies dependent computed properties', async function (assert) {
    class Model extends EmberObject {
      // single
      @computed
      get changeset() {
        return Changeset(dummyModel, dummyValidator);
      }

      get isChangesetDirty() {
        return this.changeset.isDirty;
      }

      // double
      @computed
      get changesets() {
        let arr = [Changeset(dummyModel, dummyValidator), Changeset(dummyModel, dummyValidator)];
        return arr;
      }

      get hasDirtyChangesets() {
        return this.dirtyChangesets.length > 0;
      }

      get dirtyChangesets() {
        return this.changesets.filter((c) => c.isDirty);
      }
    }

    let model = Model.create();

    assert.notOk(get(model, 'hasDirtyChangesets'), 'no dirty changesets');
    assert.strictEqual(model.dirtyChangesets.length, 0, 'has 0 dirty changesets');
    assert.false(get(model, 'isChangesetDirty'), 'changeset not dirty');

    let changesets = get(model, 'changesets');

    changesets[0].set('name', 'new name');
    assert.strictEqual(model.dirtyChangesets.length, 1, 'has one dirty changesets');
    assert.ok(get(model, 'hasDirtyChangesets'), 'has dirty changesets');

    let changeset = get(model, 'changeset');
    set(changeset, 'name', 'other new name');
    assert.true(get(model, 'isChangesetDirty'), 'changeset is dirty');
  });

  test('#set does not dirty changeset with same date', async function (assert) {
    dummyModel.createTime = new Date('2013-05-01');
    const dummyChangeset = Changeset(dummyModel);
    dummyChangeset.set('createTime', new Date('2013-05-01'));

    assert.notOk(dummyChangeset.isDirty);
  });

  /**
   * #get
   */

  test('#get proxies to content', async function (assert) {
    set(dummyModel, 'name', 'Jim Bob');
    let dummyChangeset = Changeset(dummyModel);
    let result = get(dummyChangeset, 'name');

    assert.strictEqual(result, 'Jim Bob', 'should proxy to content');
  });

  test('#get returns the content when the proxied content is a class', async function (assert) {
    class Moment {
      constructor(date) {
        this.date = date;
      }
    }

    let d = new Date('2015');
    let momentInstance = new Moment(d);
    let c = Changeset({
      startDate: momentInstance,
    });

    let newValue = c.get('startDate');
    // newValue is a proxy
    assert.strictEqual(newValue.date, d, 'correct date on moment object');
  });

  test('#get returns the change when with properties added after', async function (assert) {
    class Moment {
      _isMomentObject = true;
      constructor(date) {
        this.date = date;
      }
    }

    let d = new Date('2015');
    let momentInstance = new Moment(d);
    // added properties that shouldn't be returned when we replace startDate'
    momentInstance._isUTC = true;
    let c = Changeset({
      startDate: momentInstance,
    });

    let newValue = c.get('startDate');
    assert.strictEqual(newValue.date, d, 'correct date on moment object');

    let newMomentInstance = new Moment(d);
    // replace start date
    c.set('startDate', newMomentInstance);

    newValue = c.get('startDate');
    assert.strictEqual(newValue.date, d, 'correct date on moment object');
    assert.notOk(newValue._isUTC, 'does not have changes from original instance');
  });

  test('#get merges sibling keys', async function (assert) {
    class Moment {
      _isMomentObject = true;
      constructor(date) {
        this.date = date;
      }
    }

    let d = new Date('2015');
    let momentInstance = new Moment(d);
    let c = Changeset({
      startDate: momentInstance,
    });

    let newValue = c.get('startDate');
    assert.ok(newValue.content instanceof Moment, 'correct instance');
    assert.strictEqual(newValue.date, d, 'correct date on moment object');

    const newDate = new Date('2020');
    c.set('startDate.date', newDate);

    newValue = c.get('startDate');
    assert.ok(newValue.content instanceof Moment, 'correct instance');
    assert.strictEqual(newValue.date, newDate, 'correct date on moment object');
    assert.true(newValue._isMomentObject, 'has original content value');
  });

  test('#get returns change if present', async function (assert) {
    set(dummyModel, 'name', 'Jim Bob');
    let dummyChangeset = Changeset(dummyModel);
    set(dummyChangeset, 'name', 'Milton Waddams');
    let result = get(dummyChangeset, 'name');

    assert.strictEqual(result, 'Milton Waddams', 'should proxy to change');
  });

  test('#get returns change that is a blank value', async function (assert) {
    set(dummyModel, 'name', 'Jim Bob');
    let dummyChangeset = Changeset(dummyModel);
    set(dummyChangeset, 'name', '');
    let result = get(dummyChangeset, 'name');

    assert.strictEqual(result, '', 'should proxy to change');
  });

  test('#get returns change that has undefined as value', async function (assert) {
    set(dummyModel, 'name', 'Jim Bob');
    let dummyChangeset = Changeset(dummyModel);
    set(dummyChangeset, 'name', undefined);
    let result = get(dummyChangeset, 'name');

    assert.strictEqual(result, undefined, 'should proxy to change');
  });

  test('#get returns change that has array as sibling', async function (assert) {
    set(dummyModel, 'name', 'Bob');
    set(dummyModel, 'creds', ['burgers']);
    let dummyChangeset = Changeset(dummyModel);
    set(dummyChangeset, 'name', 'Burdger');

    assert.strictEqual(get(dummyChangeset, 'name'), 'Burdger', 'should proxy name to change');
    assert.deepEqual(get(dummyChangeset, 'creds'), ['burgers'], 'should proxy creds to change');

    set(dummyChangeset, 'creds', ['fries']);
    assert.strictEqual(get(dummyChangeset, 'name'), 'Burdger', 'should proxy name to change');
    assert.deepEqual(get(dummyChangeset, 'creds'), ['fries'], 'should proxy creds to change after change');
  });

  test('nested objects will return correct values', async function (assert) {
    set(dummyModel, 'org', {
      asia: { sg: '_initial' }, // for the sake of disambiguating nulls
      usa: {
        ca: null,
        ny: null,
        ma: { name: null },
      },
    });

    let dummyChangeset = Changeset(dummyModel, dummyValidator);
    assert.strictEqual(dummyChangeset.get('org.asia.sg'), '_initial', 'returns initial value');
    dummyChangeset.set('org.asia.sg', 'sg');
    assert.strictEqual(dummyChangeset.get('org.asia.sg'), 'sg', 'returns newly set value');
  });

  test('nested objects can contain arrays', async function (assert) {
    assert.expect(7);
    setProperties(dummyModel, {
      name: 'Bob',
      contact: {
        emails: ['bob@email.com', 'the_bob@email.com'],
      },
    });

    assert.deepEqual(
      dummyModel.get('contact.emails'),
      ['bob@email.com', 'the_bob@email.com'],
      'returns initial model value'
    );
    let dummyChangeset = Changeset(dummyModel, dummyValidator);
    assert.strictEqual(dummyChangeset.get('name'), 'Bob', 'returns changeset initial value');
    assert.deepEqual(
      dummyChangeset.get('contact.emails'),
      ['bob@email.com', 'the_bob@email.com'],
      'returns changeset initial value'
    );

    dummyChangeset.set('contact.emails', ['fred@email.com', 'the_fred@email.com']);

    assert.deepEqual(
      dummyChangeset.get('contact.emails'),
      ['fred@email.com', 'the_fred@email.com'],
      'returns changeset changed value'
    );

    dummyChangeset.rollback();
    assert.deepEqual(
      dummyChangeset.get('contact.emails'),
      ['bob@email.com', 'the_bob@email.com'],
      'returns changeset rolledback value'
    );
    dummyChangeset.set('contact.emails', ['fred@email.com', 'the_fred@email.com']);
    assert.deepEqual(
      dummyChangeset.get('contact.emails'),
      ['fred@email.com', 'the_fred@email.com'],
      'returns changeset changed value'
    );

    dummyChangeset.execute();
    assert.deepEqual(dummyModel.contact.emails, ['fred@email.com', 'the_fred@email.com'], 'returns model saved value');
  });

  test('#getted Object proxies to underlying method', async function (assert) {
    assert.expect(3);

    class Dog {
      constructor(b) {
        this.breed = b;
      }

      bark() {
        return `woof i'm a ${this.breed}`;
      }
    }

    let model = {
      foo: {
        bar: {
          dog: new Dog('shiba inu, wow'),
        },
      },
    };

    {
      let c = Changeset(model);
      let actual = c.get('foo.bar.dog').bark();
      let expectedResult = "woof i'm a shiba inu, wow";
      assert.strictEqual(actual, expectedResult, 'should proxy to underlying method');
    }

    {
      let c = Changeset(model);
      let actual = get(c, 'foo.bar.dog');
      let expectedResult = get(model, 'foo.bar.dog');
      assert.strictEqual(actual, expectedResult, 'using Ember.get will work');
    }

    {
      let c = Changeset(model);
      let actual = get(c, 'foo.bar.dog');
      let expectedResult = get(model, 'foo.bar.dog');
      assert.strictEqual(actual, expectedResult, 'you dont have to use .content');
    }
  });

  test('#get works if content is undefined for nested key', async function (assert) {
    const model = {};

    const c = Changeset(model);
    c.set('foo.bar.cat', {
      color: 'red',
    });
    const cat = c.get('foo.bar.cat');
    assert.strictEqual(cat.color, 'red');
  });

  /**
   * #set
   */

  test('#set adds a change if valid', async function (assert) {
    let expectedChanges = [{ key: 'name', value: 'foo' }];
    let dummyChangeset = Changeset(dummyModel);
    dummyChangeset.set('name', 'foo');
    let changes = get(dummyChangeset, 'changes');

    assert.strictEqual(dummyModel.name, undefined, 'should keep change');
    assert.strictEqual(dummyChangeset.get('name'), 'foo', 'should have new change');

    assert.deepEqual(changes, expectedChanges, 'should add change');
  });

  test('#set Ember.set works', async function (assert) {
    let expectedChanges = [{ key: 'name', value: 'foo' }];
    let dummyChangeset = Changeset(dummyModel);
    set(dummyChangeset, 'name', 'foo');

    assert.strictEqual(dummyModel.name, undefined, 'should keep change');
    assert.strictEqual(dummyChangeset.get('name'), 'foo', 'should have new change');

    let changes = get(dummyChangeset, 'changes');
    assert.deepEqual(changes, expectedChanges, 'should add change');

    dummyChangeset.execute();

    assert.strictEqual(dummyModel.name, 'foo', 'should be applied');
    assert.strictEqual(dummyChangeset.get('name'), 'foo', 'should have new change');
  });

  test('#set Ember.set works for nested', async function (assert) {
    set(dummyModel, 'name', {});
    let dummyChangeset = Changeset(dummyModel);
    set(dummyChangeset, 'name.short', 'boo');

    assert.strictEqual(dummyChangeset.name.short, 'boo', 'should have new change');

    let changes = get(dummyChangeset, 'changes');
    assert.deepEqual(changes, [{ key: 'name.short', value: 'boo' }], 'changes with nested key Ember.set');

    dummyChangeset.execute();

    assert.strictEqual(dummyModel.name.short, 'boo', 'has new property');
  });

  test('#set adds a change if the key is an object', async function (assert) {
    set(dummyModel, 'org', {
      usa: {
        mn: 'mn',
        ny: 'ny',
        nz: 'nz',
      },
      landArea: 100,
    });

    let c = Changeset(dummyModel);
    c.set('org.usa.ny', 'foo');

    assert.strictEqual(dummyModel.org.usa.ny, 'ny', 'should keep change');
    assert.strictEqual(c.get('org.usa.ny'), 'foo', 'should have new change');
    assert.strictEqual(c.get('org.usa.mn'), 'mn', 'should have sibling keys');
    assert.strictEqual(c.get('org.landArea'), 100, 'should have sibling keys');

    let expectedChanges = [{ key: 'org.usa.ny', value: 'foo' }];
    let changes = get(c, 'changes');

    assert.deepEqual(changes, expectedChanges, 'should add change');
  });

  test('#set adds a change for a Date', async function (assert) {
    const d = new Date();
    let expectedChanges = [{ key: 'dateOfBirth', value: d }];
    let dummyChangeset = Changeset(dummyModel);
    dummyChangeset.set('dateOfBirth', d);
    let changes = get(dummyChangeset, 'changes');

    assert.strictEqual(dummyModel.dateOfBirth, undefined, 'should not have value');
    assert.deepEqual(dummyChangeset.get('dateOfBirth'), d, 'should have new change');

    assert.deepEqual(changes, expectedChanges, 'should add change');
  });

  test('#set adds a change for a Date if it already exists on object', async function (assert) {
    const model = { dateOfBirth: new Date() };
    const d = new Date('March 25, 1990');
    let expectedChanges = [{ key: 'dateOfBirth', value: d }];
    let dummyChangeset = Changeset(model);
    dummyChangeset.set('dateOfBirth', d);
    let changes = get(dummyChangeset, 'changes');

    assert.ok(model.dateOfBirth, 'model has original date');
    assert.strictEqual(dummyChangeset.get('dateOfBirth'), d, 'should have new change');

    assert.deepEqual(changes, expectedChanges, 'should add change');
  });

  test('#set use native setters with nested doesnt work', async function (assert) {
    set(dummyModel, 'org', {
      usa: {
        ny: 'ny',
      },
    });

    let c = Changeset(dummyModel);
    c.org.usa.ny = 'foo';

    assert.strictEqual(dummyModel.org.usa.ny, 'foo', 'change applied to model');
    assert.strictEqual(c.get('org.usa.ny'), 'foo', 'should have new change');

    let changes = get(c, 'changes');
    assert.deepEqual(changes, [], 'no changes');
  });

  test('#set use native setters at single level', async function (assert) {
    dummyModel.org = 'ny';

    let c = Changeset(dummyModel);
    c.org = 'foo';

    assert.strictEqual(dummyModel.org, 'ny', 'should keep change');
    assert.strictEqual(c.org, 'foo', 'should have new change');

    let changes = get(c, 'changes');
    assert.deepEqual(changes, [{ key: 'org', value: 'foo' }], 'should add change');
  });

  test('#set adds a change if value is an object', async function (assert) {
    class Moment {
      constructor(date) {
        this.date = date;
      }
    }

    let c = Changeset(dummyModel);
    let d = new Date();
    let momentInstance = new Moment(d);
    c.set('startDate', momentInstance);

    let expectedChanges = [{ key: 'startDate', value: momentInstance }];
    let changes = get(c, 'changes');

    assert.deepEqual(changes, expectedChanges, 'should add change');

    let newValue = c.get('startDate');
    assert.strictEqual(newValue.date, d, 'correct date on moment object');

    newValue = get(c, 'startDate');
    assert.strictEqual(newValue.date, d, 'correct date on moment object');
  });

  test('#set adds a change if value is an object with existing value', async function (assert) {
    class Moment {
      constructor(date) {
        this.date = date;
      }
    }

    let d = new Date();
    // existing value
    dummyModel.set('startDate', new Moment(d));
    dummyModel.set('name', 'Bobby');

    let c = Changeset(dummyModel);
    d = new Date();
    let momentInstance = new Moment(d);
    c.set('startDate', momentInstance);

    let expectedChanges = [{ key: 'startDate', value: momentInstance }];
    let changes = get(c, 'changes');

    assert.deepEqual(changes, expectedChanges, 'should add change');

    let newValue = c.get('startDate');
    assert.strictEqual(newValue.date, d, 'correct date on moment object');

    newValue = get(c, 'startDate');
    assert.strictEqual(newValue.date, d, 'correct date on moment object');
  });

  test('#set supports `undefined`', async function (assert) {
    let model = EmberObject.create({ name: 'foo' });
    let dummyChangeset = Changeset(model);

    dummyChangeset.set('name', undefined);
    assert.strictEqual(get(dummyChangeset, 'name'), undefined, 'should return changed value');
    assert.deepEqual(get(dummyChangeset, 'changes'), [{ key: 'name', value: undefined }], 'should add change');
  });

  test('#set does not add a change if new value equals old value', async function (assert) {
    let model = EmberObject.create({ name: 'foo' });
    let dummyChangeset = Changeset(model);

    dummyChangeset.set('name', 'foo');
    assert.deepEqual(get(dummyChangeset, 'changes'), [], 'change is not added if new value equals old value');
  });

  test('#set does not add a change if new value equals old value and `skipValidate` is true', async function (assert) {
    let model = EmberObject.create({ name: 'foo' });
    let dummyChangeset = Changeset(model, {}, null, { skipValidate: true });

    dummyChangeset.set('name', 'foo');
    assert.deepEqual(get(dummyChangeset, 'changes'), [], 'change is not added if new value equals old value');
  });

  test('#set removes a change if set back to original value', async function (assert) {
    let model = EmberObject.create({ name: 'foo' });
    let dummyChangeset = Changeset(model);

    dummyChangeset.set('name', 'bar');
    assert.deepEqual(
      get(dummyChangeset, 'changes'),
      [{ key: 'name', value: 'bar' }],
      'change is added when value is different than original value'
    );

    dummyChangeset.set('name', 'foo');
    assert.deepEqual(get(dummyChangeset, 'changes'), [], 'change is removed when new value matches original value');
  });

  test('#set removes a change if set back to original value when obj is ProxyObject', async function (assert) {
    let model = ObjectProxy.create({ content: { name: 'foo' } });
    let dummyChangeset = Changeset(model);

    dummyChangeset.set('name', 'bar');
    assert.deepEqual(
      get(dummyChangeset, 'changes'),
      [{ key: 'name', value: 'bar' }],
      'change is added when value is different than original value'
    );

    dummyChangeset.set('name', 'foo');
    assert.deepEqual(get(dummyChangeset, 'changes'), [], 'change is removed when new value matches original value');
  });

  test('#set does add a change if invalid', async function (assert) {
    let expectedErrors = [
      { key: 'name', validation: 'too short', value: 'a' },
      { key: 'password', validation: ['foo', 'bar'], value: false },
    ];
    let dummyChangeset = Changeset(dummyModel, dummyValidator);
    dummyChangeset.set('name', 'a');
    dummyChangeset.set('password', false);
    let changes = get(dummyChangeset, 'changes');
    let errors = get(dummyChangeset, 'errors');
    let isValid = get(dummyChangeset, 'isValid');
    let isInvalid = get(dummyChangeset, 'isInvalid');

    let expectedChanges = [
      { key: 'name', value: 'a' },
      { key: 'password', value: false },
    ];
    assert.deepEqual(changes, expectedChanges, 'should add change');
    assert.deepEqual(errors, expectedErrors, 'should have errors');
    assert.notOk(isValid, 'should not be valid');
    assert.ok(isInvalid, 'should be invalid');
  });

  test('#set adds the change without validation if `skipValidate` option is set', async function (assert) {
    let expectedChanges = [{ key: 'password', value: false }];

    let dummyChangeset = Changeset(dummyModel, dummyValidator, null, { skipValidate: true });
    dummyChangeset.set('password', false);
    let changes = get(dummyChangeset, 'changes');

    assert.deepEqual(changes, expectedChanges, 'should add change');
  });

  test('#set should remove nested changes when setting roots', async function (assert) {
    set(dummyModel, 'org', {
      usa: {
        ny: 'ny',
        ca: 'ca',
      },
    });

    let c = Changeset(dummyModel);
    c.set('org.usa.ny', 'foo');
    c.set('org.usa.ca', 'bar');
    c.set('org', 'no usa for you');

    let actual = get(c, 'changes');
    let expectedResult = [{ key: 'org', value: 'no usa for you' }];
    assert.deepEqual(actual, expectedResult, 'removes nested changes');
  });

  test('#set operating on complex properties should be functional', async function (assert) {
    const model = {
      id: 1,
      label: 'Reason',
      options: ['test1', 'test2', 'test3'],
    };
    let dummyChangeset = Changeset(model);

    let options = dummyChangeset.options;
    options = options.filter((o, i) => (i === options.indexOf('test2') ? false : true));
    dummyChangeset.set('options', [...options]);

    assert.deepEqual(model.options, ['test1', 'test2', 'test3'], 'should keep original');
    let expectedChanges = [{ key: 'options', value: ['test1', 'test3'] }];
    let changes = get(dummyChangeset, 'changes');
    assert.deepEqual(changes, expectedChanges, 'should add change');
    assert.deepEqual(dummyChangeset.options, expectedChanges[0].value, 'should have new values');
  });

  test('#set Ember.set with Object actually does work TWICE for nested', async function (assert) {
    set(dummyModel, 'name', {});
    let title1 = { id: 'Mr', description: 'Mister' };
    let title2 = { id: 'Mrs', description: 'Missus' };
    let dummyChangeset = Changeset(dummyModel);
    set(dummyChangeset, 'name.title', title1);

    assert.strictEqual(get(dummyModel, 'name.title.id'), undefined, 'should not have new change');
    assert.strictEqual(dummyChangeset.name.title.id, 'Mr', 'should have new change');
    assert.strictEqual(dummyChangeset.get('name.title.id'), 'Mr', 'should have new change using get');

    let changes = dummyChangeset.changes;
    assert.deepEqual(changes, [{ key: 'name.title', value: title1 }], 'changes with nested key Ember.set');

    set(dummyChangeset, 'name.title', title2);

    assert.strictEqual(get(dummyModel, 'name.title.id'), undefined, 'should not have new change');
    assert.strictEqual(dummyChangeset.name.title.id, 'Mrs', 'should have new change');
    assert.strictEqual(dummyChangeset.get('name.title.id'), 'Mrs', 'should have new change using get');

    changes = dummyChangeset.changes;
    assert.deepEqual(changes, [{ key: 'name.title', value: title2 }], 'changes with nested key Ember.set');

    dummyChangeset.execute();

    assert.strictEqual(dummyModel.name.title.id, 'Mrs', 'has new property');
  });

  test('#set Ember.set with Ember Data Object actually does work TWICE for nested', async function (assert) {
    let store = this.owner.lookup('service:store');

    let mockProfileModel = store.createRecord('profile');
    let mockUserModel = store.createRecord('user', {
      profile: mockProfileModel,
      save: function () {
        return Promise.resolve(this);
      },
    });

    let dummyChangeset = Changeset(mockUserModel);
    let pet1 = store.createRecord('dog', { breed: 'jazzy' });
    let pet2 = store.createRecord('dog', { breed: 'hands' });

    set(dummyChangeset, 'profile.pet', pet1);

    assert.strictEqual(dummyChangeset.profile.pet.breed, 'jazzy', 'should have change');
    assert.strictEqual(dummyChangeset.get('profile.pet.breed'), 'jazzy', 'should have change using get');
    assert.strictEqual(dummyChangeset.get('profile.pet').breed, 'jazzy', 'should have change using get');
    assert.strictEqual(dummyChangeset.get('profile').pet.breed, 'jazzy', 'should have change using get');

    let changes = dummyChangeset.changes;
    assert.strictEqual(changes[0].value.breed, 'jazzy', 'changes with nested key Ember.set');

    set(dummyChangeset, 'profile.pet', pet2);

    assert.strictEqual(dummyChangeset.profile.pet.breed, 'hands', 'should have new change');
    assert.strictEqual(dummyChangeset.get('profile.pet.breed'), 'hands', 'should have new change using get');
    assert.strictEqual(dummyChangeset.get('profile.pet').breed, 'hands', 'should have new change using get');
    assert.strictEqual(dummyChangeset.get('profile').pet.breed, 'hands', 'should have new change using get');

    changes = dummyChangeset.changes;
    assert.strictEqual(changes[0].value.breed, 'hands', 'changes with nested key Ember.set');

    dummyChangeset.execute();

    assert.strictEqual(get(mockUserModel, 'profile.pet.breed'), 'hands', 'has new property');
  });

  test('#set with Object should work TWICE for nested', async function (assert) {
    set(dummyModel, 'name', {});
    let title1 = { id: 'Mr', description: 'Mister' };
    let title2 = { id: 'Mrs', description: 'Missus' };
    let dummyChangeset = Changeset(dummyModel);
    dummyChangeset.set('name.title', title1);

    assert.strictEqual(get(dummyModel, 'name.title.id'), undefined, 'should not have new change');
    assert.strictEqual(dummyChangeset.name.title.id, 'Mr', 'should have new change');
    assert.strictEqual(dummyChangeset.get('name.title.id'), 'Mr', 'should have new change using get');

    let changes = dummyChangeset.changes;
    assert.deepEqual(changes, [{ key: 'name.title', value: title1 }], 'changes with nested key Ember.set');

    dummyChangeset.set('name.title', title2);

    assert.strictEqual(get(dummyModel, 'name.title.id'), undefined, 'should not have new change');
    assert.strictEqual(dummyChangeset.name.title.id, 'Mrs', 'should have new change');
    assert.strictEqual(dummyChangeset.get('name.title.id'), 'Mrs', 'should have new change using get');

    changes = dummyChangeset.changes;
    assert.deepEqual(changes, [{ key: 'name.title', value: title2 }], 'changes with nested key Ember.set');

    dummyChangeset.execute();

    assert.strictEqual(dummyModel.name.title.id, 'Mrs', 'has new property');
  });

  test('#set reports correct isDirty for async belongsTo relationship', async function (assert) {
    let store = this.owner.lookup('service:store');
    let profileModel = store.createRecord('profile');
    let mockUserModel = store.createRecord('user', {
      profile: profileModel,
    });
    let dummyChangeset = Changeset(mockUserModel);

    assert.false(dummyChangeset.isDirty, 'is not dirty initially');

    let updatedProfileModel = store.createRecord('profile');
    dummyChangeset.set('profile', updatedProfileModel);

    assert.true(dummyChangeset.isDirty, 'is now dirty');

    dummyChangeset.set('profile', profileModel);

    assert.false(dummyChangeset.isDirty, 'is not dirty after reset');
  });

  test('it works with setProperties', async function (assert) {
    let dummyChangeset = Changeset(dummyModel);
    let expectedResult = [
      { key: 'firstName', value: 'foo' },
      { key: 'lastName', value: 'bar' },
    ];
    dummyChangeset.setProperties({ firstName: 'foo', lastName: 'bar' });

    assert.deepEqual(get(dummyChangeset, 'changes'), expectedResult, 'precondition');
  });

  test('it accepts async validations', async function (assert) {
    let dummyChangeset = Changeset(dummyModel, dummyValidator);
    let expectedChanges = [{ key: 'async', value: true }];
    let expectedError = { async: { validation: 'is invalid', value: 'is invalid' } };

    await dummyChangeset.set('async', true);
    await settled();
    assert.deepEqual(get(dummyChangeset, 'changes'), expectedChanges, 'should set change');

    dummyChangeset.set('async', 'is invalid');
    await settled();
    assert.deepEqual(classToObj(get(dummyChangeset, 'error')), expectedError, 'should set error');
  });

  test('it clears errors when setting to original value', async function (assert) {
    set(dummyModel, 'name', 'Jim Bob');
    let dummyChangeset = Changeset(dummyModel, dummyValidator);
    dummyChangeset.set('name', '');

    assert.ok(get(dummyChangeset, 'isInvalid'), 'should be invalid');
    dummyChangeset.set('name', 'Jim Bob');
    assert.ok(get(dummyChangeset, 'isValid'), 'should be valid');
    assert.notOk(get(dummyChangeset, 'isInvalid'), 'should be valid');
  });

  test('it clears errors when setting to original value when nested', async function (assert) {
    set(dummyModel, 'org', {
      usa: { ny: 'vaca' },
    });
    let dummyChangeset = Changeset(dummyModel, dummyValidator);
    dummyChangeset.set('org.usa.ny', '');

    assert.ok(get(dummyChangeset, 'isInvalid'), 'should be invalid');
    dummyChangeset.set('org.usa.ny', 'vaca');
    assert.ok(get(dummyChangeset, 'isValid'), 'should be valid');
    assert.notOk(get(dummyChangeset, 'isInvalid'), 'should be valid');
  });

  test('it clears errors when setting to original value when nested Booleans', async function (assert) {
    set(dummyModel, 'org', {
      isCompliant: true,
    });
    let dummyChangeset = Changeset(dummyModel, dummyValidator);
    dummyChangeset.set('org.isCompliant', false);

    assert.ok(get(dummyChangeset, 'isInvalid'), 'should be invalid');
    dummyChangeset.set('org.isCompliant', true);
    assert.ok(get(dummyChangeset, 'isValid'), 'should be valid');
    assert.notOk(get(dummyChangeset, 'isInvalid'), 'should be valid');
  });

  test('#set should delete nested changes when equal', async function (assert) {
    set(dummyModel, 'org', {
      usa: { ny: 'i need a vacation' },
    });

    let c = Changeset(dummyModel, dummyValidator, dummyValidations);
    c.set('org.usa.br', 'whoop');

    let actual = get(c, 'change.org.usa.ny');
    let expectedResult = undefined;
    assert.strictEqual(actual, expectedResult, 'should clear nested key');
  });

  test('#set works when replacing an Object with an primitive', async function (assert) {
    let model = { foo: { bar: { baz: 42 } } };

    let c = Changeset(model);
    assert.deepEqual(c.get('foo.bar.baz'), get(model, 'foo.bar.baz'), 'model and changeset in sync');

    c.set('foo', 'not an object anymore');
    c.execute();
    assert.deepEqual(c.get('foo'), get(model, 'foo'));
  });

  test('#set works when setting property multiple times', async function (assert) {
    const expectedChanges = [{ key: 'age', value: '90' }];
    let dummyChangeset = Changeset({ age: '10' });
    dummyChangeset.set('age', '80');
    dummyChangeset.set('age', '10');
    dummyChangeset.set('age', '90');

    const changes = dummyChangeset.changes;

    assert.strictEqual(dummyModel.age, undefined);
    assert.strictEqual(dummyChangeset.get('age'), '90');

    assert.deepEqual(changes, expectedChanges);
    assert.ok(dummyChangeset.isDirty);
    assert.deepEqual(dummyChangeset.change, { age: '90' });
  });

  test('#set works after save', async function (assert) {
    dummyModel['org'] = {
      usa: {
        mn: 'mn',
        ny: 'ny',
      },
    };

    const c = Changeset(dummyModel);
    c.set('org.usa.ny', 'NY');
    c.set('org.usa.mn', 'MN');

    assert.strictEqual(c.get('org.usa.ny'), 'NY');
    assert.strictEqual(c.get('org.usa.mn'), 'MN');
    assert.strictEqual(dummyModel.org.usa.ny, 'ny');
    assert.strictEqual(dummyModel.org.usa.mn, 'mn');

    c.save();

    assert.strictEqual(c.get('org.usa.ny'), 'NY');
    assert.strictEqual(c.get('org.usa.mn'), 'MN');
    assert.strictEqual(dummyModel.org.usa.ny, 'NY');
    assert.strictEqual(dummyModel.org.usa.mn, 'MN');

    c.set('org.usa.ny', 'nil');

    assert.strictEqual(c.get('org.usa.ny'), 'nil');
    assert.strictEqual(c.get('org.usa.mn'), 'MN');
    assert.strictEqual(dummyModel.org.usa.ny, 'NY');
    assert.strictEqual(dummyModel.org.usa.mn, 'MN');

    c.save();

    assert.strictEqual(c.get('org.usa.ny'), 'nil');
    assert.strictEqual(c.get('org.usa.mn'), 'MN');
    assert.strictEqual(dummyModel.org.usa.ny, 'nil');
    assert.strictEqual(dummyModel.org.usa.mn, 'MN');

    c.set('org.usa.ny', 'nil2');
    c.set('org.usa.mn', 'undefined');

    assert.strictEqual(c.get('org.usa.ny'), 'nil2');
    assert.strictEqual(c.get('org.usa.mn'), 'undefined');
    assert.strictEqual(dummyModel.org.usa.ny, 'nil');
    assert.strictEqual(dummyModel.org.usa.mn, 'MN');

    c.save();

    assert.strictEqual(c.get('org.usa.ny'), 'nil2');
    assert.strictEqual(c.get('org.usa.mn'), 'undefined');
    assert.strictEqual(dummyModel.org.usa.ny, 'nil2');
    assert.strictEqual(dummyModel.org.usa.mn, 'undefined');
  });

  /**
   * #prepare
   */

  test('#prepare provides callback to modify changes', async function (assert) {
    let date = new Date();
    let dummyChangeset = Changeset(dummyModel);
    dummyChangeset.set('first_name', 'foo');
    dummyChangeset.set('date_of_birth', date);
    dummyChangeset.prepare((changes) => {
      let modified = {};

      for (let key in changes) {
        modified[dasherize(key)] = changes[key];
      }

      return modified;
    });
    let changeKeys = get(dummyChangeset, 'changes').map((change) => get(change, 'key'));

    assert.deepEqual(changeKeys, ['first-name', 'date-of-birth'], 'should update changes');
    dummyChangeset.execute();
    assert.strictEqual(get(dummyModel, 'first-name'), 'foo', 'should update changes');
    assert.strictEqual(get(dummyModel, 'date-of-birth'), date, 'should update changes');
  });

  test('#prepare throws if callback does not return object', async function (assert) {
    assert.expect(1);

    let dummyChangeset = Changeset(dummyModel);
    dummyChangeset.set('first_name', 'foo');

    try {
      dummyChangeset.prepare(() => {
        return 'foo';
      });
    } catch ({ message }) {
      assert.throws(
        ({ message }) => message === 'Assertion Failed: Callback to `changeset.prepare` must return an object',
        'should throw error'
      );
    }
  });

  /**
   * #execute
   */

  test('#execute applies changes to content if valid', async function (assert) {
    let dummyChangeset = Changeset(dummyModel);
    dummyChangeset.set('name', 'foo');

    assert.strictEqual(get(dummyModel, 'name'), undefined, 'precondition');
    assert.ok(get(dummyChangeset, 'isValid'), 'should be valid');
    dummyChangeset.execute();
    assert.strictEqual(get(dummyModel, 'name'), 'foo', 'should apply changes');
  });

  test('#execute does not apply changes to content if invalid', async function (assert) {
    let dummyChangeset = Changeset(dummyModel, dummyValidator);
    dummyChangeset.set('name', 'a');

    assert.strictEqual(get(dummyModel, 'name'), undefined, 'precondition');
    assert.ok(get(dummyChangeset, 'isInvalid'), 'should be invalid');
    dummyChangeset.execute();
    assert.strictEqual(get(dummyModel, 'name'), undefined, 'should not apply changes');
  });

  test('#execute does not remove original nested objects', function (a) {
    class DogTag {}

    let dog = {};
    dog.info = new DogTag();
    dog.info.name = 'mishka';
    dog.info.breed = 'husky';

    let c = Changeset(dog);
    c.set('info.name', 'laika');
    c.execute();

    let condition = get(dog, 'info') instanceof DogTag;
    a.ok(condition, 'should not remove original object');
  });

  [
    {
      model: () => ({ org: { usa: { ny: '', ca: '' } } }),
      setCalls: [
        ['org.usa.ny', 'foo'],
        ['org.usa.ca', 'bar'],
        ['org', 'no usa for you'],
      ],
      result: () => ({ org: 'no usa for you' }),
    },
    {
      model: () => ({ org: { usa: { ny: '', ca: '' } } }),
      setCalls: [
        ['org.usa.ny', 'foo'],
        ['org', 'no usa for you'],
        ['org.usa.ca', 'bar'],
      ],
      result: () => ({ org: { usa: { ca: 'bar', ny: '' } } }),
    },
    {
      model: () => ({ org: { usa: { ny: '', ca: '' } } }),
      setCalls: [
        ['org', 'no usa for you'],
        ['org.usa.ny', 'foo'],
        ['org.usa.ca', 'bar'],
      ],
      result: () => ({ org: { usa: { ny: 'foo', ca: 'bar' } } }),
    },
  ].forEach(({ model, setCalls, result }, i) => {
    test(`#execute - table-driven test ${i + 1}`, async function (assert) {
      let m = model();
      let c = Changeset(m);

      setCalls.forEach(([k, v]) => c.set(k, v));
      c.execute();

      let actual = m;
      let expectedResult = result();
      assert.deepEqual(actual, expectedResult, `table driven test ${i + 1}`);
    });
  });

  test('it works with nested keys', async function (assert) {
    let expectedResult = {
      org: {
        asia: { sg: 'sg' },
        usa: {
          ca: 'ca',
          ny: 'ny',
          ma: { name: 'Massachusetts' },
        },
      },
    };
    set(dummyModel, 'org', {
      asia: { sg: null },
      usa: {
        ca: null,
        ny: null,
        ma: { name: null },
      },
    });

    let dummyChangeset = Changeset(dummyModel, dummyValidator);
    dummyChangeset.set('org.asia.sg', 'sg');
    dummyChangeset.set('org.usa.ca', 'ca');
    dummyChangeset.set('org.usa.ny', 'ny');
    dummyChangeset.set('org.usa.ma', { name: 'Massachusetts' });
    dummyChangeset.execute();
    assert.deepEqual(dummyChangeset.change, expectedResult, 'should have correct shape');
    assert.deepEqual(dummyChangeset._content.org, expectedResult.org, 'should have correct shape');
    assert.deepEqual(get(dummyModel, 'org'), expectedResult.org, 'should set value');
  });

  test('execute returns correct object after setting value on empty initial object', async function (assert) {
    let c = Changeset({});

    c.set('country', 'usa');

    assert.deepEqual(c.execute().data, {
      country: 'usa',
    });

    c.set('org.usa.ny', 'any value');

    assert.deepEqual(c.execute().data, {
      country: 'usa',
      org: {
        usa: {
          ny: 'any value',
        },
      },
    });
    c.set('org.usa.il', '2nd value');

    assert.deepEqual(c.execute().data, {
      country: 'usa',
      org: {
        usa: {
          ny: 'any value',
          il: '2nd value',
        },
      },
    });
  });

  /**
   * #pendingChanges
   */

  test('#pendingChanges up to date if changeset is invalid', async function (assert) {
    let dummyChangeset = Changeset(dummyModel, dummyValidator);
    dummyChangeset.set('name', 'a');

    assert.strictEqual(get(dummyModel, 'name'), undefined, 'precondition');
    assert.false(get(dummyChangeset, 'isValid'), 'can be invalid');

    let pendingChanges = dummyChangeset.pendingData;

    assert.strictEqual(get(pendingChanges, 'name'), 'a', 'should apply changes');
  });

  test('#pendingChanges up to date if changeset is valid', async function (assert) {
    let dummyChangeset = Changeset(dummyModel);
    dummyChangeset.set('name', 'foo');

    assert.strictEqual(get(dummyModel, 'name'), undefined, 'precondition');
    assert.true(get(dummyChangeset, 'isValid'), 'can be valid');

    let pendingChanges = dummyChangeset.pendingData;

    assert.strictEqual(get(pendingChanges, 'name'), 'foo', 'should apply changes');
  });

  test('#pendingChanges up to date after saved changeset modified again', async function (assert) {
    let dummyChangeset = Changeset(dummyModel);
    dummyChangeset.set('name', 'foo');

    assert.strictEqual(get(dummyModel, 'name'), undefined, 'precondition');
    assert.true(get(dummyChangeset, 'isValid'), 'can be valid');

    assert.strictEqual(get(dummyChangeset.pendingData, 'name'), 'foo', 'should apply changes');
    assert.strictEqual(get(dummyModel, 'name'), undefined, 'original data is not applied');

    dummyChangeset.save();

    assert.strictEqual(get(dummyModel, 'name'), 'foo', 'original data is updated');
    assert.deepEqual(dummyModel, dummyChangeset.pendingData, 'pending changes equal to original data');

    dummyChangeset.set('name', 'bar');

    assert.strictEqual(get(dummyChangeset.pendingData, 'name'), 'bar', 'pending data is returned in pendingChanges');
    assert.strictEqual(get(dummyModel, 'name'), 'foo', 'original data is not modified');
  });

  test('#pendingChanges with ember-data model is not possible due to circular dependency when merging ember-data models', async function (assert) {
    assert.expect(7);

    let store = this.owner.lookup('service:store');

    let mockProfileModel = store.createRecord('profile');
    let mockUserModel = store.createRecord('user', {
      profile: mockProfileModel,
      save: function () {
        return Promise.resolve(this);
      },
    });

    let dummyChangeset = Changeset(mockUserModel);

    assert.true(get(dummyChangeset, 'isPristine'), 'changeset is pristine');

    dummyChangeset.set('profile.firstName', 'Zoe');

    assert.false(get(dummyChangeset, 'isPristine'), 'changeset is not pristine as there is a change');

    assert.strictEqual(
      mockUserModel.get('profile.firstName'),
      'Bob',
      'Original model property should stay without changes'
    );
    assert.strictEqual(
      mockUserModel.get('profile.lastName'),
      'Ross',
      'Original model property should stay without changes'
    );

    assert.throws(
      function () {
        assert.strictEqual(
          dummyChangeset.get('pendingData.profile.firstName'),
          'Zoe',
          'Model belongsTo property should be updated'
        );
        assert.strictEqual(
          dummyChangeset.get('pendingData.profile.lastName'),
          'Ross',
          'Existing property should stay the same'
        );
      },
      /Unable to `mergeDeep` with your data. Are you trying to merge two ember-data objects\? Please file an issue with ember-changeset\./,
      "raised error instance indicates that ember-data models can't be merged"
    );

    assert.strictEqual(
      dummyChangeset.get('data.profile.firstName'),
      'Bob',
      'Original model property should stay without changes'
    );
    assert.strictEqual(
      dummyChangeset.get('data.profile.lastName'),
      'Ross',
      'Original model property should stay without changes'
    );
  });

  todo('#pendingChanges with ember-data model with multiple change steps', async function (assert) {
    let store = this.owner.lookup('service:store');

    let mockProfileModel = store.createRecord('profile');
    let mockUserModel = store.createRecord('user', {
      profile: mockProfileModel,
      save: function () {
        return Promise.resolve(this);
      },
    });

    let dummyChangeset = Changeset(mockUserModel);
    assert.equal(get(dummyChangeset, 'isPristine'), true, 'changeset is pristine');

    dummyChangeset.set('profile.firstName', 'Zoe');

    assert.equal(get(mockUserModel, 'profile.firstName'), 'Bob', 'belongsTo property is not modified');
    assert.equal(get(dummyChangeset, 'profile.firstName'), 'Zoe', 'belongsTo changeset is modified');
    assert.equal(
      get(dummyChangeset.pendingData, 'profile.firstName'),
      'Zoe',
      'pending data should give updated values'
    );

    await dummyChangeset.save();

    assert.equal(get(mockUserModel, 'profile.firstName'), 'Zoe', 'belongsTo property is updated after save');
    assert.equal(get(dummyChangeset, 'profile.firstName'), 'Zoe', 'belongsTo changeset has new value');
    assert.equal(get(dummyChangeset.pendingData, 'profile.firstName'), 'Zoe', 'pendingData should have a new value');

    let updatedMockProfileModel = store.createRecord('profile');

    dummyChangeset.set('profile', updatedMockProfileModel);

    assert.equal(get(mockUserModel, 'profile.firstName'), 'Zoe', 'belongsTo property is model has initial value');
    assert.equal(get(dummyChangeset, 'profile.firstName'), 'Bob', 'belongsTo changeset is updated');
    assert.equal(get(dummyChangeset.pendingData, 'profile.firstName'), 'Bob', 'belongsTo pendingData has new value');

    await dummyChangeset.save();

    assert.equal(get(mockUserModel, 'profile.firstName'), 'Bob', 'belongsTo property is updated');
    assert.equal(get(dummyChangeset, 'profile.firstName'), 'Bob', 'belongsTo changeset is updated');
    assert.equal(get(dummyChangeset.pendingData, 'profile.firstName'), 'Bob', 'belongsTo pendingData is updated');
  });

  /**
   * #save
   */

  test('#save proxies to content', async function (assert) {
    let result;
    let options;
    set(dummyModel, 'save', (dummyOptions) => {
      result = 'ok';
      options = dummyOptions;
      return Promise.resolve('saveResult');
    });
    let dummyChangeset = Changeset(dummyModel);
    dummyChangeset.set('name', 'foo');

    assert.strictEqual(result, undefined, 'precondition');
    let promise = dummyChangeset.save('test options');
    assert.strictEqual(result, 'ok', 'should save');
    assert.deepEqual(get(dummyChangeset, 'change'), { name: 'foo' }, 'should save');
    assert.strictEqual(options, 'test options', 'should proxy options when saving');
    assert.strictEqual(typeof promise.then, 'function', 'save returns a promise');
    const saveResult = await promise;
    assert.strictEqual(saveResult, 'saveResult', 'save proxies to save promise of content');
  });

  test('#save handles non-promise proxy content', async function (assert) {
    let result;
    let options;
    set(dummyModel, 'save', (dummyOptions) => {
      result = 'ok';
      options = dummyOptions;
      return Promise.resolve('saveResult');
    });
    let dummyChangeset = Changeset(dummyModel);
    dummyChangeset.set('name', 'foo');

    assert.strictEqual(result, undefined, 'precondition');
    let promise = dummyChangeset.save('test options');
    assert.strictEqual(result, 'ok', 'should save');
    assert.strictEqual(options, 'test options', 'should proxy options when saving');
    assert.strictEqual(typeof promise.then, 'function', 'save returns a promise');
    const saveResult = await promise;
    assert.strictEqual(saveResult, 'saveResult', 'save proxies to save promise of content');
  });

  test('#save handles rejected proxy content', async function (assert) {
    assert.expect(2);

    let dummyChangeset = Changeset(dummyModel);

    set(dummyModel, 'save', () => {
      return new Promise((_, reject) => {
        next(null, reject, new Error('some ember data error'));
      });
    });

    try {
      dummyChangeset.name = 'new';
      await dummyChangeset.save();
      assert.ok(false, 'WAT?!');
    } catch (error) {
      dummyChangeset.unexecute();
      assert.strictEqual(error.message, 'some ember data error');
    } finally {
      assert.strictEqual(dummyModel.name, undefined, 'old name');
    }
  });

  test('#save handles rejected proxy content with content', async function (assert) {
    assert.expect(2);

    dummyModel.name = 'original';
    let dummyChangeset = Changeset(dummyModel);

    set(dummyModel, 'save', () => {
      return new Promise((_, reject) => {
        next(null, reject, new Error('some ember data error'));
      });
    });

    try {
      dummyChangeset.name = 'new';
      await dummyChangeset.save();
      assert.ok(false, 'WAT?!');
    } catch (error) {
      dummyChangeset.unexecute();
      assert.strictEqual(error.message, 'some ember data error');
    } finally {
      assert.strictEqual(dummyModel.name, 'original', 'old name');
    }
  });

  test('#save proxies to content even if it does not implement #save', async function (assert) {
    let person = { name: 'Jim' };
    let dummyChangeset = Changeset(person);
    dummyChangeset.set('name', 'foo');

    await dummyChangeset.save();
    assert.strictEqual(get(person, 'name'), 'foo', 'persist changes to content');
  });

  test('calling save then setting a date from null to something and rejecting does return the right error', async function (assert) {
    assert.expect(1);

    const dummyModel = this.owner.lookup('service:store').createRecord('profile', { startDate: null });

    dummyModel.save = () => {
      return Promise.reject({
        errors: [
          {
            title: 'Excuse me, Im talking',
            detail: 'bad backend error',
          },
        ],
      });
    };

    let dummyChangeset = Changeset(dummyModel, () => {});
    dummyChangeset.startDate = new Date();

    try {
      await dummyChangeset.save();
      assert.ok(false, 'save should fail if the underlaying save fails');
    } catch (err) {
      console.log('err', err);
      assert.strictEqual(err.errors[0].detail, 'bad backend error', 'Wrong error: ' + err.message);
    }
  });

  /**
   * #merge
   */

  test('#merge merges 2 valid changesets', async function (assert) {
    let dummyChangesetA = Changeset(dummyModel);
    let dummyChangesetB = Changeset(dummyModel);
    dummyChangesetA.set('firstName', 'Jim');
    dummyChangesetB.set('lastName', 'Bob');
    let dummyChangesetC = dummyChangesetA.merge(dummyChangesetB);
    let expectedChanges = [
      { key: 'firstName', value: 'Jim' },
      { key: 'lastName', value: 'Bob' },
    ];

    assert.deepEqual(get(dummyChangesetC, 'changes'), expectedChanges, 'should merge 2 valid changesets');
    assert.deepEqual(
      get(dummyChangesetA, 'changes'),
      [{ key: 'firstName', value: 'Jim' }],
      'should not mutate first changeset'
    );
    assert.deepEqual(
      get(dummyChangesetB, 'changes'),
      [{ key: 'lastName', value: 'Bob' }],
      'should not mutate second changeset'
    );
  });

  test('#merge merges invalid changesets', async function (assert) {
    let dummyChangesetA = Changeset(dummyModel, dummyValidator);
    let dummyChangesetB = Changeset(dummyModel, dummyValidator);
    let dummyChangesetC = Changeset(dummyModel, dummyValidator);
    dummyChangesetA.set('age', 21);
    dummyChangesetA.set('name', 'a');
    dummyChangesetB.set('name', 'Tony Stark');
    dummyChangesetC.set('name', 'b');

    let dummyChangesetD = dummyChangesetA.merge(dummyChangesetB);
    dummyChangesetD = dummyChangesetD.merge(dummyChangesetC);

    let expectedChanges = [
      { key: 'age', value: 21 },
      { key: 'name', value: 'b' },
    ];
    let expectedErrors = [{ key: 'name', validation: 'too short', value: 'b' }];

    assert.true(get(dummyChangesetA, 'isInvalid'), 'changesetA is not valid becuase of name');
    assert.true(get(dummyChangesetB, 'isValid'), 'changesetB should be invalid');
    assert.true(get(dummyChangesetC, 'isInvalid'), 'changesetC should be invalid');
    assert.true(get(dummyChangesetD, 'isInvalid'), 'changesetD should be invalid');
    assert.deepEqual(get(dummyChangesetD, 'changes'), expectedChanges, 'should not merge invalid changes');
    assert.deepEqual(get(dummyChangesetD, 'errors'), expectedErrors, 'should assign errors from both changesets');
  });

  test('#merge does not merge a changeset with a non-changeset', async function (assert) {
    assert.expect(1);

    let dummyChangesetA = Changeset(dummyModel, dummyValidator);
    let dummyChangesetB = { _changes: { name: 'b' } };
    dummyChangesetA.set('name', 'a');

    try {
      dummyChangesetA.merge(dummyChangesetB);
    } catch ({ message }) {
      assert.throws(
        ({ message }) => message === 'Assertion Failed: Cannot merge with a non-changeset',
        'should throw error'
      );
    }
  });

  test('#merge does not merge a changeset with different content', async function (assert) {
    assert.expect(1);

    let dummyChangesetA = Changeset(dummyModel, dummyValidator);
    let dummyChangesetB = Changeset(EmberObject.create(), dummyValidator);

    try {
      dummyChangesetA.merge(dummyChangesetB);
    } catch ({ message }) {
      assert.throws(
        ({ message }) => message === 'Assertion Failed: Cannot merge with a changeset of different content',
        'should throw error'
      );
    }
  });

  test('#merge preserves content and validator of origin changeset', async function (assert) {
    let dummyChangesetA = Changeset(dummyModel, dummyValidator);
    let dummyChangesetB = Changeset(dummyModel);
    let dummyChangesetC = dummyChangesetA.merge(dummyChangesetB);
    let expectedErrors = [{ key: 'name', validation: 'too short', value: 'a' }];

    dummyChangesetC.set('name', 'a');
    assert.deepEqual(dummyChangesetC.get('errors'), expectedErrors, 'should preserve validator');

    dummyChangesetC.set('name', 'Jim Bob');
    await dummyChangesetC.save();

    assert.strictEqual(dummyModel.get('name'), 'Jim Bob', 'should set value on model');
  });

  /**
   * #rollback
   */

  test('#rollback restores old values', async function (assert) {
    let dummyChangeset = Changeset(dummyModel, dummyValidator);
    let expectedChanges = [
      { key: 'firstName', value: 'foo' },
      { key: 'lastName', value: 'bar' },
      { key: 'name', value: '' },
    ];
    let expectedErrors = [{ key: 'name', validation: 'too short', value: '' }];
    dummyChangeset.set('firstName', 'foo');
    dummyChangeset.set('lastName', 'bar');
    dummyChangeset.set('name', '');

    assert.deepEqual(get(dummyChangeset, 'changes'), expectedChanges, 'precondition');
    assert.deepEqual(get(dummyChangeset, 'errors'), expectedErrors, 'precondition');
    dummyChangeset.rollback();
    assert.deepEqual(get(dummyChangeset, 'changes'), [], 'should rollback');
    assert.deepEqual(get(dummyChangeset, 'errors'), [], 'should rollback');
  });

  test('#rollback resets valid state', async function (assert) {
    let dummyChangeset = Changeset(dummyModel, dummyValidator);
    dummyChangeset.set('name', 'a');

    assert.ok(get(dummyChangeset, 'isInvalid'), 'should be invalid');
    dummyChangeset.rollback();
    assert.ok(get(dummyChangeset, 'isValid'), 'should be valid');
  });

  test('#rollback twice works', async function (assert) {
    let dummyChangeset = Changeset(dummyModel);
    dummyChangeset.set('name', 'abcde');

    let expectedChanges = [{ key: 'name', value: 'abcde' }];
    assert.deepEqual(get(dummyChangeset, 'changes'), expectedChanges, 'name is set');
    dummyChangeset.rollback();
    assert.deepEqual(get(dummyChangeset, 'changes'), [], 'rolls back');

    dummyChangeset.set('name', 'mnop');
    expectedChanges = [{ key: 'name', value: 'mnop' }];
    assert.deepEqual(get(dummyChangeset, 'changes'), expectedChanges, 'name is set');
    dummyChangeset.rollback();
    assert.deepEqual(get(dummyChangeset, 'changes'), [], 'rolls back');
  });

  test('#rollback twice with nested keys works', async function (assert) {
    set(dummyModel, 'org', {
      asia: { sg: null },
    });
    let dummyChangeset = Changeset(dummyModel);
    dummyChangeset.set('org.asia.sg', 'sg');

    let expectedChanges = [{ key: 'org.asia.sg', value: 'sg' }];
    assert.deepEqual(get(dummyChangeset, 'changes'), expectedChanges, 'org is set');
    dummyChangeset.rollback();
    assert.deepEqual(get(dummyChangeset, 'changes'), [], 'rolls back');

    dummyChangeset.set('org.asia.sg', 'Singapore');
    expectedChanges = [{ key: 'org.asia.sg', value: 'Singapore' }];
    assert.deepEqual(get(dummyChangeset, 'changes'), expectedChanges, 'org is set');
    dummyChangeset.rollback();
    assert.deepEqual(get(dummyChangeset, 'changes'), [], 'rolls back');
  });

  test('#rollbackInvalid clears errors and keeps valid values', async function (assert) {
    let dummyChangeset = Changeset(dummyModel, dummyValidator);
    let expectedChanges = [
      { key: 'firstName', value: 'foo' },
      { key: 'lastName', value: 'bar' },
      { key: 'name', value: '' },
    ];
    let expectedErrors = [{ key: 'name', validation: 'too short', value: '' }];
    dummyChangeset.set('firstName', 'foo');
    dummyChangeset.set('lastName', 'bar');
    dummyChangeset.set('name', '');

    assert.deepEqual(get(dummyChangeset, 'changes'), expectedChanges, 'precondition');
    assert.deepEqual(get(dummyChangeset, 'errors'), expectedErrors, 'precondition');
    dummyChangeset.rollbackInvalid();
    expectedChanges = [
      { key: 'firstName', value: 'foo' },
      { key: 'lastName', value: 'bar' },
    ];
    assert.deepEqual(get(dummyChangeset, 'changes'), expectedChanges, 'should not rollback');
    assert.deepEqual(get(dummyChangeset, 'errors'), [], 'should rollback');
  });

  test('#rollbackInvalid a specific key clears key error and keeps valid values', async function (assert) {
    let dummyChangeset = Changeset(dummyModel, dummyValidator);
    let expectedChanges = [
      { key: 'firstName', value: 'foo' },
      { key: 'lastName', value: 'bar' },
      { key: 'password', value: false },
      { key: 'name', value: '' },
    ];
    let expectedErrors = [
      { key: 'password', validation: ['foo', 'bar'], value: false },
      { key: 'name', validation: 'too short', value: '' },
    ];
    dummyChangeset.set('firstName', 'foo');
    dummyChangeset.set('lastName', 'bar');
    dummyChangeset.set('password', false);
    dummyChangeset.set('name', '');

    assert.deepEqual(get(dummyChangeset, 'changes'), expectedChanges, 'precondition');
    assert.deepEqual(get(dummyChangeset, 'errors'), expectedErrors, 'precondition');
    dummyChangeset.rollbackInvalid('name');
    expectedChanges = [
      { key: 'firstName', value: 'foo' },
      { key: 'lastName', value: 'bar' },
      { key: 'password', value: false },
    ];
    assert.deepEqual(get(dummyChangeset, 'changes'), expectedChanges, 'should not rollback');
    expectedErrors = [{ key: 'password', validation: ['foo', 'bar'], value: false }];
    assert.deepEqual(get(dummyChangeset, 'errors'), expectedErrors, 'should rollback');
  });

  test('#rollbackInvalid resets valid state', async function (assert) {
    let dummyChangeset = Changeset(dummyModel, dummyValidator);
    dummyChangeset.set('name', 'a');

    assert.ok(get(dummyChangeset, 'isInvalid'), 'should be invalid');
    dummyChangeset.rollbackInvalid();
    assert.ok(get(dummyChangeset, 'isValid'), 'should be valid');
  });

  test('#rollbackInvalid will not remove changes that are valid', async function (assert) {
    let dummyChangeset = Changeset(dummyModel, dummyValidator);
    dummyChangeset.set('name', 'abcd');

    let expectedChanges = [{ key: 'name', value: 'abcd' }];
    assert.deepEqual(get(dummyChangeset, 'changes'), expectedChanges, 'has correct changes');
    assert.ok(get(dummyChangeset, 'isValid'), 'should be valid');
    dummyChangeset.rollbackInvalid('name');
    assert.deepEqual(get(dummyChangeset, 'changes'), expectedChanges, 'should not remove valid changes');
    assert.ok(get(dummyChangeset, 'isValid'), 'should still be valid');
  });

  test('#rollbackInvalid works for keys not on changeset', async function (assert) {
    let dummyChangeset = Changeset(dummyModel, dummyValidator);
    let expectedChanges = [
      { key: 'firstName', value: 'foo' },
      { key: 'lastName', value: 'bar' },
      { key: 'name', value: '' },
    ];
    let expectedErrors = [{ key: 'name', validation: 'too short', value: '' }];
    dummyChangeset.set('firstName', 'foo');
    dummyChangeset.set('lastName', 'bar');
    dummyChangeset.set('name', '');

    assert.deepEqual(get(dummyChangeset, 'changes'), expectedChanges, 'precondition');
    assert.deepEqual(get(dummyChangeset, 'errors'), expectedErrors, 'precondition');
    dummyChangeset.rollbackInvalid('dowat?');
    assert.deepEqual(get(dummyChangeset, 'changes'), expectedChanges, 'should not rollback');
    assert.deepEqual(get(dummyChangeset, 'errors'), expectedErrors, 'precondition');
  });

  test('#rollbackProperty restores old value for specified property only', async function (assert) {
    set(dummyModel, 'firstName', 'Jim');
    set(dummyModel, 'lastName', 'Bob');
    let dummyChangeset = Changeset(dummyModel, dummyValidator);
    let expectedChanges = [{ key: 'lastName', value: 'bar' }];
    dummyChangeset.set('firstName', 'foo');
    dummyChangeset.set('lastName', 'bar');

    dummyChangeset.rollbackProperty('firstName');
    assert.deepEqual(get(dummyChangeset, 'changes'), expectedChanges, 'should rollback single property');
  });

  test('#rollbackProperty clears errors for specified property', async function (assert) {
    let dummyChangeset = Changeset(dummyModel, dummyValidator);
    let expectedChanges = [
      { key: 'firstName', value: 'foo' },
      { key: 'lastName', value: 'bar' },
      { key: 'name', value: '' },
    ];
    let expectedErrors = [{ key: 'name', validation: 'too short', value: '' }];
    dummyChangeset.set('firstName', 'foo');
    dummyChangeset.set('lastName', 'bar');
    dummyChangeset.set('name', '');

    assert.deepEqual(get(dummyChangeset, 'changes'), expectedChanges, 'precondition');
    assert.deepEqual(get(dummyChangeset, 'errors'), expectedErrors, 'precondition');
    dummyChangeset.rollbackProperty('name');
    expectedChanges = [
      { key: 'firstName', value: 'foo' },
      { key: 'lastName', value: 'bar' },
    ];
    assert.deepEqual(get(dummyChangeset, 'changes'), expectedChanges, 'should not rollback');
    assert.deepEqual(get(dummyChangeset, 'errors'), [], 'should rollback');
  });

  test('#rollbackProperty resets valid state', async function (assert) {
    let dummyChangeset = Changeset(dummyModel, dummyValidator);
    dummyChangeset.set('name', 'a');

    assert.ok(get(dummyChangeset, 'isInvalid'), 'should be invalid');
    dummyChangeset.rollbackProperty('name');
    assert.ok(get(dummyChangeset, 'isValid'), 'should be valid');
  });

  test('observing #rollback values', async function (assert) {
    let res;
    let changeset = Changeset(dummyModel, dummyValidator);
    // eslint-disable-next-line ember/no-observers
    changeset.addObserver('name', function () {
      res = this.name;
    });
    assert.strictEqual(changeset.get('name'), undefined, 'initial value');
    changeset.set('name', 'Jack');
    await settled(); // observer is now async, await to fire
    assert.strictEqual(res, 'Jack', 'observer fired when setting value');
    changeset.rollback();
    await settled(); // observer is now async, await to fire
    assert.strictEqual(res, undefined, 'observer fired with the value name was rollback to');
  });

  test('can update nested keys after rollback changes.', async function (assert) {
    let expectedResult = {
      org: {
        asia: { sg: 'sg' },
        usa: {
          ny: 'ny',
          ma: { name: 'Massachusetts' },
        },
      },
    };
    set(dummyModel, 'org', {
      asia: { sg: null },
      usa: {
        ny: null,
        ma: { name: null },
      },
    });

    let dummyChangeset = Changeset(dummyModel, dummyValidator);
    dummyChangeset.set('org.asia.sg', 'sg');
    dummyChangeset.set('org.usa.ny', 'ny');
    dummyChangeset.set('org.usa.ma', { name: 'Massachusetts' });
    dummyChangeset.execute();
    assert.deepEqual(get(dummyModel, 'org'), expectedResult.org, 'should set value');

    expectedResult.org.usa.or = 'or';
    dummyChangeset.rollback();
    dummyChangeset.set('org.usa.or', 'or');
    dummyChangeset.execute();
    assert.deepEqual(get(dummyModel, 'org'), expectedResult.org, 'should set value');
  });

  /**
   * #validate
   */

  test('#validate/0 validates all fields immediately', async function (assert) {
    dummyModel.setProperties({ name: 'J', password: false, options: null });
    let dummyChangeset = Changeset(dummyModel, dummyValidator, dummyValidations);

    await dummyChangeset.validate();
    assert.deepEqual(
      classToObj(get(dummyChangeset, 'error.password')),
      { validation: ['foo', 'bar'], value: false },
      'should validate immediately'
    );
    assert.deepEqual(
      classToObj(dummyChangeset.error.password),
      { validation: ['foo', 'bar'], value: false },
      'should validate immediately'
    );
    assert.deepEqual(get(dummyChangeset, 'changes'), [], 'should not set changes');
    assert.deepEqual(dummyChangeset.changes, [], 'should not set changes');
    assert.strictEqual(get(dummyChangeset, 'errors.length'), 7, 'should have 7 errors');
    assert.strictEqual(dummyChangeset.errors.length, 7, 'should have 7 errors');
  });

  test('#validate/0 with nested fields', async function (assert) {
    dummyModel.setProperties({ org: { usa: { ny: null } } });
    let dummyChangeset = Changeset(dummyModel, dummyValidator, dummyValidations);

    await dummyChangeset.validate();
    assert.deepEqual(
      classToObj(dummyChangeset.error.org.usa.ny),
      { validation: 'must be present', value: null },
      'should validate immediately'
    );
    assert.deepEqual(dummyChangeset.changes, [], 'should not set changes');
    assert.strictEqual(dummyChangeset.errors.length, 7, 'should have 7 errors');
  });

  test('#validate/1 validates a single field immediately', async function (assert) {
    dummyModel.setProperties({ name: 'J', password: '123' });
    let dummyChangeset = Changeset(dummyModel, dummyValidator, dummyValidations);

    await dummyChangeset.validate('name');
    assert.deepEqual(
      classToObj(get(dummyChangeset, 'error.name')),
      { validation: 'too short', value: 'J' },
      'should validate immediately'
    );
    assert.deepEqual(get(dummyChangeset, 'changes'), [], 'should not set changes');
    assert.strictEqual(get(dummyChangeset, 'errors.length'), 1, 'should only have 1 error');
  });

  test('#validate validates a multiple field immediately', async function (assert) {
    dummyModel.setProperties({ name: 'J', password: false });
    let dummyChangeset = Changeset(dummyModel, dummyValidator, dummyValidations);

    await dummyChangeset.validate('name', 'password');
    assert.deepEqual(
      classToObj(get(dummyChangeset, 'error.name')),
      { validation: 'too short', value: 'J' },
      'should validate immediately'
    );
    assert.deepEqual(
      classToObj(get(dummyChangeset, 'error.password')),
      { validation: ['foo', 'bar'], value: false },
      'should validate immediately'
    );
    assert.deepEqual(get(dummyChangeset, 'changes'), [], 'should not set changes');
    assert.strictEqual(get(dummyChangeset, 'errors.length'), 2, 'should only have 2 error');
  });

  test('#validate works correctly with changeset values', async function (assert) {
    dummyModel.setProperties({
      name: undefined,
      password: false,
      async: true,
      passwordConfirmation: false,
      options: {},
      org: {
        isCompliant: undefined,
        usa: {
          ny: undefined,
        },
      },
    });
    let dummyChangeset = Changeset(dummyModel, dummyValidator, dummyValidations);

    dummyChangeset.set('name', 'Jim Bob');
    await dummyChangeset.validate();
    assert.strictEqual(get(dummyChangeset, 'errors.length'), 3, 'should have 3 errors');
    assert.strictEqual(get(dummyChangeset, 'errors.0.key'), 'password', 'has first error key');
    assert.strictEqual(get(dummyChangeset, 'errors.1.key'), 'org.isCompliant', 'has second error key');
    assert.strictEqual(get(dummyChangeset, 'errors.2.key'), 'org.usa.ny', 'has third error key');
    assert.ok(get(dummyChangeset, 'isInvalid'), 'should be invalid');

    dummyChangeset.set('passwordConfirmation', true);

    await dummyChangeset.validate();

    assert.strictEqual(get(dummyChangeset, 'errors.length'), 4, 'should have 4 errors');
    assert.strictEqual(get(dummyChangeset, 'errors.0.key'), 'org.usa.ny');
    assert.strictEqual(get(dummyChangeset, 'errors.1.key'), 'org.isCompliant');
    assert.strictEqual(get(dummyChangeset, 'errors.2.key'), 'password');
    assert.strictEqual(get(dummyChangeset, 'errors.3.key'), 'passwordConfirmation');
    assert.ok(get(dummyChangeset, 'isInvalid'), 'should be invalid');

    dummyChangeset.set('password', true);
    dummyChangeset.set('passwordConfirmation', true);
    dummyChangeset.set('org.isCompliant', true);
    dummyChangeset.set('org.usa.ny', 'NY');
    await dummyChangeset.validate();
    assert.strictEqual(get(dummyChangeset, 'errors.length'), 0, 'should have no errors');
    assert.ok(get(dummyChangeset, 'isValid'), 'should be valid');
  });

  test('#validate works correctly with complex values', async function (assert) {
    dummyModel.setProperties({});
    let dummyChangeset = Changeset(dummyModel, dummyValidator, dummyValidations);

    dummyChangeset.set('options', { persist: true });
    dummyChangeset.validate();
    assert.deepEqual(dummyChangeset.changes[0], { key: 'options', value: { persist: true } });
  });

  test('#validate marks actual valid changes', async function (assert) {
    dummyModel.setProperties({ name: 'Jim Bob', password: true, passwordConfirmation: true, async: true });
    let dummyChangeset = Changeset(dummyModel, dummyValidator, dummyValidations);

    dummyChangeset.set('name', 'foo bar');
    dummyChangeset.set('password', false);

    await dummyChangeset.validate();
    assert.deepEqual(dummyChangeset.changes, [
      { key: 'name', value: 'foo bar' },
      { key: 'password', value: false },
    ]);
  });

  test('#validate does not mark changes when nothing has changed', async function (assert) {
    let options = {
      persist: true,
      // test isEqual to ensure we're using Ember.isEqual for comparison
      isEqual(other) {
        return this.persist === get(other, 'persist');
      },
    };
    dummyModel.setProperties({
      name: 'Jim Bob',
      password: true,
      passwordConfirmation: true,
      async: true,
      options,
      org: {
        isCompliant: true,
        usa: {
          ny: 'NY',
        },
      },
    });
    let dummyChangeset = Changeset(dummyModel, dummyValidator, dummyValidations);

    dummyChangeset.set('options', options);

    await dummyChangeset.validate();
    assert.deepEqual(get(dummyChangeset, 'error'), {});
    assert.deepEqual(get(dummyChangeset, 'changes'), []);
  });

  test('#validate/nested validates nested fields immediately', async function (assert) {
    set(dummyModel, 'org', {
      usa: {
        ny: null,
      },
    });

    let dummyChangeset = Changeset(dummyModel, dummyValidator, dummyValidations);
    await dummyChangeset.validate('org.usa.ny');
    assert.deepEqual(
      classToObj(get(dummyChangeset, 'error.org.usa.ny')),
      { validation: 'must be present', value: null },
      'should validate immediately'
    );
    assert.deepEqual(dummyChangeset.changes, [], 'should not set changes');
    assert.strictEqual(dummyChangeset.errors.length, 1, 'should only have 1 error');
  });

  test('#validate marks actual valid changes (with boolean)', async function (assert) {
    dummyModel.setProperties({ name: 'Jim Bob', password: true, passwordConfirmation: true });
    let dummyChangeset = Changeset(dummyModel, dummyValidator, dummyValidations);

    dummyChangeset.set('name', 'foo bar');
    dummyChangeset.set('password', false);
    dummyChangeset.set('async', true);

    await dummyChangeset.validate();
    assert.deepEqual(get(dummyChangeset, 'changes'), [
      { key: 'name', value: 'foo bar' },
      { key: 'password', value: false },
      { key: 'async', value: true },
    ]);
  });

  test('#validate changeset getter', async function (assert) {
    class MyModel {
      isOptionOne = false;
      isOptionTwo = false;
      isOptionThree = false;
    }

    const Validations = {
      isOptionSelected: (newValue) => {
        return newValue === true ? true : 'No options selected';
      },
    };

    function myValidator({ key, newValue, oldValue, changes, content }) {
      let validatorFn = get(Validations, key);

      if (typeof validatorFn === 'function') {
        return validatorFn(newValue, oldValue, changes, content);
      }
    }

    const myObject = new MyModel();
    const myChangeset = Changeset(myObject, myValidator, Validations);

    Object.defineProperty(myChangeset, 'isOptionSelected', {
      get() {
        // eslint-disable-next-line ember/no-get
        return this.get('isOptionOne') || this.get('isOptionTwo') || this.get('isOptionThree');
      },
    });
    await myChangeset.validate();
    assert.true(myChangeset.isInvalid, 'Changeset is invalid as none of the options are selected');

    set(myChangeset, 'isOptionTwo', true);
    await myChangeset.validate();
    assert.false(myChangeset.isInvalid, 'Changeset is valid as one of the options is selected');
  });

  test('#changeset properties do not proxy', async function (assert) {
    dummyModel.setProperties({ name: undefined, password: false, async: true, isValid: 'not proxied' });
    let dummyChangeset = Changeset(dummyModel, dummyValidator, dummyValidations);

    dummyChangeset.set('name', 'Jim Bob');
    await dummyChangeset.validate();
    assert.false(get(dummyChangeset, 'isValid'), 'should have 1 error');
  });

  test('#validate works with validator class', async function (assert) {
    class PersonalValidator {
      _validate(value) {
        if (value === null) {
          return 'oh no';
        }
      }
      validate(key, newValue) {
        return this._validate(newValue);
      }
    }
    const validatorMap = {
      name: new PersonalValidator(),
    };

    let dummyChangeset = Changeset(dummyModel, lookupValidator(validatorMap), validatorMap);
    dummyChangeset.name = null;

    await dummyChangeset.validate();

    assert.deepEqual(dummyChangeset.get('error.name.validation'), 'oh no');
    assert.deepEqual(dummyChangeset.get('errors.length'), 1);
  });

  /**
   * #addError
   */

  test('#addError adds an error to the changeset', async function (assert) {
    let dummyChangeset = Changeset(dummyModel);
    dummyChangeset.addError('email', {
      value: 'jim@bob.com',
      validation: 'Email already taken',
    });

    assert.ok(get(dummyChangeset, 'isInvalid'), 'should be invalid');
    assert.strictEqual(get(dummyChangeset, 'error.email.validation'), 'Email already taken', 'should add the error');
    dummyChangeset.set('email', 'unique@email.com');
    assert.ok(get(dummyChangeset, 'isValid'), 'should be valid');
  });

  test('#addError adds an error to the changeset using the shortcut', function (assert) {
    let dummyChangeset = Changeset(dummyModel);
    dummyChangeset.set('email', 'jim@bob.com');
    dummyChangeset.addError('email', 'Email already taken');

    assert.ok(get(dummyChangeset, 'isInvalid'), 'should be invalid');
    assert.strictEqual(get(dummyChangeset, 'error.email.validation'), 'Email already taken', 'should add the error');
    assert.strictEqual(get(dummyChangeset, 'error.email.value'), 'jim@bob.com', 'addError uses already present value');
    assert.deepEqual(
      get(dummyChangeset, 'changes'),
      [{ key: 'email', value: 'jim@bob.com' }],
      'errors set as changes on changeset'
    );
    dummyChangeset.set('email', 'unique@email.com');
    assert.ok(get(dummyChangeset, 'isValid'), 'should be valid');
    assert.deepEqual(
      get(dummyChangeset, 'changes')[0],
      { key: 'email', value: 'unique@email.com' },
      'has correct changes'
    );
  });

  test('#addError adds an error to the changeset on a nested property', async function (assert) {
    let dummyChangeset = Changeset(dummyModel);
    dummyChangeset.addError('email.localPart', 'Cannot contain +');

    assert.ok(get(dummyChangeset, 'isInvalid'), 'should be invalid');
    assert.strictEqual(
      get(dummyChangeset, 'error.email.localPart.validation'),
      'Cannot contain +',
      'should add the error'
    );
    dummyChangeset.set('email.localPart', 'ok');
    assert.ok(get(dummyChangeset, 'isValid'), 'should be valid');
  });

  test('#addError adds an array of errors to the changeset', async function (assert) {
    let dummyChangeset = Changeset(dummyModel);
    dummyChangeset.addError('email', ['jim@bob.com', 'Email already taken']);

    assert.ok(get(dummyChangeset, 'isInvalid'), 'should be invalid');
    assert.deepEqual(
      get(dummyChangeset, 'error.email.validation'),
      ['jim@bob.com', 'Email already taken'],
      'should add the error'
    );
    dummyChangeset.set('email', 'unique@email.com');
    assert.ok(get(dummyChangeset, 'isValid'), 'should be valid');
  });

  /**
   * #pushErrors
   */

  test('#pushErrors pushes an error into an array of existing validations', function (assert) {
    let dummyChangeset = Changeset(dummyModel);
    dummyChangeset.set('email', 'jim@bob.com');
    dummyChangeset.addError('email', 'Email already taken');
    dummyChangeset.pushErrors('email', 'Invalid email format');

    assert.ok(get(dummyChangeset, 'isInvalid'), 'should be invalid');
    assert.deepEqual(
      get(dummyChangeset, 'error.email.validation'),
      ['Email already taken', 'Invalid email format'],
      'should push the error'
    );
    assert.strictEqual(
      get(dummyChangeset, 'error.email.value'),
      'jim@bob.com',
      'pushErrors uses already present value'
    );
    assert.deepEqual(
      get(dummyChangeset, 'changes'),
      [{ key: 'email', value: 'jim@bob.com' }],
      'pushErrors does not clear the changes on the changeset'
    );
    dummyChangeset.set('email', 'unique@email.com');
    assert.ok(get(dummyChangeset, 'isValid'), 'should be valid');
    assert.deepEqual(
      get(dummyChangeset, 'changes')[0],
      { key: 'email', value: 'unique@email.com' },
      'has correct changes'
    );
  });

  test('#pushErrors pushes an error if no existing validations are present', function (assert) {
    let dummyChangeset = Changeset(dummyModel, dummyValidator);
    dummyChangeset.set('name', 'J');
    dummyChangeset.pushErrors('name', 'cannot be J');

    assert.ok(get(dummyChangeset, 'isInvalid'), 'should be invalid');
    assert.deepEqual(
      get(dummyChangeset, 'error.name.validation'),
      ['too short', 'cannot be J'],
      'should push the error'
    );
    assert.strictEqual(get(dummyChangeset, 'error.name.value'), 'J', 'pushErrors uses already present value');
    dummyChangeset.set('name', 'Good name');
    assert.ok(get(dummyChangeset, 'isValid'), 'should be valid');
  });

  test('#pushErrors updates error object in a KVO compatible way', function (assert) {
    let dummyChangeset = Changeset(dummyModel);

    // eslint-disable-next-line ember/no-classic-classes
    let aComponentOrSomething = EmberObject.extend({
      errorsOnName: reads('changeset.error.name.validation'),
    }).create({ changeset: dummyChangeset });

    assert.notOk(get(aComponentOrSomething, 'errorsOnName'), 'starts off with no errors');

    dummyChangeset.set('name', 'J');
    dummyChangeset.pushErrors('name', 'cannot be J');

    assert.ok(get(dummyChangeset, 'isInvalid'), 'should be invalid');
    assert.deepEqual(get(dummyChangeset, 'error.name.validation'), ['cannot be J'], 'should push the error');
    assert.strictEqual(get(dummyChangeset, 'error.name.value'), 'J', 'pushErrors uses already present value');
    assert.deepEqual(
      get(aComponentOrSomething, 'errorsOnName'),
      ['cannot be J'],
      'pushErrors updates error object in a way that can be bound to'
    );
    dummyChangeset.set('name', 'Good name');
    assert.ok(get(dummyChangeset, 'isValid'), 'should be valid');
    assert.notOk(get(aComponentOrSomething, 'errorsOnName'), 'clearing of errors can be bound to');
  });

  test('#pushErrors adds an error to the changeset on a nested property', async function (assert) {
    let dummyChangeset = Changeset(dummyModel);
    dummyChangeset.pushErrors('email.localPart', 'Cannot contain +');
    dummyChangeset.pushErrors('email.localPart', 'is too short');

    assert.ok(get(dummyChangeset, 'isInvalid'), 'should be invalid');
    assert.deepEqual(
      get(dummyChangeset, 'error.email.localPart.validation'),
      ['Cannot contain +', 'is too short'],
      'should add the error'
    );
    dummyChangeset.set('email.localPart', 'ok');
    assert.ok(get(dummyChangeset, 'isValid'), 'should be valid');
  });

  /**
   * #snapshot
   */

  test('#snapshot creates a snapshot of the changeset', async function (assert) {
    let dummyChangeset = Changeset(dummyModel, dummyValidator);
    dummyChangeset.set('name', 'Pokemon Go');
    dummyChangeset.set('password', false);
    let snapshot = dummyChangeset.snapshot();
    let expectedResult = {
      changes: { name: new Change('Pokemon Go'), password: new Change(false) },
      errors: { password: { validation: ['foo', 'bar'], value: false } },
    };

    assert.deepEqual(snapshot, expectedResult, 'should return snapshot');
    dummyChangeset.set('name', "Gotta catch'em all");
    assert.deepEqual(snapshot, expectedResult, 'should not be mutated');
  });

  /**
   * #restore
   */

  test('#restore restores a snapshot of the changeset', async function (assert) {
    let dummyChangesetA = Changeset(dummyModel, dummyValidator);
    let dummyChangesetB = Changeset(dummyModel, dummyValidator);
    dummyChangesetA.set('name', 'Pokemon Go');
    dummyChangesetA.set('password', false);
    let snapshot = dummyChangesetA.snapshot();

    assert.ok(get(dummyChangesetB, 'isValid'), 'precondition - should be valid');
    dummyChangesetB.restore(snapshot);
    assert.ok(get(dummyChangesetB, 'isInvalid'), 'should be invalid');
    assert.strictEqual(get(dummyChangesetB, 'change.name'), 'Pokemon Go', 'should restore changes');
    assert.deepEqual(
      classToObj(get(dummyChangesetB, 'error.password')),
      { validation: ['foo', 'bar'], value: false },
      'should restore errors'
    );
  });

  test('#restore restores a snapshot of the changeset when nested value is object', function (assert) {
    class Country {
      constructor(id, name) {
        this.id = id;
        this.name = name;
      }
    }

    var us = new Country('US', 'United States');
    var prk = new Country('PRK', 'North Korea');
    var aus = new Country('AUS', 'Australia');

    let user = {
      name: 'Adam',
      address: { country: us },
    };
    let dummyChangeset = Changeset(user);

    dummyChangeset.set('name', 'Jim Bob');
    dummyChangeset.set('address.country', prk);
    let snapshot1 = dummyChangeset.snapshot();

    dummyChangeset.set('name', 'Poteto');
    dummyChangeset.set('address.country', aus);

    dummyChangeset.restore(snapshot1);

    assert.strictEqual(get(dummyChangeset, 'change.name'), 'Jim Bob', 'should restore changes');
    assert.deepEqual(get(dummyChangeset, 'change.address.country'), prk, 'should restore nested changes');
  });

  /**
   * #cast
   */

  test('#cast allows only specified keys to exist on the changeset', async function (assert) {
    let dummyChangeset = Changeset(dummyModel, dummyValidator);
    let expectedResult = [
      { key: 'name', value: 'Pokemon Go' },
      { key: 'password', value: true },
    ];
    let allowed = ['name', 'password'];
    dummyChangeset.set('name', 'Pokemon Go');
    dummyChangeset.set('password', true);
    dummyChangeset.set('unwantedProp', 123);
    dummyChangeset.cast(allowed);

    assert.deepEqual(dummyChangeset.get('changes'), expectedResult, 'should drop `unwantedProp');
    assert.strictEqual(dummyChangeset.get('unwantedProp'), undefined, 'should remove unwanted changes');
  });

  test('#cast noops if no keys are passed', async function (assert) {
    let dummyChangeset = Changeset(dummyModel, dummyValidator);
    let expectedResult = [
      { key: 'name', value: 'Pokemon Go' },
      { key: 'password', value: true },
      { key: 'unwantedProp', value: 123 },
    ];
    dummyChangeset.set('name', 'Pokemon Go');
    dummyChangeset.set('password', true);
    dummyChangeset.set('unwantedProp', 123);
    dummyChangeset.cast();

    assert.deepEqual(dummyChangeset.get('changes'), expectedResult, 'should drop `unwantedProp');
  });

  /**
   * #isValidating
   */

  test('isValidating returns true when validations have not resolved', async function (assert) {
    let dummyChangeset;
    let _validator = () => new Promise(() => {});
    let _validations = {
      reservations() {
        return _validator();
      },
    };

    set(dummyModel, 'reservations', 'ABC12345');
    dummyChangeset = Changeset(dummyModel, _validator, _validations);
    set(dummyChangeset, 'reservations', 'DCE12345');

    dummyChangeset.validate();
    // assert.deepEqual(get(dummyChangeset, 'change'), { reservations: 'DCE12345' });

    assert.ok(
      dummyChangeset.isValidating(),
      'isValidating should be true when no key is passed in and something is validating'
    );
    assert.ok(
      dummyChangeset.isValidating('reservations'),
      'isValidating should be true when the key that is passed is validating'
    );
  });

  test('isValidating returns false when validations have resolved', function (assert) {
    let dummyChangeset;
    let _validator = () => Promise.resolve(true);
    let _validations = {
      reservations() {
        return _validator();
      },
    };

    set(dummyModel, 'reservations', 'ABC12345');
    dummyChangeset = Changeset(dummyModel, _validator, _validations);

    dummyChangeset.validate();
    assert.ok(
      dummyChangeset.isValidating(),
      'isValidating should be false when no key is passed in and nothing is validating'
    );
    assert.ok(
      dummyChangeset.isValidating('reservations'),
      'isValidating should be false when the key that is passed in is not validating'
    );
  });

  /**
   * beforeValidation
   */

  test('beforeValidation event is fired before validation', async function (assert) {
    let dummyChangeset;
    let _validator = () => new Promise(() => {});
    let _validations = {
      reservations() {
        return _validator();
      },
    };
    let hasFired = false;

    set(dummyModel, 'reservations', 'ABC12345');
    dummyChangeset = Changeset(dummyModel, _validator, _validations);
    dummyChangeset.on('beforeValidation', () => {
      hasFired = true;
    });

    dummyChangeset.validate();
    assert.ok(hasFired, 'beforeValidation should be triggered');
  });

  test('beforeValidation event is triggered with the key', async function (assert) {
    let dummyChangeset;
    let _validator = () => new Promise(() => {});
    let _validations = {
      reservations() {
        return _validator();
      },
    };
    let hasFired = false;

    set(dummyModel, 'reservations', 'ABC12345');
    dummyChangeset = Changeset(dummyModel, _validator, _validations);
    dummyChangeset.on('beforeValidation', (key) => {
      if (key === 'reservations') {
        hasFired = true;
      }
    });

    dummyChangeset.validate();
    assert.ok(hasFired, 'beforeValidation should be triggered with the key');
  });

  /**
   * afterValidation
   */

  test('afterValidation event is fired after validation', async function (assert) {
    let dummyChangeset;
    let _validator = () => Promise.resolve(true);
    let _validations = {
      reservations() {
        return _validator();
      },
    };
    let hasFired = false;

    set(dummyModel, 'reservations', 'ABC12345');
    dummyChangeset = Changeset(dummyModel, _validator, _validations);
    dummyChangeset.on('afterValidation', () => {
      hasFired = true;
    });

    await dummyChangeset.validate();
    assert.ok(hasFired, 'afterValidation should be triggered');
  });

  test('afterValidation event is triggered with the key', async function (assert) {
    let dummyChangeset;
    let _validator = () => Promise.resolve(true);
    let _validations = {
      reservations() {
        return _validator();
      },
    };
    let hasFired = false;

    set(dummyModel, 'reservations', 'ABC12345');
    dummyChangeset = Changeset(dummyModel, _validator, _validations);
    dummyChangeset.on('afterValidation', (key) => {
      if (key === 'reservations') {
        hasFired = true;
      }
    });

    await dummyChangeset.validate();
    assert.ok(hasFired, 'afterValidation should be triggered with the key');
  });

  /**
   * afterRollback
   */

  test('afterRollback event is fired after rollback', async function (assert) {
    let dummyChangeset;
    let _validator = () => Promise.resolve(true);
    let _validations = {
      reservations() {
        return _validator();
      },
    };
    let hasFired = false;

    set(dummyModel, 'reservations', 'ABC12345');
    dummyChangeset = Changeset(dummyModel, _validator, _validations);
    dummyChangeset.on('afterRollback', () => {
      hasFired = true;
    });

    await dummyChangeset.rollback();
    assert.ok(hasFired, 'afterRollback should be triggered');
  });

  /**
   * Behavior.
   */

  test('can set nested keys after validate', async function (assert) {
    assert.expect(0);

    set(dummyModel, 'org', {
      usa: { ny: null },
    });

    let c = Changeset(dummyModel, dummyValidator, dummyValidations);
    await c.validate('org.usa.ny');
    c.set('org.usa.ny', 'should not fail');
  });

  test('can call Changeset Factory function', async function (assert) {
    set(dummyModel, 'org', {
      usa: { ny: 'vaca' },
    });
    let dummyChangeset = ChangesetFactory(dummyModel, dummyValidator);
    dummyChangeset.set('org.usa.ny', '');

    assert.ok(get(dummyChangeset, 'isInvalid'), 'should be invalid');
    dummyChangeset.set('org.usa.ny', 'vaca');
    assert.ok(get(dummyChangeset, 'isValid'), 'should be valid');
    assert.notOk(get(dummyChangeset, 'isInvalid'), 'should be valid');
  });

  test('can call with extended Changeset', async function (assert) {
    set(dummyModel, 'org', {
      usa: { ny: 'vaca' },
    });
    let extended = class ExtendedChangeset extends EmberChangeset {};
    let dummyChangeset = ChangesetFactory(dummyModel, dummyValidator, null, { changeset: extended });
    dummyChangeset.set('org.usa.ny', '');

    assert.ok(get(dummyChangeset, 'isInvalid'), 'should be invalid');
    dummyChangeset.set('org.usa.ny', 'vaca');
    assert.ok(get(dummyChangeset, 'isValid'), 'should be valid');
    assert.notOk(get(dummyChangeset, 'isInvalid'), 'should be valid');
  });

  if (macroCondition(dependencySatisfies('ember-data', '<3.28'))) {
    // PromiseManyArray was refactored away from using PromiseProxy.
    // See https://github.com/emberjs/data/pull/7505
    test('using changset.get on a hasMany relationship returns the related record(s) and not a proxy', async function (assert) {
      let store = this.owner.lookup('service:store');
      let dogs = [store.createRecord('dog')];
      let user = store.createRecord('user', { dogs });

      let changeset = ChangesetFactory(user);

      let hasManyDogs = changeset.get('dogs');
      assert.ok(
        Object.prototype.hasOwnProperty.call(hasManyDogs, 'recordData'),
        'Get returns the related record(s) and not a proxy.'
      );
    });
  }

  test('cyclical bug with ember data models', async function (assert) {
    let store = this.owner.lookup('service:store');
    let dog = store.createRecord('dog', {
      breed: 'silver pup',
    });

    const validations = {
      litter: {
        dog: () => true,
      },
    };

    const obj = {
      litter: {},
    };

    const changeset = new Changeset(obj, lookupValidator(validations), validations);
    changeset.litter.dog = dog;
    changeset.validate();
    assert.ok(true);
  });

  test('#unexecute after #save on new ember-data model', async function (assert) {
    let store = this.owner.lookup('service:store');

    let mockProfileModel = store.createRecord('profile');

    const changeset = new Changeset(mockProfileModel);
    changeset.unexecute();
    assert.ok(true); // we just want no error until here
  });
});
