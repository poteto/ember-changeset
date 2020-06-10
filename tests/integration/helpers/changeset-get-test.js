import { fillIn, find, render, settled } from '@ember/test-helpers';
import { setupRenderingTest } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';
import { module, test } from 'qunit';
import { Changeset } from 'ember-changeset';

module('Integration | Helper | changeset-get', function(hooks) {
  setupRenderingTest(hooks);

  let model;

  hooks.beforeEach(function() {
    model = {
      name: {
        first: 'Bob',
        last: 'Loblaw'
      },
      email: 'bob@lob.law',
      url: 'http://bobloblawslawblog.com'
    };

    this.set('changeset', Changeset(model));
    this.set('fieldName', 'name.first');
  });

  test('it retrieves the current value using {{get}}', async function(assert) {
    await render(hbs`
      <input
        type="text"
        oninput={{action (changeset-set this.changeset this.fieldName) value="target.value"}}
        onchange={{action (changeset-set this.changeset this.fieldName) value="target.value"}}
        value={{get this.changeset this.fieldName}}
      />
      <p id="test-el">{{get this.changeset this.fieldName}}</p>
      <ul>
        {{#each (get this.changeset "changes") as |change|}}
          <li>{{change.key}}: {{change.value}}</li>
        {{/each}}
      </ul>
    `);

    const input = find('input');
    const testEl = find('#test-el');

    await fillIn(input, 'Robert');

    assert.equal(testEl.textContent, 'Robert');
    assert.equal(input.value, 'Robert');

    await this.changeset.rollback();

    assert.equal(testEl.textContent, 'Robert');
    assert.equal(input.value, 'Robert');
  });

  test('it succeeds in retrieving the current value using {{get}}', async function(assert) {
    await render(hbs`
      <input
        type="text"
        oninput={{action (changeset-set this.changeset this.fieldName) value="target.value"}}
        onchange={{action (changeset-set this.changeset this.fieldName) value="target.value"}}
        value={{get this.changeset this.fieldName}}
      />
      <p id="test-el">{{get this.changeset this.fieldName}}</p>
      <ul>
        {{#each (get this.changeset "changes") as |change index|}}
          <li id="change-{{index}}">{{change.key}}: {{change.value}}</li>
        {{/each}}
      </ul>
    `);

    const input = find('input');
    const testEl = find('#test-el');

    await fillIn(input, 'Robert');

    assert.equal(testEl.textContent, 'Robert');
    let list = find('#change-0');
    assert.equal(list.textContent, 'name.first: Robert');
    assert.equal(input.value, 'Robert');

    this.changeset.rollback();

    await settled();
    assert.equal(testEl.textContent, 'Bob');
    list = find('#change-0');
    assert.notOk(list, 'no changes');
    assert.equal(input.value, 'Bob');
  });
});

module('Integration | Helper | changeset-get relationships', function(hooks) {
  setupRenderingTest(hooks);

  hooks.beforeEach(function() {
    this.store = this.owner.lookup('service:store');

    this.createUser = (userType, withDogs) => {
      let profile = this.store.createRecord('profile');
      let user = this.store.createRecord(userType, { profile });

      if (withDogs) {
        for (let i = 0; i < 2; i++) {
          user.get('dogs').addObject(this.store.createRecord('dog'))
        }
      }
      return user;
    }
  });

  test('it renders belongsTo property', async function(assert) {
    let user = this.createUser('user', false);
    this.changeset = Changeset(user);

    await render(hbs`
      <p id="test-el">{{this.changeset.profile.firstName}}</p>
    `);

    assert.equal(find('#test-el').textContent.trim(), '');
  });
});
