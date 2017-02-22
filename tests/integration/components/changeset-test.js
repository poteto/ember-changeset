import Ember from 'ember';
import Changeset from 'ember-changeset';
import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';

const {
  RSVP: { resolve },
  isPresent,
  run,
  typeOf
} = Ember;

moduleForComponent('changeset', 'Integration | Helper | changeset', {
  integration: true
});

test('it validates changes', function(assert) {
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
        <p>There were one or more errors in your form.</p>
      {{/if}}
      {{input id="first-name" value=changeset.firstName}}
      {{input id="last-name" value=changeset.lastName}}
      <button {{action "submit" changeset}}>Submit</button>
      <button {{action "reset" changeset}}>Reset</button>
    {{/with}}
  `);

  this.$('#first-name').val('A').trigger('change');
  run(() => this.$('button:contains("Submit")').click());
  assert.ok(this.$('p:contains("There were one or more errors in your form.")').length, 'should be invalid');

  this.$('#first-name').val('Billy').trigger('change');
  run(() => this.$('button:contains("Submit")').click());
  assert.notOk(this.$('p:contains("There were one or more errors in your form.")').length, 'should be valid');
});

test('it rollsback changes', function(assert) {
  this.set('dummyModel', { firstName: 'Jim' });
  this.on('reset', (changeset) => changeset.rollback());
  this.render(hbs`
    {{#with (changeset dummyModel) as |changeset|}}
      {{input id="first-name" value=changeset.firstName}}
      <button {{action "reset" changeset}}>Reset</button>
    {{/with}}
  `);

  assert.equal(this.$('#first-name').val(), 'Jim', 'precondition');
  this.$('#first-name').val('foo').trigger('change');
  assert.equal(this.$('#first-name').val(), 'foo', 'should update input');
  run(() => this.$('button:contains("Reset")').click());
  assert.equal(this.$('#first-name').val(), 'Jim', 'should rollback');
});

test('it can be used with 1 argument', function(assert) {
  this.set('dummyModel', { firstName: 'Jim', lastName: 'Bob' });
  this.on('submit', (changeset) => changeset.validate());
  this.on('reset', (changeset) => changeset.rollback());
  this.render(hbs`
    {{#with (changeset dummyModel) as |changeset|}}
      {{#if changeset.isInvalid}}
        <p>There were one or more errors in your form.</p>
      {{/if}}
      {{input value=changeset.firstName}}
      {{input value=changeset.lastName}}
      <button {{action "submit" changeset}}>Submit</button>
      <button {{action "reset" changeset}}>Reset</button>
    {{/with}}
  `);

  run(() => this.$('button:contains("Submit")').click());
  assert.notOk(this.$('p:contains("There were one or more errors in your form.")').length, 'does not turn invalid');
});

test('it updates when set without a validator', function(assert) {
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

  assert.ok(this.$('h1:contains("Jim Bob")'), 'precondition');
  run(() => this.$('#first-name').val('foo').trigger('change'));
  run(() => this.$('#last-name').val('foo').trigger('change'));
  assert.ok(this.$('h1:contains("foo bar")'), 'should update observable value');
});

test('it updates when set with a validator', function(assert) {
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

  assert.ok(this.$('h1:contains("Jim Bob")'), 'precondition');
  run(() => this.$('#first-name').val('foo').trigger('change'));
  run(() => this.$('#last-name').val('foo').trigger('change'));
  assert.ok(this.$('h1:contains("foo bar")'), 'should update observable value');
});

test('it does not rollback when validating', function(assert) {
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
        type="even"
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
        type="odd"
        value={{changeset.odd}}
        oninput={{action (mut changeset.odd) value="target.value"}}
        onblur={{action "validateProperty" changeset "odd"}}>
      {{#if changeset.error.odd}}
        <small class="odd">{{changeset.error.odd.validation}}</small>
      {{/if}}
      <code class="odd">{{changeset.odd}}</code>
    </fieldset>
  `);

  run(() => this.$('#even').val(9).trigger('input'));
  run(() => this.$('#odd').trigger('blur'));
  run(() => {
    assert.equal(this.$('small.even').text().trim(), 'must be even', 'should display error message');
    assert.equal(this.$('small.odd').text().trim(), 'must be odd', 'should display error message');
    assert.equal(this.$('#even').val(), '9', 'should not rollback');
    assert.equal(this.$('code.even').text().trim(), '9', 'should not rollback');
    assert.equal(this.$('#odd').val(), '4', 'should not rollback');
  });
  run(() => this.$('#even').trigger('blur'));
  // there is a scenario where going from valid to invalid would cause values to
  // go out of sync
  run(() => this.$('#odd').val(10).trigger('input').trigger('blur'));
  run(() => {
    assert.equal(this.$('small.even').text().trim(), 'must be even', 'should display error message');
    assert.equal(this.$('small.odd').text().trim(), 'must be odd', 'should display error message');
    assert.equal(this.$('#odd').val(), '10', 'should not rollback');
    assert.equal(this.$('code.odd').text().trim(), '10', 'should not rollback');
  });
});

test('it handles models that are promises', function(assert) {
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

  assert.ok(this.$('h1:contains("Jim Bob")'), 'precondition');
  run(() => this.$('#first-name').val('foo').trigger('change'));
  run(() => this.$('#last-name').val('foo').trigger('change'));
  assert.ok(this.$('h1:contains("foo bar")'), 'should update observable value');
});

test('it skips validation when skipValidate is passed as an option', function(assert) {
  this.set('dummyModel', { firstName: 'Jim', lastName: 'Bob' });
  this.on('validate', () => false);
  this.render(hbs`
    {{#with (changeset dummyModel (action "validate") skipValidate=true) as |changeset|}}
      <h1>{{changeset.firstName}} {{changeset.lastName}}</h1>
      {{input id="first-name" value=changeset.firstName}}
      {{input id="last-name" value=changeset.lastName}}
      {{#if changeset.isInvalid}}
        <p>There were one or more errors in your form.</p>
      {{/if}}
    {{/with}}
  `);
  
  assert.ok(this.$('h1:contains("Jim Bob")'), 'precondition');
  run(() => this.$('#first-name').val('J').trigger('change'));
  run(() => this.$('#last-name').val('B').trigger('change'));
  assert.ok(this.$('h1:contains("J B")'), 'should update observable value');
  assert.notOk(this.$('p:contains("There were one or more errors in your form.")').length, 'should skip validation');
});