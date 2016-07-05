import Ember from 'ember';
import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';

const {
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

test('it updates when set', function(assert) {
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
