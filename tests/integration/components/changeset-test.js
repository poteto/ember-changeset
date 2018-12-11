import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { resolve } from 'rsvp';
import { typeOf, isPresent } from '@ember/utils';
import Changeset from 'ember-changeset';
import hbs from 'htmlbars-inline-precompile';
import {
  render,
  find,
  fillIn,
  click,
  blur,
  triggerEvent
} from '@ember/test-helpers';

module('Integration | Helper | changeset', function(hooks) {
  setupRenderingTest(hooks);

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
    this.set('validate', ({ key, newValue }) => {
      let validatorFn = validations[key];

      if (typeOf(validatorFn) === 'function') {
        return validatorFn(newValue);
      }
    });
    this.set('submit', (changeset) => changeset.validate());
    this.set('reset', (changeset) => changeset.rollback());
    await render(hbs`
      {{#with (changeset dummyModel (action validate)) as |c|}}
        {{#if c.isInvalid}}
          <p id="errors-paragraph">There were one or more errors in your form.</p>
        {{/if}}
        {{input id="first-name" value=c.firstName}}
        {{input id="last-name" value=c.lastName}}
        <button id="submit-btn" {{action submit c}}>Submit</button>
        <button id="reset-btn" {{action reset c}}>Reset</button>
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
    this.set('reset', (changeset) => changeset.rollback());
    await render(hbs`
      {{#with (changeset dummyModel) as |c|}}
        {{input id="first-name" value=c.firstName}}
        <button id="reset-btn" {{action reset c}}>Reset</button>
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
    this.set('submit', (changeset) => changeset.validate());
    this.set('reset', (changeset) => changeset.rollback());
    await render(hbs`
      {{#with (changeset dummyModel) as |c|}}
        {{#if c.isInvalid}}
          <p id="errors-paragraph">There were one or more errors in your form.</p>
        {{/if}}
        {{input value=c.firstName}}
        {{input value=c.lastName}}
        <button id="submit-btn" {{action "submit" c}}>Submit</button>
        <button id="reset-btn" {{action reset c}}>Reset</button>
      {{/with}}
    `);

    await click('#submit-btn');
    assert.notOk(find('#errors-paragraph'), 'should be valid');
  });

  test('it updates when set without a validator', async function(assert) {
    this.set('dummyModel', { firstName: 'Jim', lastName: 'Bob' });
    await render(hbs`
      {{#with (changeset dummyModel) as |c|}}
        <h1>{{c.firstName}} {{c.lastName}}</h1>
        <input
          id="first-name"
          type="text"
          value={{c.firstName}}
          onchange={{action (mut c.firstName) value="target.value"}}>
        {{input id="last-name" value=c.lastName}}
      {{/with}}
    `);

    assert.equal(find('h1').textContent.trim(), 'Jim Bob', 'precondition');
    await fillIn('#first-name', 'foo');
    await fillIn('#last-name', 'bar');
    assert.equal(find('h1').textContent.trim(), 'foo bar', 'should update observable value');
  });

  test('it updates when set with a validator', async function(assert) {
    this.set('dummyModel', { firstName: 'Jim', lastName: 'Bob' });
    this.set('validate', () => true);
    await render(hbs`
      {{#with (changeset dummyModel (action validate)) as |c|}}
        <h1>{{c.firstName}} {{c.lastName}}</h1>
        <input
          id="first-name"
          type="text"
          value={{c.firstName}}
          onchange={{action (mut c.firstName) value="target.value"}}>
        {{input id="last-name" value=c.lastName}}
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
    this.set('c', changeset);
    await render(hbs`
      <h1>{{c.person.firstName}} {{c.person.lastName}}</h1>
      <input
        id="first-name"
        type="text"
        value={{c.person.firstName}}
        onchange={{action (mut c.person.firstName) value="target.value"}}>
      >
      {{input id="last-name" value=c.person.lastName}}
    `);

    assert.equal(find('h1').textContent.trim(), 'Jim Bob', 'precondition');
    await fillIn('#first-name', 'foo');
    await fillIn('#last-name', 'bar');
    assert.equal(find('h1').textContent.trim(), 'foo bar', 'should update observable value');
  });

  test('nested object updates when set without a validator', async function(assert) {
    let data = { person: { firstName: 'Jim', lastName: 'Bob' } };
    let changeset = new Changeset(data);
    this.set('c', changeset);
    await render(hbs`
      <h1>{{c.person.firstName}} {{c.person.lastName}}</h1>
      <input
        id="first-name"
        type="text"
        value={{c.person.firstName}}
        onchange={{action (mut c.person.firstName) value="target.value"}}>
      {{input id="last-name" value=c.person.lastName}}
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

    await render(hbs`
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

    await render(hbs`
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
    this.set('c', changeset);
    this.set('reset', () => changeset.rollback());
    await render(hbs`
      <h1>{{c.person.firstName}} {{c.person.lastName}}</h1>
      <input
        id="first-name"
        type="text"
        value={{c.person.firstName}}
        onchange={{action (mut c.person.firstName) value="target.value"}}>
      {{input id="last-name" value=c.person.lastName}}
      <button id="reset-btn" {{action reset}}>Reset</button>
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
    this.set('c', changeset);
    this.set('validateProperty', (changeset, property) => changeset.validate(property));
    await render(hbs`
      <fieldset class="even">
        <label for="even">Even Number</label>
        <input
          id="even"
          type="text"
          value={{c.even}}
          oninput={{action (mut c.even) value="target.value"}}
          onblur={{action validateProperty c "even"}}>
        {{#if c.error.even}}
          <small class="even">{{c.error.even.validation}}</small>
        {{/if}}
        <code class="even">{{c.even}}</code>
      </fieldset>

      <fieldset class="odd">
        <label for="odd">Odd Number</label>
        <input
          id="odd"
          type="text"
          value={{c.odd}}
          oninput={{action (mut c.odd) value="target.value"}}
          onblur={{action validateProperty c "odd"}}>
        {{#if c.error.odd}}
          <small class="odd">{{c.error.odd.validation}}</small>
        {{/if}}
        <code class="odd">{{c.odd}}</code>
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

  test('it handles when changeset is already set', async function(assert) {
    class Moment {
      constructor(date) {
        this.date = date;
      }
    }
    let d = new Date('2015');
    let momentInstance = new Moment(d);
    this.set('dummyModel', { startDate: momentInstance });
    await render(hbs`
      {{#with (changeset dummyModel) as |c|}}
        <h1>{{c.startDate.date}}</h1>
      {{/with}}
    `);

    assert.equal(find('h1').textContent.trim(), d, 'should update observable value');
  });

  test('it handles when is plain object passed to helper', async function(assert) {
    let d = new Date('2015');
    this.set('d', d);
    await render(hbs`
      {{#with (changeset (hash date=d)) as |c|}}
        <h1>{{c.date}}</h1>
      {{/with}}
    `);

    assert.equal(find('h1').textContent.trim(), d, 'should update observable value');
  });

  test('it handles models that are promises', async function(assert) {
    this.set('dummyModel', resolve({ firstName: 'Jim', lastName: 'Bob' }));
    await render(hbs`
      {{#with (changeset dummyModel) as |c|}}
        <h1>{{c.firstName}} {{c.lastName}}</h1>
        <input
          id="first-name"
          type="text"
          value={{c.firstName}}
          onchange={{action (mut c.firstName) value="target.value"}}>
        {{input id="last-name" value=c.lastName}}
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
    this.set('validate', () => false);
    await render(hbs`
      {{#with (changeset dummyModel (action validate) skipValidate=true) as |c|}}
        <h1>{{c.firstName}} {{c.lastName}}</h1>
        {{input id="first-name" value=c.firstName}}
        {{input id="last-name" value=c.lastName}}
        {{#if c.isInvalid}}
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
});
