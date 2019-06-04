import Changeset from 'ember-changeset';
import { module, test } from 'qunit';

import EmberObject, {
  get,
  set,
  setProperties,
} from '@ember/object';

import { reads } from '@ember/object/computed';
import ObjectProxy from '@ember/object/proxy';
import { Promise, resolve } from 'rsvp';
import { dasherize } from '@ember/string';
import { isPresent, typeOf } from '@ember/utils';
import { run, next } from '@ember/runloop';

let dummyModel;
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
  },
  org: {
    usa: {
      ny(value) {
        return isPresent(value) || "must be present";
      }
    }
  }
};

function dummyValidator({ key, newValue, oldValue, changes, content }) {
  let validatorFn = get(dummyValidations, key);

  if (typeOf(validatorFn) === 'function') {
    return validatorFn(newValue, oldValue, changes, content);
  }
}

module('Unit | Utility | changeset', function(hooks) {
  hooks.beforeEach(function() {
    let Dummy = EmberObject.extend({
      save() {
        return resolve(this);
      }
    });
    dummyModel = Dummy.create();
  });

  /**
   * #toString
   */

  test('content can be an empty hash', function(assert) {
    assert.expect(1);

    let emptyObject = Object.create(null);
    let dummyChangeset = new Changeset(emptyObject, dummyValidator);

    assert.equal(dummyChangeset.toString(), 'changeset:[object Object]');
  });

  /**
   * #error
   */

  test('#error returns the error object and keeps changes', function(assert) {
    let dummyChangeset = new Changeset(dummyModel, dummyValidator);
    let expectedResult = { name: { validation: 'too short', value: 'a' } };
    dummyChangeset.set('name', 'a');

    assert.deepEqual(get(dummyChangeset, 'error'), expectedResult, 'should return error object');
    assert.deepEqual(get(dummyChangeset, 'change'), { name: 'a' }, 'should return change object');
  });

  /**
   * #change
   */

  test('#change returns the changes object', function(assert) {
    let dummyChangeset = new Changeset(dummyModel);
    let expectedResult = { name: 'a' };
    dummyChangeset.set('name', 'a');

    assert.deepEqual(get(dummyChangeset, 'change'), expectedResult, 'should return changes object');
  });

  test('#change supports `undefined`', function(assert) {
    let model = { name: 'a' };
    let dummyChangeset = new Changeset(model);
    let expectedResult = { name: undefined };
    dummyChangeset.set('name', undefined);

    assert.deepEqual(
      get(dummyChangeset, 'change'), expectedResult,
      'property changed to `undefined` should be included in change object'
    );
  });

  /**
   * #errors
   */

  /**
   * #changes
   */

  /**
   * #data
   */

  test("data reads the changeset CONTENT", function(assert) {
    let dummyChangeset = new Changeset(dummyModel);

    assert.equal(get(dummyChangeset, 'data'), dummyModel, 'should return data');
  });

  test("data is readonly", function(assert) {
    let dummyChangeset = new Changeset(dummyModel);

    try {
      set(dummyChangeset, 'data', { foo: 'bar' });
    } catch({ message }) {
      assert.throws(
        ({message}) => message === "Cannot set read-only property 'data' on object: changeset:[object Object]",
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

  test("isPristine returns true if changes are equal to content's values", function(assert) {
    dummyModel.set('name', 'Bobby');
    dummyModel.set('thing', 123);
    dummyModel.set('nothing', null);
    let dummyChangeset = new Changeset(dummyModel, dummyValidator);
    dummyChangeset.set('name', 'Bobby');
    dummyChangeset.set('nothing', null);

    assert.ok(dummyChangeset.get('isPristine'), 'should be pristine');
  });

  test("isPristine returns false if changes are not equal to content's values", function(assert) {
    dummyModel.set('name', 'Bobby');
    let dummyChangeset = new Changeset(dummyModel, dummyValidator);
    dummyChangeset.set('name', 'Bobby');
    dummyChangeset.set('thing', 123);

    assert.notOk(dummyChangeset.get('isPristine'), 'should not be pristine');
  });

  test('isPristine works with `null` values', function(assert) {
    dummyModel.set('name', null);
    dummyModel.set('age', 15);
    let dummyChangeset = new Changeset(dummyModel);

    assert.ok(dummyChangeset.get('isPristine'), 'should be pristine');

    dummyChangeset.set('name', 'Kenny');
    assert.notOk(dummyChangeset.get('isPristine'), 'should not be pristine');

    dummyChangeset.set('name', null);
    assert.ok(dummyChangeset.get('isPristine'), 'should be pristine');
  });

  /**
   * #isDirty
   */

  /**
   * #get
   */

  test('#get proxies to content', function(assert) {
    set(dummyModel, 'name', 'Jim Bob');
    let dummyChangeset = new Changeset(dummyModel);
    let result = get(dummyChangeset, 'name');

    assert.equal(result, 'Jim Bob', 'should proxy to content');
  });

  test('#get returns the content when the proxied content is a class', function(assert) {
    class Moment {
      constructor(date) {
        this.date = date;
      }
    }

    let d = new Date('2015');
    let momentInstance = new Moment(d);
    let c = new Changeset({
      startDate: momentInstance
    });

    let newValue = c.get('startDate');
    assert.deepEqual(newValue, momentInstance, 'correct getter');
    assert.ok(newValue instanceof Moment, 'correct instance');
    assert.equal(newValue.date, d, 'correct date on moment object');
  });

  test('#get returns change if present', function(assert) {
    set(dummyModel, 'name', 'Jim Bob');
    let dummyChangeset = new Changeset(dummyModel);
    set(dummyChangeset, 'name', 'Milton Waddams');
    let result = get(dummyChangeset, 'name');

    assert.equal(result, 'Milton Waddams', 'should proxy to change');
  });

  test('#get returns change that is a blank value', function(assert) {
    set(dummyModel, 'name', 'Jim Bob');
    let dummyChangeset = new Changeset(dummyModel);
    set(dummyChangeset, 'name', '');
    let result = get(dummyChangeset, 'name');

    assert.equal(result, '', 'should proxy to change');
  });

  test('#get returns change that is has undefined as value', function(assert) {
    set(dummyModel, 'name', 'Jim Bob');
    let dummyChangeset = new Changeset(dummyModel);
    set(dummyChangeset, 'name', undefined);
    let result = get(dummyChangeset, 'name');

    assert.equal(result, undefined, 'should proxy to change');
  });

  test('nested objects will return correct values', function(assert) {
    set(dummyModel, 'org', {
      asia: { sg: '_initial' },  // for the sake of disambiguating nulls
      usa: {
        ca: null,
        ny: null,
        ma: { name: null }
      }
    });

    let dummyChangeset = new Changeset(dummyModel, dummyValidator);
    assert.equal(dummyChangeset.get('org.asia.sg'), '_initial', 'returns initial value');
    dummyChangeset.set('org.asia.sg', 'sg');
    assert.equal(dummyChangeset.get('org.asia.sg'), 'sg', 'returns newly set value');
  });

  test('nested objects can contain arrays', function(assert) {
    assert.expect(7);
    setProperties(dummyModel, {
      name: 'Bob',
      contact: {
        emails: [ 'bob@email.com', 'the_bob@email.com' ]
      }
    });

    assert.deepEqual(dummyModel.get('contact.emails'), [ 'bob@email.com', 'the_bob@email.com' ], 'returns initial model value');
    let dummyChangeset = new Changeset(dummyModel, dummyValidator);
    assert.equal(dummyChangeset.get('name'), 'Bob', 'returns changeset initial value');
    assert.deepEqual(dummyChangeset.get('contact.emails'), [ 'bob@email.com', 'the_bob@email.com' ], 'returns changeset initial value');
    dummyChangeset.set('contact.emails', [ 'fred@email.com', 'the_fred@email.com' ]);
    assert.deepEqual(dummyChangeset.get('contact.emails'), [ 'fred@email.com', 'the_fred@email.com' ], 'returns changeset changed value');

    dummyChangeset.rollback();
    assert.deepEqual(dummyChangeset.get('contact.emails'), [ 'bob@email.com', 'the_bob@email.com' ], 'returns changeset rolledback value');
    dummyChangeset.set('contact.emails', [ 'fred@email.com', 'the_fred@email.com' ]);
    assert.deepEqual(dummyChangeset.get('contact.emails'), [ 'fred@email.com', 'the_fred@email.com' ], 'returns changeset changed value');

    dummyChangeset.execute();
    assert.deepEqual(dummyModel.get('contact.emails'), [ 'fred@email.com', 'the_fred@email.com' ], 'returns model saved value');
  });

  test('#getted Object proxies to underlying method', function(assert) {
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
          dog: new Dog('shiba inu, wow')
        }
      }
    };

    {
      let c = new Changeset(model);
      let actual = c.get('foo.bar.dog').bark();
      let expectedResult = "woof i'm a shiba inu, wow";
      assert.equal(actual, expectedResult, 'should proxy to underlying method');
    }

    {
      let c = new Changeset(model);
      let actual = get(c, 'foo.bar.dog');
      let expectedResult = get(model, 'foo.bar.dog');
      assert.equal(actual, expectedResult, "using Ember.get will work");
    }

    {
      let c = new Changeset(model);
      let actual = get(c, 'foo.bar.dog');
      let expectedResult = get(model, 'foo.bar.dog');
      assert.equal(actual, expectedResult, "you dont have to use .content");
    }
  });

  /**
   * #set
   */

  test('#set adds a change if valid', function(assert) {
    let expectedChanges = [{ key: 'name', value: 'foo' }];
    let dummyChangeset = new Changeset(dummyModel);
    dummyChangeset.set('name', 'foo');
    let changes = get(dummyChangeset, 'changes');

    assert.equal(dummyModel.name, undefined, 'should keep change');
    assert.equal(dummyChangeset.get('name'), 'foo', 'should have new change');

    assert.deepEqual(changes, expectedChanges, 'should add change');
  });

  test('#set adds a change if the key is an object', function(assert) {
    set(dummyModel, 'org', {
      usa: {
        ny: 'ny',
      }
    });

    let c = new Changeset(dummyModel);
    c.set('org.usa.ny', 'foo');

    assert.equal(dummyModel.org.usa.ny, 'ny', 'should keep change');
    assert.equal(c.get('org.usa.ny'), 'foo', 'should have new change');

    let expectedChanges = [{ key: 'org.usa.ny', value: 'foo' }];
    let changes = get(c, 'changes');

    assert.deepEqual(changes, expectedChanges, 'should add change');
  });

  test('#set adds a change if value is an object', function(assert) {
    class Moment {
      constructor(date) {
        this.date = date;
      }
    }
    let c = new Changeset(dummyModel);
    let d = new Date();
    let momentInstance = new Moment(d);
    c.set('startDate', momentInstance);

    let expectedChanges = [{ key: 'startDate', value: momentInstance }];
    let changes = get(c, 'changes');

    assert.deepEqual(changes, expectedChanges, 'should add change');

    let newValue = c.get('startDate');
    assert.deepEqual(newValue, momentInstance, 'correct getter');
    assert.ok(newValue instanceof Moment, 'correct instance');
    assert.equal(newValue.date, d, 'correct date on moment object');

    newValue = get(c, 'startDate');
    assert.deepEqual(newValue, momentInstance, 'correct getter');
    assert.ok(newValue instanceof Moment, 'correct instance');
    assert.equal(newValue.date, d, 'correct date on moment object');
  });

  test('#set supports `undefined`', function(assert) {
    let model = EmberObject.create({ name: 'foo' });
    let dummyChangeset = new Changeset(model);

    dummyChangeset.set('name', undefined);
    assert.equal(
      get(dummyChangeset, 'name'),
      undefined,
      'should return changed value'
    );
    assert.deepEqual(
      get(dummyChangeset, 'changes'),
      [{ key: 'name', value: undefined }],
      'should add change'
    );
  });

  test('#set does not add a change if new value equals old value', function(assert) {
    let model = EmberObject.create({ name: 'foo' });
    let dummyChangeset = new Changeset(model);

    dummyChangeset.set('name', 'foo');
    assert.deepEqual(
      get(dummyChangeset, 'changes'),
      [],
      'change is not added if new value equals old value'
    );
  });

  test('#set does not add a change if new value equals old value and `skipValidate` is true', function(assert) {
    let model = EmberObject.create({ name: 'foo' });
    let dummyChangeset = new Changeset(model, {}, null, {skipValidate: true});

    dummyChangeset.set('name', 'foo');
    assert.deepEqual(
      get(dummyChangeset, 'changes'),
      [],
      'change is not added if new value equals old value'
    );
  });

  test('#set removes a change if set back to original value', function(assert) {
    let model = EmberObject.create({ name: 'foo' });
    let dummyChangeset = new Changeset(model);

    dummyChangeset.set('name', 'bar');
    assert.deepEqual(
      get(dummyChangeset, 'changes'),
      [{ key: 'name', value: 'bar' }],
      'change is added when value is different than original value'
    );

    dummyChangeset.set('name', 'foo');
    assert.deepEqual(
      get(dummyChangeset, 'changes'),
      [],
      'change is removed when new value matches original value'
    );
  });

  test('#set removes a change if set back to original value when obj is ProxyObject', function(assert) {
    let model = ObjectProxy.create({ content: { name: 'foo' } });
    let dummyChangeset = new Changeset(model);

    dummyChangeset.set('name', 'bar');
    assert.deepEqual(
      get(dummyChangeset, 'changes'),
      [{ key: 'name', value: 'bar' }],
      'change is added when value is different than original value'
    );

    dummyChangeset.set('name', 'foo');
    assert.deepEqual(
      get(dummyChangeset, 'changes'),
      [],
      'change is removed when new value matches original value'
    );
  });

  test('#set does add a change if invalid', function(assert) {
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

    let expectedChanges = [{ "key": "name", "value": "a" }, { "key": "password", "value": false }];
    assert.deepEqual(changes, expectedChanges, 'should add change');
    assert.deepEqual(errors, expectedErrors, 'should have errors');
    assert.notOk(isValid, 'should not be valid');
    assert.ok(isInvalid, 'should be invalid');
  });

  test('#set adds the change without validation if `skipValidate` option is set', function(assert) {
    let expectedChanges = [{ key: 'password', value: false }];

    let dummyChangeset = new Changeset(dummyModel, dummyValidator, null, {skipValidate: true});
    dummyChangeset.set('password', false);
    let changes = get(dummyChangeset, 'changes');

    assert.deepEqual(changes, expectedChanges, 'should add change');
  });

  test('#set should remove nested changes when setting roots', function(assert) {
    set(dummyModel, 'org', {
      usa: {
        ny: 'ny',
        ca: 'ca',
      },
    });

    let c = new Changeset(dummyModel);
    c.set('org.usa.ny', 'foo');
    c.set('org.usa.ca', 'bar');
    c.set('org', 'no usa for you')

    let actual = get(c, 'changes');
    let expectedResult = [{ key: 'org', value: 'no usa for you' }];
    assert.deepEqual(actual, expectedResult, 'removes nested changes');
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

  test('it accepts async validations', function(assert) {
    let done = assert.async();
    let dummyChangeset = new Changeset(dummyModel, dummyValidator);
    let expectedChanges = [{ key: 'async', value: true }];
    let expectedError = { async: { validation: 'is invalid', value: 'is invalid' } };
    run(() => dummyChangeset.set('async', true));
    run(() => assert.deepEqual(get(dummyChangeset, 'changes'), expectedChanges, 'should set change'));
    run(() => dummyChangeset.set('async', 'is invalid'));
    run(() => {
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

  test('#set should delete nested changes when equal', function(assert) {
    set(dummyModel, 'org', {
      usa: { ny: 'i need a vacation' }
    });

    let c = new Changeset(dummyModel, dummyValidator, dummyValidations);
    c.set('org.usa.ny', 'whoop');
    c.set('org.usa.ny', 'i need a vacation');

    let actual = get(c, 'change.org.usa.ny');
    let expectedResult = undefined;
    assert.equal(actual, expectedResult, 'should clear nested key');
  });

  test('#set works when replacing an Object with an primitive', function(assert) {
    let model = { foo: { bar: { baz: 42 } } };

    let c = new Changeset(model);
    assert.deepEqual(c.get('foo'), get(model, 'foo'));

    c.set('foo', 'not an object anymore');
    c.execute();
    assert.equal(c.get('foo'), get(model, 'foo'));
  });

  /**
   * #prepare
   */

  test('#prepare provides callback to modify changes', function(assert) {
    let date = new Date();
    let dummyChangeset = new Changeset(dummyModel);
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
    assert.equal(get(dummyModel, 'first-name'), 'foo', 'should update changes');
    assert.equal(get(dummyModel, 'date-of-birth'), date, 'should update changes');
  });

  test('#prepare throws if callback does not return object', function(assert) {
    let dummyChangeset = new Changeset(dummyModel);
    dummyChangeset.set('first_name', 'foo');

    try {
      dummyChangeset.prepare(() => { return 'foo'; });
    } catch({ message }) {
      assert.throws(
        ({message}) => message === "Assertion Failed: Callback to `changeset.prepare` must return an object",
        'should throw error'
      );
    }
  });

  /**
   * #execute
   */

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

  test('#execute does not remove original nested objects', function(a) {
    class DogTag {}

    let dog = {};
    dog.info = new DogTag;
    dog.info.name = 'mishka';
    dog.info.breed = 'husky';

    let c = new Changeset(dog);
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
      result: () => ({ org: { usa: { ny: '', ca: 'bar' } } }),
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
    test(`#execute - table-driven test ${i+1}`, function(assert) {
      let m = model();
      let c = new Changeset(m);

      setCalls.forEach(([k, v]) => c.set(k, v));
      c.execute();

      let actual = m;
      let expectedResult = result();
      assert.deepEqual(actual, expectedResult, `table driven test ${i+1}`);
    });
  });

  test('it works with nested keys', function(assert) {
    let expectedResult = {
      org: {
        asia: { sg: 'sg' },
        usa: {
          ca: 'ca',
          ny: 'ny',
          ma: { name: 'Massachusetts' }
        }
      }
    };
    set(dummyModel, 'org', {
      asia: { sg: null },
      usa: {
        ca: null,
        ny: null,
        ma: { name: null }
      }
    });

    let dummyChangeset = new Changeset(dummyModel, dummyValidator);
    dummyChangeset.set('org.asia.sg', 'sg');
    dummyChangeset.set('org.usa.ca', 'ca');
    dummyChangeset.set('org.usa.ny', 'ny');
    dummyChangeset.set('org.usa.ma', { name: 'Massachusetts' });
    dummyChangeset.execute();
    assert.deepEqual(get(dummyChangeset, 'change'), expectedResult, 'should have correct shape');
    assert.deepEqual(get(dummyModel, 'org'), expectedResult.org, 'should set value');
  });

  /**
   * #save
   */

  test('#save proxies to content', function(assert) {
    let result;
    let options;
    let done = assert.async();
    set(dummyModel, 'save', (dummyOptions) => {
      result = 'ok';
      options = dummyOptions;
      return resolve('saveResult');
    });
    let dummyChangeset = new Changeset(dummyModel);
    dummyChangeset.set('name', 'foo');

    assert.equal(result, undefined, 'precondition');
    let promise = dummyChangeset.save('test options');
    assert.equal(result, 'ok', 'should save');
    assert.deepEqual(get(dummyChangeset, 'change'), { name: 'foo' }, 'should save');
    assert.equal(options, 'test options', 'should proxy options when saving');
    assert.ok(!!promise && typeof promise.then === 'function', 'save returns a promise');
    promise.then((saveResult) => {
      assert.equal(saveResult, 'saveResult', 'save proxies to save promise of content');
    }).finally(() => done());
  });

  test('#save handles non-promise proxy content', function(assert) {
    let result;
    let options;
    let done = assert.async();
    set(dummyModel, 'save', (dummyOptions) => {
      result = 'ok';
      options = dummyOptions;
      return 'saveResult';
    });
    let dummyChangeset = new Changeset(dummyModel);
    dummyChangeset.set('name', 'foo');

    assert.equal(result, undefined, 'precondition');
    let promise = dummyChangeset.save('test options');
    assert.equal(result, 'ok', 'should save');
    assert.equal(options, 'test options', 'should proxy options when saving');
    assert.ok(!!promise && typeof promise.then === 'function', 'save returns a promise');
    promise.then((saveResult) => {
      assert.equal(saveResult, 'saveResult', 'save proxies to save promise of content');
    }).finally(() => done());
  });

  test('#save handles rejected proxy content', function(assert) {
    assert.expect(1);

    let done = assert.async();
    let dummyChangeset = new Changeset(dummyModel);

    assert.expect(1);

    set(dummyModel, 'save', () => {
      return new Promise((resolve, reject) => {
        next(null, reject, new Error('some ember data error'));
      });
    });

    dummyChangeset.save()
      .then(() => {
        assert.ok(false, 'WAT?!');
      })
      .catch((error) => {
        assert.equal(error.message, 'some ember data error');
      })
      .finally(() => done());
  });

  test('#save proxies to content even if it does not implement #save', function(assert) {
    let done = assert.async();
    let person = { name: 'Jim' };
    let dummyChangeset = new Changeset(person);
    dummyChangeset.set('name', 'foo');

    return dummyChangeset.save().then(() => {
      assert.equal(get(person, 'name'), 'foo', 'persist changes to content');
      done();
    });
  });

  /**
   * #merge
   */

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

  test('#merge merges invalid changesets', function(assert) {
    let dummyChangesetA = new Changeset(dummyModel, dummyValidator);
    let dummyChangesetB = new Changeset(dummyModel, dummyValidator);
    let dummyChangesetC = new Changeset(dummyModel, dummyValidator);
    dummyChangesetA.set('age', 21);
    dummyChangesetA.set('name', 'a');
    dummyChangesetB.set('name', 'Tony Stark');
    dummyChangesetC.set('name', 'b');

    let dummyChangesetD = dummyChangesetA.merge(dummyChangesetB);
    dummyChangesetD = dummyChangesetD.merge(dummyChangesetC);

    let expectedChanges = [{ key: 'age', value: 21 }, { key: 'name', value: 'b'}];
    let expectedErrors = [{ key: 'name', 'validation': 'too short', value: 'b' }];

    assert.deepEqual(get(dummyChangesetA, 'isInvalid'), true, 'changesetA is not valid becuase of name');
    assert.deepEqual(get(dummyChangesetB, 'isValid'), true, 'changesetB should be invalid');
    assert.deepEqual(get(dummyChangesetC, 'isInvalid'), true, 'changesetC should be invalid');
    assert.deepEqual(get(dummyChangesetD, 'isInvalid'), true, 'changesetD should be invalid');
    assert.deepEqual(get(dummyChangesetD, 'changes'), expectedChanges, 'should not merge invalid changes');
    assert.deepEqual(get(dummyChangesetD, 'errors'), expectedErrors, 'should assign errors from both changesets');
  });

  test('#merge does not merge a changeset with a non-changeset', function(assert) {
    let dummyChangesetA = new Changeset(dummyModel, dummyValidator);
    let dummyChangesetB = { _changes: { name: 'b' } };
    dummyChangesetA.set('name', 'a');

    try {
      dummyChangesetA.merge(dummyChangesetB);
    } catch({ message }) {
      assert.throws(
        ({message}) => message === "Assertion Failed: Cannot merge with a non-changeset",
        'should throw error'
      );
    }
  });

  test('#merge does not merge a changeset with different content', function(assert) {
    let dummyChangesetA = new Changeset(dummyModel, dummyValidator);
    let dummyChangesetB = new Changeset(EmberObject.create(), dummyValidator);

    try {
      dummyChangesetA.merge(dummyChangesetB);
    } catch({ message }) {
      assert.throws(
        ({message}) => message === "Assertion Failed: Cannot merge with a changeset of different content",
        'should throw error'
      );
    }
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

  /**
   * #rollback
   */

  test('#rollback restores old values', function(assert) {
    let dummyChangeset = new Changeset(dummyModel, dummyValidator);
    let expectedChanges = [
      { key: 'firstName', value: 'foo' },
      { key: 'lastName', value: 'bar' },
      { key: 'name', value: '' }
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

  test('#rollback resets valid state', function(assert) {
    let dummyChangeset = new Changeset(dummyModel, dummyValidator);
    dummyChangeset.set('name', 'a');

    assert.ok(get(dummyChangeset, 'isInvalid'), 'should be invalid');
    dummyChangeset.rollback();
    assert.ok(get(dummyChangeset, 'isValid'), 'should be valid');
  });

  test('#rollback twice works', function(assert) {
    let dummyChangeset = new Changeset(dummyModel);
    dummyChangeset.set('name', 'abcde');

    let expectedChanges = [
      { key: 'name', value: 'abcde' }
    ];
    assert.deepEqual(get(dummyChangeset, 'changes'), expectedChanges, 'name is set');
    dummyChangeset.rollback();
    assert.deepEqual(get(dummyChangeset, 'changes'), [], 'rolls back');

    dummyChangeset.set('name', 'mnop');
    expectedChanges = [
      { key: 'name', value: 'mnop' }
    ];
    assert.deepEqual(get(dummyChangeset, 'changes'), expectedChanges, 'name is set');
    dummyChangeset.rollback();
    assert.deepEqual(get(dummyChangeset, 'changes'), [], 'rolls back');
  });

  test('#rollback twice with nested keys works', function(assert) {
    set(dummyModel, 'org', {
      asia: { sg: null },
    });
    let dummyChangeset = new Changeset(dummyModel);
    dummyChangeset.set('org.asia.sg', 'sg');

    let expectedChanges = [
      { key: 'org.asia.sg', value: 'sg' }
    ];
    assert.deepEqual(get(dummyChangeset, 'changes'), expectedChanges, 'org is set');
    dummyChangeset.rollback();
    assert.deepEqual(get(dummyChangeset, 'changes'), [], 'rolls back');

    dummyChangeset.set('org.asia.sg', 'Singapore');
    expectedChanges = [
      { key: 'org.asia.sg', value: 'Singapore' }
    ];
    assert.deepEqual(get(dummyChangeset, 'changes'), expectedChanges, 'org is set');
    dummyChangeset.rollback();
    assert.deepEqual(get(dummyChangeset, 'changes'), [], 'rolls back');
  });

  test('#rollbackInvalid clears errors and keeps valid values', function(assert) {
    let dummyChangeset = new Changeset(dummyModel, dummyValidator);
    let expectedChanges = [
      { key: 'firstName', value: 'foo' },
      { key: 'lastName', value: 'bar' },
      { key: 'name', value: '' }
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
      { key: 'lastName', value: 'bar' }
    ];
    assert.deepEqual(get(dummyChangeset, 'changes'), expectedChanges, 'should not rollback');
    assert.deepEqual(get(dummyChangeset, 'errors'), [], 'should rollback');
  });

  test('#rollbackInvalid a specific key clears key error and keeps valid values', function(assert) {
    let dummyChangeset = new Changeset(dummyModel, dummyValidator);
    let expectedChanges = [
      { key: 'firstName', value: 'foo' },
      { key: 'lastName', value: 'bar' },
      { key: 'password', value: false },
      { key: 'name', value: '' }
    ];
    let expectedErrors = [
      { key: 'password', validation: ['foo', 'bar'], value: false },
      { key: 'name', validation: 'too short', value: '' }
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
      { key: 'password', value: false }
    ];
    assert.deepEqual(get(dummyChangeset, 'changes'), expectedChanges, 'should not rollback');
    expectedErrors = [
      { key: 'password', validation: ['foo', 'bar'], value: false }
    ];
    assert.deepEqual(get(dummyChangeset, 'errors'), expectedErrors, 'should rollback');
  });

  test('#rollbackInvalid resets valid state', function(assert) {
    let dummyChangeset = new Changeset(dummyModel, dummyValidator);
    dummyChangeset.set('name', 'a');

    assert.ok(get(dummyChangeset, 'isInvalid'), 'should be invalid');
    dummyChangeset.rollbackInvalid();
    assert.ok(get(dummyChangeset, 'isValid'), 'should be valid');
  });

  test('#rollbackInvalid will not remove changes that are valid', function(assert) {
    let dummyChangeset = new Changeset(dummyModel, dummyValidator);
    dummyChangeset.set('name', 'abcd');

    let expectedChanges = [
      { key: 'name', value: 'abcd' },
    ];
    assert.deepEqual(get(dummyChangeset, 'changes'), expectedChanges, 'has correct changes');
    assert.ok(get(dummyChangeset, 'isValid'), 'should be valid');
    dummyChangeset.rollbackInvalid('name');
    assert.deepEqual(get(dummyChangeset, 'changes'), expectedChanges, 'should not remove valid changes');
    assert.ok(get(dummyChangeset, 'isValid'), 'should still be valid');
  });


  test('#rollbackInvalid works for keys not on changeset', function(assert) {
    let dummyChangeset = new Changeset(dummyModel, dummyValidator);
    let expectedChanges = [
      { key: 'firstName', value: 'foo' },
      { key: 'lastName', value: 'bar' },
      { key: 'name', value: '' }
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

  test('#rollbackProperty restores old value for specified property only', function(assert) {
    set(dummyModel, 'firstName', 'Jim');
    set(dummyModel, 'lastName', 'Bob');
    let dummyChangeset = new Changeset(dummyModel, dummyValidator);
    let expectedChanges = [
      { key: 'lastName', value: 'bar' }
    ];
    dummyChangeset.set('firstName', 'foo');
    dummyChangeset.set('lastName', 'bar');

    dummyChangeset.rollbackProperty('firstName');
    assert.deepEqual(get(dummyChangeset, 'changes'), expectedChanges, 'should rollback single property');
  });

  test('#rollbackProperty clears errors for specified property', function(assert) {
    let dummyChangeset = new Changeset(dummyModel, dummyValidator);
    let expectedChanges = [
      { key: 'firstName', value: 'foo' },
      { key: 'lastName', value: 'bar' },
      { key: 'name', value: '' }
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
      { key: 'lastName', value: 'bar' }
    ];
    assert.deepEqual(get(dummyChangeset, 'changes'), expectedChanges, 'should not rollback');
    assert.deepEqual(get(dummyChangeset, 'errors'), [], 'should rollback');
  });

  test('#rollbackProperty resets valid state', function(assert) {
    let dummyChangeset = new Changeset(dummyModel, dummyValidator);
    dummyChangeset.set('name', 'a');

    assert.ok(get(dummyChangeset, 'isInvalid'), 'should be invalid');
    dummyChangeset.rollbackProperty('name');
    assert.ok(get(dummyChangeset, 'isValid'), 'should be valid');
  });

  test('observing #rollback values', function(assert) {
    let res;
    let changeset = new Changeset(dummyModel, dummyValidator);
    changeset.addObserver('name', function() { res = this.get('name') });
    assert.equal(undefined, changeset.get('name'), 'initial value');
    changeset.set('name', 'Jack');
    assert.equal('Jack', res, 'observer fired when setting value');
    changeset.rollback();
    assert.equal(undefined, res, 'observer fired with the value name was rollback to');
  });

  test('can update nested keys after rollback changes.', function(assert) {
    let expectedResult = {
      org: {
        asia: { sg: 'sg' },
        usa: {
          ny: 'ny',
          ma: { name: 'Massachusetts' }
        }
      }
    };
    set(dummyModel, 'org', {
      asia: { sg: null },
      usa: {
        ny: null,
        ma: { name: null }
      }
    });

    let dummyChangeset = new Changeset(dummyModel, dummyValidator);
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

  test('#validate/0 validates all fields immediately', function(assert) {
    let done = assert.async();
    dummyModel.setProperties({ name: 'J', password: false, options: null });
    let dummyChangeset = new Changeset(dummyModel, dummyValidator, dummyValidations);

    run(() => {
      dummyChangeset.validate().then(() => {
        assert.deepEqual(get(dummyChangeset, 'error.password'), { validation: ['foo', 'bar'], value: false }, 'should validate immediately');
        assert.deepEqual(get(dummyChangeset, 'changes'), [], 'should not set changes');
        assert.equal(get(dummyChangeset, 'errors.length'), 5, 'should have 5 errors');
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
    dummyModel.setProperties({ name: undefined, password: false, async: true, passwordConfirmation: false, options: {}});
    let dummyChangeset = new Changeset(dummyModel, dummyValidator, dummyValidations);

    run(() => {
      dummyChangeset.set('name', 'Jim Bob');
      dummyChangeset.validate().then(() => {
        assert.equal(get(dummyChangeset, 'errors.length'), 1, 'should have 1 error');
        assert.equal(get(dummyChangeset, 'errors.0.key'), 'password');
        assert.ok(get(dummyChangeset, 'isInvalid'), 'should be invalid');
      });
    });

    run(() => {
      dummyChangeset.set('passwordConfirmation', true);
      dummyChangeset.validate().then(() => {
        assert.equal(get(dummyChangeset, 'errors.length'), 2, 'should have 2 errors');
        assert.equal(get(dummyChangeset, 'errors.0.key'), 'password');
        assert.equal(get(dummyChangeset, 'errors.1.key'), 'passwordConfirmation');
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

  test('#validate works correctly with complex values', function(assert) {
    let done = assert.async();
    dummyModel.setProperties({});
    let dummyChangeset = new Changeset(dummyModel, dummyValidator, dummyValidations);

    run(() => {
      dummyChangeset.set('options', { persist: true });
      dummyChangeset.validate().then(() => {
        assert.deepEqual(get(dummyChangeset, 'changes.0'), { key: 'options', value: { persist: true }});
        done();
      });
    });
  });

  test('#validate marks actual valid changes', function(assert) {
    let done = assert.async();
    dummyModel.setProperties({ name: 'Jim Bob', password: true, passwordConfirmation: true, async: true });
    let dummyChangeset = new Changeset(dummyModel, dummyValidator, dummyValidations);

    dummyChangeset.set('name', 'foo bar');
    dummyChangeset.set('password', false);

    run(() => {
      dummyChangeset.validate().then(() => {
        assert.deepEqual(get(dummyChangeset, 'changes'), [{ key: 'name', value: 'foo bar' }, { key: 'password', value: false }]);
        done();
      });
    });
  });

  test('#validate does not mark changes when nothing has changed', function(assert) {
    let done = assert.async();
    let options = {
      persist: true,
      // test isEqual to ensure we're using Ember.isEqual for comparison
      isEqual(other) {
        return this.persist === get(other, 'persist');
      }
    };
    dummyModel.setProperties({ name: 'Jim Bob', password: true, passwordConfirmation: true, async: true, options});
    let dummyChangeset = new Changeset(dummyModel, dummyValidator, dummyValidations);

    dummyChangeset.set('options', options);

    run(() => {
      dummyChangeset.validate().then(() => {
        assert.deepEqual(get(dummyChangeset, 'error'), {});
        assert.deepEqual(get(dummyChangeset, 'changes'), []);
        done();
      });
    });
  });

  test('#validate/nested validates nested fields immediately', function(assert) {
    let done = assert.async();
    set(dummyModel, 'org', {
      usa: {
        ny: null,
      }
    });

    let dummyChangeset = new Changeset(dummyModel, dummyValidator, dummyValidations);
    dummyChangeset.validate('org.usa.ny').then(() => {
      assert.deepEqual(get(dummyChangeset, 'error.org.usa.ny'), { validation: 'must be present', value: null }, 'should validate immediately');
      assert.deepEqual(get(dummyChangeset, 'changes'), [], 'should not set changes');
      assert.equal(get(dummyChangeset, 'errors.length'), 1, 'should only have 1 error');
      done();
    });
  });

  /**
   * #addError
   */

  test('#addError adds an error to the changeset', function(assert) {
    let dummyChangeset = new Changeset(dummyModel);
    dummyChangeset.addError('email', {
      value: 'jim@bob.com',
      validation: 'Email already taken'
    });

    assert.ok(get(dummyChangeset, 'isInvalid'), 'should be invalid');
    assert.equal(get(dummyChangeset, 'error.email.validation'), 'Email already taken', 'should add the error');
    dummyChangeset.set('email', 'unique@email.com');
    assert.ok(get(dummyChangeset, 'isValid'), 'should be valid');
  });

  test('#addError adds an error to the changeset using the shortcut', function (assert) {
    let dummyChangeset = new Changeset(dummyModel);
    dummyChangeset.set('email', 'jim@bob.com');
    dummyChangeset.addError('email', 'Email already taken');

    assert.ok(get(dummyChangeset, 'isInvalid'), 'should be invalid');
    assert.equal(get(dummyChangeset, 'error.email.validation'), 'Email already taken', 'should add the error');
    assert.equal(get(dummyChangeset, 'error.email.value'), 'jim@bob.com', 'addError uses already present value');
    assert.deepEqual(get(dummyChangeset, 'changes'), [{ key: 'email', value: 'jim@bob.com'}], 'errors set as changes on changeset');
    dummyChangeset.set('email', 'unique@email.com');
    assert.ok(get(dummyChangeset, 'isValid'), 'should be valid');
    assert.deepEqual(get(dummyChangeset, 'changes')[0], { key: 'email', value: 'unique@email.com' }, 'has correct changes');
  });

  test('#addError adds an error to the changeset on a nested property', function(assert) {
    let dummyChangeset = new Changeset(dummyModel);
    dummyChangeset.addError('email.localPart', 'Cannot contain +');


    assert.ok(get(dummyChangeset, 'isInvalid'), 'should be invalid');
    assert.equal(get(dummyChangeset, 'error.email.localPart.validation'), 'Cannot contain +', 'should add the error');
    dummyChangeset.set('email.localPart', 'ok');
    assert.ok(get(dummyChangeset, 'isValid'), 'should be valid');
  });


  /**
   * #pushErrors
   */

  test('#pushErrors pushes an error into an array of existing validations', function (assert) {
    let dummyChangeset = new Changeset(dummyModel);
    dummyChangeset.set('email', 'jim@bob.com');
    dummyChangeset.addError('email', 'Email already taken');
    dummyChangeset.pushErrors('email', 'Invalid email format');

    assert.ok(get(dummyChangeset, 'isInvalid'), 'should be invalid');
    assert.deepEqual(get(dummyChangeset, 'error.email.validation'), ['Email already taken', 'Invalid email format'], 'should push the error');
    assert.equal(get(dummyChangeset, 'error.email.value'), 'jim@bob.com', 'pushErrors uses already present value');
    assert.deepEqual(get(dummyChangeset, 'changes'), [{ key: 'email', value: 'jim@bob.com' }], 'pushErrors does not clear the changes on the changeset');
    dummyChangeset.set('email', 'unique@email.com');
    assert.ok(get(dummyChangeset, 'isValid'), 'should be valid');
    assert.deepEqual(get(dummyChangeset, 'changes')[0], { key: 'email', value: 'unique@email.com' }, 'has correct changes');
  });

  test('#pushErrors pushes an error if no existing validations are present', function (assert) {
    let dummyChangeset = new Changeset(dummyModel, dummyValidator);
    dummyChangeset.set('name', 'J');
    dummyChangeset.pushErrors('name', 'cannot be J');

    assert.ok(get(dummyChangeset, 'isInvalid'), 'should be invalid');
    assert.deepEqual(get(dummyChangeset, 'error.name.validation'), ['too short', 'cannot be J'], 'should push the error');
    assert.equal(get(dummyChangeset, 'error.name.value'), 'J', 'pushErrors uses already present value');
    dummyChangeset.set('name', 'Good name');
    assert.ok(get(dummyChangeset, 'isValid'), 'should be valid');
  });

  test('#pushErrors updates error object in a KVO compatible way', function (assert) {
    let dummyChangeset = new Changeset(dummyModel);

    let aComponentOrSomething = EmberObject.extend({
      errorsOnName: reads('changeset.error.name.validation')
    }).create({changeset: dummyChangeset});

    assert.notOk(get(aComponentOrSomething, 'errorsOnName'), 'starts off with no errors');

    dummyChangeset.set('name', 'J');
    dummyChangeset.pushErrors('name', 'cannot be J');

    assert.ok(get(dummyChangeset, 'isInvalid'), 'should be invalid');
    assert.deepEqual(get(dummyChangeset, 'error.name.validation'), ['cannot be J'], 'should push the error');
    assert.equal(get(dummyChangeset, 'error.name.value'), 'J', 'pushErrors uses already present value');
    assert.deepEqual(get(aComponentOrSomething, 'errorsOnName'), ['cannot be J'], 'pushErrors updates error object in a way that can be bound to');
    dummyChangeset.set('name', 'Good name');
    assert.ok(get(dummyChangeset, 'isValid'), 'should be valid');
    assert.notOk(get(aComponentOrSomething, 'errorsOnName'), 'clearing of errors can be bound to');
  });



  test('#pushErrors adds an error to the changeset on a nested property', function(assert) {
    let dummyChangeset = new Changeset(dummyModel);
    dummyChangeset.pushErrors('email.localPart', 'Cannot contain +');
    dummyChangeset.pushErrors('email.localPart', 'is too short');

    assert.ok(get(dummyChangeset, 'isInvalid'), 'should be invalid');
    assert.deepEqual(get(dummyChangeset, 'error.email.localPart.validation'), ['Cannot contain +', 'is too short'], 'should add the error');
    dummyChangeset.set('email.localPart', 'ok');
    assert.ok(get(dummyChangeset, 'isValid'), 'should be valid');
  });


  /**
   * #snapshot
   */

  test('#snapshot creates a snapshot of the changeset', function(assert) {
    let dummyChangeset = new Changeset(dummyModel, dummyValidator);
    dummyChangeset.set('name', 'Pokemon Go');
    dummyChangeset.set('password', false);
    let snapshot = dummyChangeset.snapshot();
    let expectedResult = {
      changes: { name: 'Pokemon Go', password: false },
      errors: { password: { validation: ['foo', 'bar'], value: false } }
    };

    assert.deepEqual(snapshot, expectedResult, 'should return snapshot');
    dummyChangeset.set('name', "Gotta catch'em all");
    assert.deepEqual(snapshot, expectedResult, 'should not be mutated');
  });

  /**
   * #restore
   */

  test('#restore restores a snapshot of the changeset', function(assert) {
    let dummyChangesetA = new Changeset(dummyModel, dummyValidator);
    let dummyChangesetB = new Changeset(dummyModel, dummyValidator);
    dummyChangesetA.set('name', 'Pokemon Go');
    dummyChangesetA.set('password', false);
    let snapshot = dummyChangesetA.snapshot();

    assert.ok(get(dummyChangesetB, 'isValid'), 'precondition - should be valid');
    dummyChangesetB.restore(snapshot);
    assert.ok(get(dummyChangesetB, 'isInvalid'), 'should be invalid');
    assert.equal(get(dummyChangesetB, 'change.name'), 'Pokemon Go', 'should restore changes');
    assert.deepEqual(get(dummyChangesetB, 'error.password'), { validation: ['foo', 'bar'], value: false }, 'should restore errors');
  });

  /**
   * #cast
   */

  test('#cast allows only specified keys to exist on the changeset', function(assert) {
    let dummyChangeset = new Changeset(dummyModel, dummyValidator);
    let expectedResult = [
      { 'key': 'name', 'value': 'Pokemon Go' },
      { 'key': 'password', 'value': true }
    ];
    let allowed = ['name', 'password'];
    dummyChangeset.set('name', 'Pokemon Go');
    dummyChangeset.set('password', true);
    dummyChangeset.set('unwantedProp', 123);
    dummyChangeset.cast(allowed);

    assert.deepEqual(dummyChangeset.get('changes'), expectedResult, 'should drop `unwantedProp');
    assert.equal(dummyChangeset.get('unwantedProp'), undefined, 'should remove unwanted changes');
  });

  test('#cast noops if no keys are passed', function(assert) {
    let dummyChangeset = new Changeset(dummyModel, dummyValidator);
    let expectedResult = [
      { 'key': 'name', 'value': 'Pokemon Go' },
      { 'key': 'password', 'value': true },
      { 'key': 'unwantedProp', 'value': 123 }
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

  test('isValidating returns true when validations have not resolved', function(assert) {
    let dummyChangeset;
    let _validator = () => new Promise(() => {});
    let _validations = {
      reservations() {
        return _validator();
      }
    };

    set(dummyModel, 'reservations', 'ABC12345');
    dummyChangeset = new Changeset(dummyModel, _validator, _validations);
    set(dummyChangeset, 'reservations', 'DCE12345');

    dummyChangeset.validate();
    // assert.deepEqual(get(dummyChangeset, 'change'), { reservations: 'DCE12345' });

    assert.ok(dummyChangeset.isValidating(),
      'isValidating should be true when no key is passed in and something is validating');
    assert.ok(dummyChangeset.isValidating('reservations'),
      'isValidating should be true when the key that is passed is validating');
  });

  test('isValidating returns false when validations have resolved', function(assert) {
    let dummyChangeset;
    let _validator = () => resolve(true);
    let _validations = {
      reservations() {
        return _validator();
      }
    };

    set(dummyModel, 'reservations', 'ABC12345');
    dummyChangeset = new Changeset(dummyModel, _validator, _validations);

    dummyChangeset.validate();
    assert.ok(dummyChangeset.isValidating(),
      'isValidating should be false when no key is passed in and nothing is validating');
    assert.ok(dummyChangeset.isValidating('reservations'),
      'isValidating should be false when the key that is passed in is not validating');
  });

  /**
   * beforeValidation
   */

  test('beforeValidation event is fired before validation', function(assert) {
    let dummyChangeset;
    let _validator = () => new Promise(() => {});
    let _validations = {
      reservations() {
        return _validator();
      }
    };
    let hasFired = false;

    set(dummyModel, 'reservations', 'ABC12345');
    dummyChangeset = new Changeset(dummyModel, _validator, _validations);
    dummyChangeset.on('beforeValidation', () => { hasFired = true; });

    dummyChangeset.validate();
    assert.ok(hasFired, 'beforeValidation should be triggered');
  });

  test('beforeValidation event is triggered with the key', function(assert) {
    let dummyChangeset;
    let _validator = () => new Promise(() => {});
    let _validations = {
      reservations() {
        return _validator();
      }
    };
    let hasFired = false;

    set(dummyModel, 'reservations', 'ABC12345');
    dummyChangeset = new Changeset(dummyModel, _validator, _validations);
    dummyChangeset.on('beforeValidation', key => {
      if(key === 'reservations') {
        hasFired = true;
      }
    });

    dummyChangeset.validate();
    assert.ok(hasFired, 'beforeValidation should be triggered with the key');
  });

  /**
   * afterValidation
   */

  test('afterValidation event is fired after validation', function(assert) {
    let dummyChangeset;
    let _validator = () => resolve(true);
    let _validations = {
      reservations() {
        return _validator();
      }
    };
    let hasFired = false;

    set(dummyModel, 'reservations', 'ABC12345');
    dummyChangeset = new Changeset(dummyModel, _validator, _validations);
    dummyChangeset.on('afterValidation', () => { hasFired = true; });

    run(() => {
      dummyChangeset.validate().then(() => {
        assert.ok(hasFired, 'afterValidation should be triggered');
      });
    });
  });

  test('afterValidation event is triggered with the key', function(assert) {
    let dummyChangeset;
    let _validator = () => resolve(true);
    let _validations = {
      reservations() {
        return _validator();
      }
    };
    let hasFired = false;

    set(dummyModel, 'reservations', 'ABC12345');
    dummyChangeset = new Changeset(dummyModel, _validator, _validations);
    dummyChangeset.on('afterValidation', key => {
      if(key === 'reservations') {
        hasFired = true;
      }
    });

    run(() => {
      dummyChangeset.validate().then(() => {
        assert.ok(hasFired, 'afterValidation should be triggered with the key');
      });
    });
  });

  /**
   * afterRollback
   */

  test('afterRollback event is fired after rollback', function(assert) {
    let dummyChangeset;
    let _validator = () => resolve(true);
    let _validations = {
      reservations() {
        return _validator();
      }
    };
    let hasFired = false;

    set(dummyModel, 'reservations', 'ABC12345');
    dummyChangeset = new Changeset(dummyModel, _validator, _validations);
    dummyChangeset.on('afterRollback', () => { hasFired = true; });

    run(() => {
      dummyChangeset.rollback();
      assert.ok(hasFired, 'afterRollback should be triggered');
    });
  });

  /**
   * Behavior.
   */

  test('can set nested keys after validate', function(assert) {
    assert.expect(0);

    let done = assert.async();
    set(dummyModel, 'org', {
      usa: { ny: null }
    });

    let c = new Changeset(dummyModel, dummyValidator, dummyValidations);
    c.validate('org.usa.ny')
      .then(() => c.set('org.usa.ny', 'should not fail'))
      .finally(done);
  });
});
