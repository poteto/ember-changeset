import Ember from 'ember';
import Changeset from 'ember-changeset';
import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';
import { find, fillIn, click, blur, triggerEvent } from 'ember-native-dom-helpers';

const {
  RSVP: { resolve },
  isPresent,
  typeOf
} = Ember;

moduleForComponent('changeset', 'Integration | Helper | changeset', {
  integration: true
});

test('it validates changes', async function(assert) {
  let validations = {
    firstName(value) {
      return isPresent(value) && value.length > 3 || 'too short';
    },
    lastName(value) {
      return isPresent(value) && value.length > 3 || 'too short';
    }
  };
  this.set('dummyModel', { firstName: 'Jim', lastName: 'Bob' });
  this.on('validate', ({ key, newValue }) => {
    let validatorFn = validations[key];

    if (typeOf(validatorFn) === 'function') {
      return validatorFn(newValue);
    }
  });
  this.on('submit', (changeset) => changeset.validate());
  this.on('reset', (changeset) => changeset.rollback());
  this.render(hbs`
    {{#with (changeset dummyModel (action "validate")) as |changeset|}}
      {{#if changeset.isInvalid}}
        <p id="errors-paragraph">There were one or more errors in your form.</p>
      {{/if}}
      {{input id="first-name" value=changeset.firstName}}
      {{input id="last-name" value=changeset.lastName}}
      <button id="submit-btn" {{action "submit" changeset}}>Submit</button>
      <button id="reset-btn" {{action "reset" changeset}}>Reset</button>
    {{/with}}
  `);

  await fillIn('#first-name', 'A');
  await click('#submit-btn');
  assert.ok(find('#errors-paragraph'), 'should be invalid');

  await fillIn('#first-name', 'Billy');
  await click('#submit-btn');
  assert.notOk(find('#errors-paragraph'), 'should be valid');
});

test('it rollsback changes', async function(assert) {
  this.set('dummyModel', { firstName: 'Jim' });
  this.on('reset', (changeset) => changeset.rollback());
  this.render(hbs`
    {{#with (changeset dummyModel) as |changeset|}}
      {{input id="first-name" value=changeset.firstName}}
      <button id="reset-btn" {{action "reset" changeset}}>Reset</button>
    {{/with}}
  `);

  assert.equal(find('#first-name').value, 'Jim', 'precondition');
  await fillIn('#first-name', 'foo');
  assert.equal(find('#first-name').value, 'foo', 'should update input');
  await click('#reset-btn');
  assert.equal(find('#first-name').value, 'Jim', 'should rollback');
});

test('it can be used with 1 argument', async function(assert) {
  this.set('dummyModel', { firstName: 'Jim', lastName: 'Bob' });
  this.on('submit', (changeset) => changeset.validate());
  this.on('reset', (changeset) => changeset.rollback());
  this.render(hbs`
    {{#with (changeset dummyModel) as |changeset|}}
      {{#if changeset.isInvalid}}
        <p id="errors-paragraph">There were one or more errors in your form.</p>
      {{/if}}
      {{input value=changeset.firstName}}
      {{input value=changeset.lastName}}
      <button id="submit-btn" {{action "submit" changeset}}>Submit</button>
      <button id="reset-btn" {{action "reset" changeset}}>Reset</button>
    {{/with}}
  `);

  await click('#submit-btn');
  assert.notOk(find('#errors-paragraph'), 'should be valid');
});

test('it updates when set without a validator', async function(assert) {
  this.set('dummyModel', { firstName: 'Jim', lastName: 'Bob' });
  this.render(hbs`
    {{#with (changeset dummyModel) as |changeset|}}
      <h1>{{changeset.firstName}} {{changeset.lastName}}</h1>
      <input
        id="first-name"
        type="text"
        value={{changeset.firstName}}
        onchange={{action (mut changeset.firstName) value="target.value"}}>
      {{input id="last-name" value=changeset.lastName}}
    {{/with}}
  `);

  assert.equal(find('h1').textContent.trim(), 'Jim Bob', 'precondition');
  await fillIn('#first-name', 'foo');
  await fillIn('#last-name', 'bar');
  assert.equal(find('h1').textContent.trim(), 'foo bar', 'should update observable value');
});

