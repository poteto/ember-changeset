import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { typeOf, isPresent } from '@ember/utils';
import { Changeset } from 'ember-changeset';
import { lookupValidator } from 'validated-changeset';
import hbs from 'htmlbars-inline-precompile';
import { render, find, fillIn, click, blur, triggerEvent } from '@ember/test-helpers';

module('Integration | Helper | changeset', function (hooks) {
  setupRenderingTest(hooks);

  test('it validates changes', async function (assert) {
    let validations = {
      firstName(value) {
        return (isPresent(value) && value.length > 3) || 'too short';
      },
      lastName(value) {
        return (isPresent(value) && value.length > 3) || 'too short';
      },
    };
    this.dummyModel = { firstName: 'Jim', lastName: 'Bob' };
    this.validate = ({ key, newValue }) => {
      let validatorFn = validations[key];

      if (typeOf(validatorFn) === 'function') {
        return validatorFn(newValue);
      }
    };
    this.submit = (changeset) => changeset.validate();
    this.reset = (changeset) => changeset.rollback();
    await render(hbs`
      {{#with (changeset this.dummyModel this.validate) as |changesetObj|}}
        {{#if changesetObj.isInvalid}}
          <p id="errors-paragraph">There were one or more errors in your form.</p>
        {{/if}}
        {{input id="first-name" value=changesetObj.firstName}}
        {{input id="last-name" value=changesetObj.lastName}}
        <button id="submit-btn" {{on "click" (fn this.submit changesetObj)}}>Submit</button>
        <button id="reset-btn" {{on "click" (fn this.reset changesetObj)}}>Reset</button>
      {{/with}}
    `);

    await fillIn('#first-name', 'A');
    await click('#submit-btn');
    assert.ok(find('#errors-paragraph'), 'should be invalid');

    await fillIn('#first-name', 'Billy');
    await click('#submit-btn');
    assert.notOk(find('#errors-paragraph'), 'should be valid');
  });

  test('it accepts validation map', async function (assert) {
    let validations = {
      firstName(key, newValue) {
        return (isPresent(newValue) && newValue.length > 3) || 'too short';
      },
      lastName(key, newValue) {
        return (isPresent(newValue) && newValue.length > 3) || 'too short';
      },
    };
    this.dummyModel = { firstName: 'Jim', lastName: 'Bobbie' };
    this.validations = validations;
    this.submit = (changeset) => changeset.validate();
    this.reset = (changeset) => changeset.rollback();
    await render(hbs`
      {{#with (changeset this.dummyModel validations) as |changesetObj|}}
        {{#if changesetObj.isInvalid}}
          <p id="errors-paragraph">There were one or more errors in your form.</p>
        {{/if}}
        {{input id="first-name" value=changesetObj.firstName}}
        {{input id="last-name" value=changesetObj.lastName}}
        <button id="submit-btn" {{on "click" (fn this.submit changesetObj)}}>Submit</button>
        <button id="reset-btn" {{on "click" (fn this.reset changesetObj)}}>Reset</button>
      {{/with}}
    `);

    await fillIn('#first-name', 'A');
    await click('#submit-btn');
    assert.ok(find('#errors-paragraph'), 'should be invalid');

    await fillIn('#first-name', 'Billy');
    await click('#submit-btn');
    assert.notOk(find('#errors-paragraph'), 'should be valid');
  });

  test('it accepts validation map with multiple validations', async function (assert) {
    function validateLength() {
      return (key, newValue) => (isPresent(newValue) && newValue.length > 3) || 'too short';
    }
    function validateStartsUppercase() {
      return (key, newValue) =>
        (isPresent(newValue) && newValue.charCodeAt(0) > 65 && newValue.charCodeAt(0) < 90) || 'not upper case';
    }
    let validations = {
      firstName: [validateLength(), validateStartsUppercase()],
    };
    this.dummyModel = { firstName: 'Jim', lastName: 'Bobbie' };
    this.validations = validations;
    this.submit = (changeset) => changeset.validate();
    this.reset = (changeset) => changeset.rollback();
    await render(hbs`
      {{#with (changeset dummyModel validations) as |changesetObj|}}
        {{#if changesetObj.isInvalid}}
          <p id="errors-paragraph">There were one or more errors in your form.</p>
        {{/if}}
        {{input id="first-name" value=changesetObj.firstName}}
        {{input id="last-name" value=changesetObj.lastName}}
        <button id="submit-btn" {{on "click" (fn this.submit changesetObj)}}>Submit</button>
        <button id="reset-btn" {{on "click" (fn this.reset changesetObj)}}>Reset</button>
      {{/with}}
    `);

    await fillIn('#first-name', 'A');
    await click('#submit-btn');
    assert.ok(find('#errors-paragraph'), 'should be invalid');

    await fillIn('#first-name', 'Billy');
    await click('#submit-btn');
    assert.notOk(find('#errors-paragraph'), 'should be valid');
  });

  test('it accepts validation map with multiple validations with promises', async function (assert) {
    function validateLength() {
      return (key, newValue) => (isPresent(newValue) && Promise.resolve(newValue.length > 3)) || 'too short';
    }
    function validateStartsUppercase() {
      return (key, newValue) =>
        (isPresent(newValue) && newValue.charCodeAt(0) > 65 && newValue.charCodeAt(0) < 90) ||
        Promise.resolve('not upper case');
    }
    let validations = {
      firstName: [validateLength(), validateStartsUppercase()],
    };
    this.dummyModel = { firstName: 'Jim', lastName: 'Bobbie' };
    this.validations = validations;
    this.submit = (changeset) => changeset.validate();
    this.reset = (changeset) => changeset.rollback();
    await render(hbs`
      {{#with (changeset dummyModel validations) as |changesetObj|}}
        {{#if changesetObj.isInvalid}}
          <p id="errors-paragraph">There were one or more errors in your form.</p>
        {{/if}}
        {{input id="first-name" value=changesetObj.firstName}}
        {{input id="last-name" value=changesetObj.lastName}}
        <button id="submit-btn" {{on "click" (fn this.submit changesetObj)}}>Submit</button>
        <button id="reset-btn" {{on "click" (fn this.reset changesetObj)}}>Reset</button>
      {{/with}}
    `);

    await fillIn('#first-name', 'A');
    await click('#submit-btn');
    assert.ok(find('#errors-paragraph'), 'should be invalid');

    await fillIn('#first-name', 'Billy');
    await click('#submit-btn');
    assert.notOk(find('#errors-paragraph'), 'should be valid');
  });

  test('it rollsback changes', async function (assert) {
    this.dummyModel = { firstName: 'Jim' };
    this.reset = (changeset) => changeset.rollback();
    await render(hbs`
      {{#with (changeset dummyModel) as |changesetObj|}}
        {{input id="first-name" value=changesetObj.firstName}}
        <button id="reset-btn" {{on "click" (fn this.reset changesetObj)}}>Reset</button>
      {{/with}}
    `);

    assert.equal(find('#first-name').value, 'Jim', 'precondition');
    await fillIn('#first-name', 'foo');
    assert.equal(find('#first-name').value, 'foo', 'should update input');
    await click('#reset-btn');
    assert.equal(find('#first-name').value, 'Jim', 'should rollback');
  });

  test('it can be used with 1 argument', async function (assert) {
    this.dummyModel = { firstName: 'Jim', lastName: 'Bob' };
    this.submit = (changeset) => changeset.validate();
    this.reset = (changeset) => changeset.rollback();
    await render(hbs`
      {{#with (changeset dummyModel) as |changesetObj|}}
        {{#if changesetObj.isInvalid}}
          <p id="errors-paragraph">There were one or more errors in your form.</p>
        {{/if}}
        {{input value=changesetObj.firstName}}
        {{input value=changesetObj.lastName}}
        <button id="submit-btn" {{on "click" (fn this.submit changesetObj)}}>Submit</button>
        <button id="reset-btn" {{on "click" (fn this.reset changesetObj)}}>Reset</button>
      {{/with}}
    `);

    await click('#submit-btn');
    assert.notOk(find('#errors-paragraph'), 'should be valid');
  });

  test('it updates when set without a validator', async function (assert) {
    this.dummyModel = { firstName: 'Jim', lastName: 'Bob' };
    this.updateFirstName = (changeset, evt) => {
      changeset.firstName = evt.target.value;
    };
    await render(hbs`
      {{#with (changeset dummyModel) as |changesetObj|}}
        <h1>{{changesetObj.firstName}} {{changesetObj.lastName}}</h1>
        <input
          id="first-name"
          type="text"
          value={{changesetObj.firstName}}
          {{on "change" (fn this.updateFirstName changesetObj)}}>
        {{input id="last-name" value=changesetObj.lastName}}
      {{/with}}
    `);

    assert.equal(find('h1').textContent.trim(), 'Jim Bob', 'precondition');
    await fillIn('#first-name', 'foo');
    await fillIn('#last-name', 'bar');
    assert.equal(find('h1').textContent.trim(), 'foo bar', 'should update observable value');
  });

  test('it updates when set with a validator', async function (assert) {
    this.dummyModel = { firstName: 'Jim', lastName: 'Bob' };
    this.validate = () => true;
    this.updateFirstName = (changeset, evt) => {
      changeset.firstName = evt.target.value;
    };
    await render(hbs`
      {{#with (changeset this.dummyModel this.this.validate) as |changesetObj|}}
        <h1>{{changesetObj.firstName}} {{changesetObj.lastName}}</h1>
        <input
          id="first-name"
          type="text"
          value={{changesetObj.firstName}}
          {{on "change" (fn this.updateFirstName changesetObj)}}>
        {{input id="last-name" value=changesetObj.lastName}}
      {{/with}}
    `);

    assert.equal(find('h1').textContent.trim(), 'Jim Bob', 'precondition');
    await fillIn('#first-name', 'foo');
    await fillIn('#last-name', 'bar');
    assert.equal(find('h1').textContent.trim(), 'foo bar', 'should update observable value');
  });

  test('a passed down nested object updates when set without a validator', async function (assert) {
    let data = { person: { firstName: 'Jim', lastName: 'Bob' } };
    let changeset = Changeset(data);
    this.changeset = changeset;
    this.mutValue = (path, evt) => (this.changeset[path] = evt.target.value);

    await render(hbs`
      <h1>{{this.changeset.person.firstName}} {{this.changeset.person.lastName}}</h1>
      <input
        id="first-name"
        value={{this.changeset.person.firstName}}
        {{on "change" (fn this.mutValue "person.firstName")}}>
      <input id="last-name"
        value={{this.changeset.person.lastName}}
        {{on "change" (fn this.mutValue "person.lastName")}}>
    `);

    assert.equal(find('h1').textContent.trim(), 'Jim Bob', 'precondition');
    assert.equal(changeset.get('person.firstName'), 'Jim', 'precondition firstName');
    assert.equal(changeset.get('person.lastName'), 'Bob', 'precondition lastName');
    await fillIn('#first-name', 'foo');
    await fillIn('#last-name', 'bar');
    assert.equal(changeset.get('person.firstName'), 'foo', 'should update observable value');
    assert.equal(changeset.get('person.lastName'), 'bar', 'should update observable value lastName');
    assert.equal(changeset.get('person').firstName, 'foo', 'should work with top level key');
    assert.equal(changeset.get('person').lastName, 'bar', 'should work with top level key last name');
    assert.equal(changeset.person.firstName, 'foo', 'should work with top level key');
    assert.equal(
      changeset.get('_content').person.firstName,
      'Jim',
      "keeps value on model as execute hasn't been called"
    );
    assert.equal(find('h1').textContent.trim(), 'foo bar', 'should update observable value');
  });

  test('nested object updates when set without a validator', async function (assert) {
    let data = { person: { firstName: 'Jim', lastName: 'Bob' } };
    let changeset = Changeset(data);
    this.changeset = changeset;
    this.mutValue = (path, evt) => (this.changeset[path] = evt.target.value);

    await render(hbs`
      <h1>{{this.changeset.person.firstName}} {{this.changeset.person.lastName}}</h1>
      <input
        id="first-name"
        value={{this.changeset.person.firstName}}
        {{on "change" (fn this.mutValue "person.firstName")}}>
      <input
        id="last-name"
        value={{this.changeset.person.lastName}}
        {{on "change" (fn this.mutValue "person.lastName")}}>
    `);

    assert.equal(find('h1').textContent.trim(), 'Jim Bob', 'precondition');
    await fillIn('#first-name', 'foo');
    await fillIn('#last-name', 'bar');
    assert.equal(find('h1').textContent.trim(), 'foo bar', 'should update observable value');
  });

  test('nested key error clears after entering valid input', async function (assert) {
    let data = { person: { firstName: 'Jim' } };
    let validator = ({ newValue }) => isPresent(newValue) || 'need a first name';
    let c = Changeset(data, validator);
    this.c = c;
    this.mutValue = (path, evt) => (this.c[path] = evt.target.value);

    await render(hbs`
      <h1>{{this.c.person.firstName}}</h1>
      <input
        id="first-name"
        type="text"
        value={{this.c.person.firstName}}
        {{on "change" (fn this.mutValue "person.firstName")}}>
      <small id="first-name-error">{{this.c.error.person.firstName.validation}}</small>
    `);

    assert.equal(find('h1').textContent.trim(), 'Jim', 'precondition');
    await fillIn('#first-name', 'foo');
    await fillIn('#first-name', '');

    let actual = find('#first-name-error').textContent.trim();
    let expectedResult = 'need a first name';
    assert.equal(actual, expectedResult, 'shows error message');

    await fillIn('#first-name', 'foo');

    actual = find('#first-name-error').textContent.trim();
    expectedResult = '';
    assert.equal(actual, expectedResult, 'hides error message');
  });

  test('nested object updates when set with async validator', async function (assert) {
    let data = { person: { firstName: 'Jim' } };
    let validator = () => Promise.resolve(true);
    let c = Changeset(data, validator);
    this.c = c;
    this.mutValue = (path, evt) => (this.c[path] = evt.target.value);

    await render(hbs`
      <h1>{{this.c.person.firstName}}</h1>
      <input
        id="first-name"
        type="text"
        value={{this.c.person.firstName}}
        {{on "change" (fn this.mutValue "person.firstName")}}>
      <small id="first-name-error">{{this.c.error.person.firstName.validation}}</small>
    `);
    assert.equal(find('h1').textContent.trim(), 'Jim', 'precondition');
    await fillIn('#first-name', 'John');
    assert.equal(find('h1').textContent.trim(), 'John', 'should update observable value');
  });

  test('deeply nested key error clears after entering valid input', async function (assert) {
    let data = { person: { name: { parts: { first: 'Jim' } } } };
    let validator = ({ newValue }) => isPresent(newValue) || 'need a first name';
    let c = Changeset(data, validator);
    this.c = c;
    this.mutValue = (path, evt) => (this.c[path] = evt.target.value);

    await render(hbs`
      <h1>{{this.c.person.name.parts.first}}</h1>
      <input
        id="first-name"
        type="text"
        value={{this.c.person.name.parts.first}}
        {{on "change" (fn this.mutValue "person.name.parts.first")}}>
      <small id="first-name-error">{{this.c.error.person.name.parts.first.validation}}</small>
    `);

    assert.equal(find('h1').textContent.trim(), 'Jim', 'precondition');
    await fillIn('#first-name', '');

    {
      let actual = find('#first-name-error').textContent.trim();
      let expectedResult = 'need a first name';
      assert.equal(actual, expectedResult, 'shows error message');
    }

    await fillIn('#first-name', 'foo');

    {
      let actual = find('#first-name-error').textContent.trim();
      let expectedResult = '';
      assert.equal(actual, expectedResult, 'hides error message');
    }
  });

  test('a rollback propagates binding to deeply nested changesets', async function (assert) {
    let data = { person: { firstName: 'Jim', lastName: 'Bob' } };
    let changeset = Changeset(data);
    this.changeset = changeset;
    this.reset = () => changeset.rollback();
    this.mutValue = (path, evt) => (this.changeset[path] = evt.target.value);
    await render(hbs`
      <h1>{{this.changeset.person.firstName}} {{this.changeset.person.lastName}}</h1>
      <input
        id="first-name"
        value={{this.changeset.person.firstName}}
        {{on "change" (fn this.mutValue "person.firstName")}}>
      <input
        id="last-name"
        value={{this.changeset.person.lastName}}
        {{on "change" (fn this.mutValue "person.lastName")}}>
      <button id="reset-btn" {{on "click" this.reset}}>Reset</button>
    `);

    assert.equal(find('h1').textContent.trim(), 'Jim Bob', 'precondition');
    await fillIn('#first-name', 'foo');
    await fillIn('#last-name', 'bar');
    assert.equal(find('h1').textContent.trim(), 'foo bar', 'should update observable value');
    await click('#reset-btn');
    assert.equal(find('h1').textContent.trim(), 'Jim Bob', 'should rollback values');
  });

  test('it does not rollback when validating', async function (assert) {
    let dummyValidations = {
      even(k, value) {
        return value % 2 === 0 || 'must be even';
      },
      odd(k, value) {
        return value % 2 !== 0 || 'must be odd';
      },
    };
    let changeset = Changeset({ even: 4, odd: 4 }, lookupValidator(dummyValidations), dummyValidations);
    this.addEven = (changeset, evt) => {
      changeset.even = evt.target.value;
    };
    this.addOdd = (changeset, evt) => {
      changeset.odd = evt.target.value;
    };
    this.changeset = changeset;
    this.validateProperty = (changeset, property) => changeset.validate(property);
    await render(hbs`
      <fieldset class="even">
        <label for="even">Even Number</label>
        <input
          id="even"
          type="text"
          value={{this.changeset.even}}
          {{on "input" (fn this.addEven this.changeset)}}
          {{on "blur" (fn this.validateProperty this.changeset "even")}}>
        {{#if this.changeset.error.even}}
          <small class="even">{{this.changeset.error.even.validation}}</small>
        {{/if}}
        <code class="even">{{this.changeset.even}}</code>
      </fieldset>

      <fieldset class="odd">
        <label for="odd">Odd Number</label>
        <input
          id="odd"
          type="text"
          value={{this.changeset.odd}}
          {{on "input" (fn this.addOdd this.changeset)}}
          {{on "blur" (fn this.validateProperty this.changeset "odd")}}>
        {{#if this.changeset.error.odd}}
          <small class="odd">{{this.changeset.error.odd.validation}}</small>
        {{/if}}
        <code class="odd">{{this.changeset.odd}}</code>
      </fieldset>
    `);

    await fillIn('#even', '9');
    await triggerEvent('#odd', 'blur');
    assert.equal(find('small.even').textContent.trim(), 'must be even', 'should display error message');
    assert.equal(find('small.odd').textContent.trim(), 'must be odd', 'should display error message');
    assert.equal(find('#even').value, '9', 'should not rollback');
    assert.equal(find('code.even').textContent.trim(), '9', 'should not rollback');
    assert.equal(find('#odd').value, '4', 'should not rollback');
    await blur('#even');
    // there is a scenario where going from valid to invalid would cause values to
    // go out of sync
    await fillIn('#odd', '10');
    await blur('#odd');
    assert.equal(find('small.even').textContent.trim(), 'must be even', 'should display error message');
    assert.equal(find('small.odd').textContent.trim(), 'must be odd', 'should display error message');
    assert.equal(find('#odd').value, '10', 'should not rollback');
    assert.equal(find('code.odd').textContent.trim(), '10', 'should not rollback');
  });

  test('it handles when changeset is already set', async function (assert) {
    class Moment {
      constructor(date) {
        this.date = date;
      }
    }
    let d = new Date('2015');
    let momentInstance = new Moment(d);
    this.dummyModel = { startDate: momentInstance };
    await render(hbs`
      {{#with (changeset this.dummyModel) as |changesetObj|}}
        <h1>{{changesetObj.startDate.date}}</h1>
      {{/with}}
    `);

    assert.equal(find('h1').textContent.trim(), d, 'should update observable value');
  });

  test('it handles when is plain object passed to helper', async function (assert) {
    let d = new Date('2015');
    this.d = d;
    await render(hbs`
      {{#with (changeset (hash date=this.d)) as |changesetObj|}}
        <h1>{{changesetObj.date}}</h1>
      {{/with}}
    `);

    assert.equal(find('h1').textContent.trim(), d, 'should update observable value');
  });

  test('it handles models that are promises', async function (assert) {
    this.dummyModel = Promise.resolve({ firstName: 'Jim', lastName: 'Bob' });
    await render(hbs`
      {{#with (changeset this.dummyModel) as |changesetObj|}}
        <h1>{{changesetObj.firstName}} {{changesetObj.lastName}}</h1>
        <input
          id="first-name"
          type="text"
          value={{changesetObj.firstName}}
          onchange={{action (mut changesetObj.firstName) value="target.value"}}>

        {{input id="last-name" value=changesetObj.lastName}}
      {{/with}}
    `);

    await fillIn('#first-name', 'foo');
    await blur('#first-name');
    await fillIn('#last-name', 'bar');
    await blur('#last-name');
    assert.equal(find('h1').textContent.trim(), 'foo bar', 'should update observable value');
  });

  test('it skips validation when skipValidate is passed as an option', async function (assert) {
    this.dummyModel = { firstName: 'Jim', lastName: 'Bob' };
    this.validate = () => false;
    await render(hbs`
      {{#with (changeset this.dummyModel this.validate skipValidate=true) as |changesetObj|}}
        <h1>{{changesetObj.firstName}} {{changesetObj.lastName}}</h1>
        {{input id="first-name" value=changesetObj.firstName}}
        {{input id="last-name" value=changesetObj.lastName}}
        {{#if changesetObj.isInvalid}}
          <p id="error-paragraph">There were one or more errors in your form.</p>
        {{/if}}
      {{/with}}
    `);

    assert.equal(find('h1').textContent.trim(), 'Jim Bob', 'precondition');
    await fillIn('#first-name', 'J');
    await blur('#first-name');
    await fillIn('#last-name', 'B');
    await blur('#last-name');
    assert.equal(find('h1').textContent.trim(), 'J B', 'should update observable value');
    assert.notOk(find('#error-paragraph'), 'should skip validation');
  });

  test('it validates changes with changesetKeys', async function (assert) {
    let validations = {
      firstName(value) {
        return (isPresent(value) && value.length > 3) || 'too short';
      },
    };
    this.dummyModel = { firstName: 'Jimm', lastName: 'Bob' };
    this.validate = ({ key, newValue }) => {
      let validatorFn = validations[key];

      if (typeOf(validatorFn) === 'function') {
        return validatorFn(newValue);
      }
    };
    this.submit = (changeset) => changeset.validate();
    this.reset = (changeset) => changeset.rollback();
    this.changesetKeys = ['lastName'];
    await render(hbs`
      {{#with (changeset this.dummyModel this.validate changesetKeys=this.changesetKeys) as |changesetObj|}}
        {{#if changesetObj.isDirty}}
          <p id="errors-paragraph">There were one or more errors in your form.</p>
        {{/if}}
        {{input id="first-name" value=changesetObj.firstName}}
        {{input id="last-name" value=changesetObj.lastName}}
        <button id="submit-btn" {{on "click" (fn this.submit changesetObj)}}>Submit</button>
      {{/with}}
    `);

    await fillIn('#first-name', 'A');
    await click('#submit-btn');
    assert.notOk(find('#errors-paragraph'), 'should not be invalid');
  });
});
