import { fillIn, find, render, settled } from '@ember/test-helpers';
import { setupRenderingTest } from 'ember-qunit';
import { TestContext } from 'ember-test-helpers';
import hbs from 'htmlbars-inline-precompile';
import { module, test } from 'qunit';
import { Changeset } from 'ember-changeset';

interface ModelType {
  name: { first: string; last: string };
  email: string;
  url: string;
}

module('Integration | Helper | changeset-get', function(hooks) {
  setupRenderingTest(hooks);

  let model: ModelType;

  hooks.beforeEach(function(this: TestContext) {
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
        oninput={{action (changeset-set changeset fieldName) value="target.value"}}
        onchange={{action (changeset-set changeset fieldName) value="target.value"}}
        value={{get changeset fieldName}}
      />
      <p id="test-el">{{get changeset fieldName}}</p>
      <ul>
        {{#each (get changeset "changes") as |change|}}
          <li>{{change.key}}: {{change.value}}</li>
        {{/each}}
      </ul>
    `);

    const input = find('input') as HTMLInputElement;
    const testEl = find('#test-el');

    await fillIn(input!, 'Robert');

    assert.equal(testEl!.textContent, 'Robert');
    assert.equal(input!.value, 'Robert');

    await this.get('changeset').rollback();

    assert.equal(testEl!.textContent, 'Robert');
    assert.equal(input!.value, 'Robert');
  });

  test('it succeeds in retrieving the current value using {{get}}', async function(assert) {
    await render(hbs`
      <input
        type="text"
        oninput={{action (changeset-set changeset fieldName) value="target.value"}}
        onchange={{action (changeset-set changeset fieldName) value="target.value"}}
        value={{get changeset fieldName}}
      />
      <p id="test-el">{{get changeset fieldName}}</p>
      <ul>
        {{#each (get changeset "changes") as |change index|}}
          <li id="change-{{index}}">{{change.key}}: {{change.value}}</li>
        {{/each}}
      </ul>
    `);

    const input = find('input') as HTMLInputElement;
    const testEl = find('#test-el');

    await fillIn(input!, 'Robert');

    assert.equal(testEl!.textContent, 'Robert');
    let list = find('#change-0');
    assert.equal(list!.textContent, 'name.first: Robert');
    assert.equal(input!.value, 'Robert');

    this.get('changeset').rollback();

    await settled();
    assert.equal(testEl!.textContent, 'Bob');
    list = find('#change-0');
    assert.notOk(list!, 'no changes');
    assert.equal(input!.value, 'Bob');
  });
});