test('it updates when set with a validator', async function(assert) {
  this.set('dummyModel', { firstName: 'Jim', lastName: 'Bob' });
  this.on('validate', () => true);
  this.render(hbs`
    {{#with (changeset dummyModel (action "validate")) as |changeset|}}
      <h1>{{changeset.firstName}} {{changeset.lastName}}</h1>
      <input
        id="first-name"
        type="text"
        value={{changeset.firstName}}
        onchange={{action (mut changeset.firstName) value="target.value"}}>
      {{input id="last-name" value=changeset.lastName}}
    {{/with}}
  `);

  assert.equal(find('h1').textContent.trim(), 'Jim Bob', 'precondition');
  await fillIn('#first-name', 'foo');
  await fillIn('#last-name', 'bar');
  assert.equal(find('h1').textContent.trim(), 'foo bar', 'should update observable value');
});

test('a passed down nested object updates when set without a validator', async function(assert) {
  let data = { person: { firstName: 'Jim', lastName: 'Bob' } };
  let changeset = new Changeset(data);
  this.set('childChangeset', changeset.get('person'));
  this.render(hbs`
    <h1>{{childChangeset.firstName}} {{childChangeset.lastName}}</h1>
    <input
      id="first-name"
      type="text"
      value={{childChangeset.firstName}}
      onchange={{action (mut childChangeset.firstName) value="target.value"}}>
    {{input id="last-name" value=childChangeset.lastName}}
  `);

  assert.equal(find('h1').textContent.trim(), 'Jim Bob', 'precondition');
  await fillIn('#first-name', 'foo');
  await fillIn('#last-name', 'bar');
  assert.equal(find('h1').textContent.trim(), 'foo bar', 'should update observable value');
});

test('nested object updates when set without a validator', async function(assert) {
  let data = { person: { firstName: 'Jim', lastName: 'Bob' } };
  let changeset = new Changeset(data);
  this.set('changeset', changeset);
  this.render(hbs`
    <h1>{{changeset.person.firstName}} {{changeset.person.lastName}}</h1>
    <input
      id="first-name"
      type="text"
      value={{changeset.person.firstName}}
      onchange={{action (mut changeset.person.firstName) value="target.value"}}>
    {{input id="last-name" value=changeset.person.lastName}}
  `);

  assert.equal(find('h1').textContent.trim(), 'Jim Bob', 'precondition');
  await fillIn('#first-name', 'foo');
  await fillIn('#last-name', 'bar');
  assert.equal(find('h1').textContent.trim(), 'foo bar', 'should update observable value');
});

test('nested key error clears after entering valid input', async function(assert) {
  let data = { person: { firstName: 'Jim' } };
  let validator = ({ newValue }) => isPresent(newValue) || 'need a first name';
  let c = new Changeset(data, validator);
  this.set('c', c);

  this.render(hbs`
    <h1>{{c.person.firstName}}</h1>
    <input
      id="first-name"
      type="text"
      value={{c.person.firstName}}
      onchange={{action (mut c.person.firstName) value="target.value"}}>
    <small id="first-name-error">{{c.error.person.firstName.validation}}</small>
  `);

  assert.equal(find('h1').textContent.trim(), 'Jim', 'precondition');
  await fillIn('#first-name', 'foo');
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

test('deeply nested key error clears after entering valid input', async function(assert) {
  let data = { person: { name: { parts: { first: 'Jim' } } } };
  let validator = ({ newValue }) => isPresent(newValue) || 'need a first name';
  let c = new Changeset(data, validator);
  this.set('c', c);

  this.render(hbs`
    <h1>{{c.person.name.parts.first}}</h1>
    <input
      id="first-name"
      type="text"
      value={{c.person.name.parts.first}}
      onchange={{action (mut c.person.name.parts.first) value="target.value"}}>
    <small id="first-name-error">{{c.error.person.name.parts.first.validation}}</small>
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

test('a rollback propagates binding to deeply nested changesets', async function(assert) {
  let data = { person: { firstName: 'Jim', lastName: 'Bob' } };
  let changeset = new Changeset(data);
  this.set('childChangeset', changeset.get('person'));
  this.on('reset', () => changeset.rollback());
  this.render(hbs`
    <h1>{{childChangeset.firstName}} {{childChangeset.lastName}}</h1>
    <input
      id="first-name"
      type="text"
      value={{childChangeset.firstName}}
      onchange={{action (mut childChangeset.firstName) value="target.value"}}>
    {{input id="last-name" value=childChangeset.lastName}}
    <button id="reset-btn" {{action "reset"}}>Reset</button>
  `);

  assert.equal(find('h1').textContent.trim(), 'Jim Bob', 'precondition');
  await fillIn('#first-name', 'foo');
  await fillIn('#last-name', 'bar');
  assert.equal(find('h1').textContent.trim(), 'foo bar', 'should update observable value');
  await click('#reset-btn');
  assert.equal(find('h1').textContent.trim(), 'Jim Bob', 'should rollback values');
});

test('it does not rollback when validating', async function(assert) {
  let dummyValidations = {
    even(value) { return value % 2 === 0 || 'must be even'; },
    odd(value) { return value % 2 !== 0 || 'must be odd'; }
  };
  let lookupValidator = (validationMap) => {
    return ({ key, newValue }) => [validationMap[key](newValue)];
  };
  let changeset = new Changeset({ even: 4, odd: 4 }, lookupValidator(dummyValidations), dummyValidations);
  this.set('changeset', changeset);
  this.on('validateProperty', (changeset, property) => changeset.validate(property));
  this.render(hbs`
    <fieldset class="even">
      <label for="even">Even Number</label>
      <input
        id="even"
        type="text"
        value={{changeset.even}}
        oninput={{action (mut changeset.even) value="target.value"}}
        onblur={{action "validateProperty" changeset "even"}}>
      {{#if changeset.error.even}}
        <small class="even">{{changeset.error.even.validation}}</small>
      {{/if}}
      <code class="even">{{changeset.even}}</code>
    </fieldset>

    <fieldset class="odd">
      <label for="odd">Odd Number</label>
      <input
        id="odd"
        type="text"
        value={{changeset.odd}}
        oninput={{action (mut changeset.odd) value="target.value"}}
        onblur={{action "validateProperty" changeset "odd"}}>
      {{#if changeset.error.odd}}
        <small class="odd">{{changeset.error.odd.validation}}</small>
      {{/if}}
      <code class="odd">{{changeset.odd}}</code>
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

test('it handles models that are promises', async function(assert) {
  this.set('dummyModel', resolve({ firstName: 'Jim', lastName: 'Bob' }));
  this.render(hbs`
    {{#with (changeset dummyModel) as |changeset|}}
      <h1>{{changeset.firstName}} {{changeset.lastName}}</h1>
      <input
        id="first-name"
        type="text"
        value={{changeset.firstName}}
        onchange={{action (mut changeset.firstName) value="target.value"}}>
      {{input id="last-name" value=changeset.lastName}}
    {{/with}}
  `);

  await fillIn('#first-name', 'foo');
  await blur('#first-name');
  await fillIn('#last-name', 'bar');
  await blur('#last-name');
  assert.equal(find('h1').textContent.trim(), 'foo bar', 'should update observable value');
});

test('it skips validation when skipValidate is passed as an option', async function(assert) {
  this.set('dummyModel', { firstName: 'Jim', lastName: 'Bob' });
  this.on('validate', () => false);
  this.render(hbs`
    {{#with (changeset dummyModel (action "validate") skipValidate=true) as |changeset|}}
      <h1>{{changeset.firstName}} {{changeset.lastName}}</h1>
      {{input id="first-name" value=changeset.firstName}}
      {{input id="last-name" value=changeset.lastName}}
      {{#if changeset.isInvalid}}
        <p id="error-paragraph">There were one or more errors in your form.</p>
      {{/if}}
    {{/with}}
  `);

  assert.equal(find('h1').textContent.trim(), 'Jim Bob', 'precondition');
  await fillIn('#first-name', 'J');
  await blur('#first-name')
  await fillIn('#last-name', 'B');
  await blur('#last-name')
  assert.equal(find('h1').textContent.trim(), 'J B', 'should update observable value');
  assert.notOk(find('#error-paragraph'), 'should skip validation');
});
