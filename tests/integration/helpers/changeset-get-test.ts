import { fillIn, find, render } from '@ember/test-helpers';
import { setupRenderingTest } from 'ember-qunit';
import { TestContext } from 'ember-test-helpers';
import hbs from 'htmlbars-inline-precompile';
import { module, test } from 'qunit';

import { run } from '@ember/runloop';
import Changeset from 'ember-changeset';

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

    this.set('changeset', new Changeset(model));
    this.set('fieldName', 'name.first');
  });

  test('it fails to retrieve the current value using {{get}}', async function(assert) {
    await render(hbs`
      <input
        type="text"
        oninput={{action (changeset-set changeset fieldName) value="target.value"}}
        onchange={{action (changeset-set changeset fieldName) value="target.value"}}
        value={{changeset-get changeset fieldName}}
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

    try {
      await fillIn(input!, 'Robert');

      assert.equal(testEl!.textContent, 'Bob');

      run(() => {
        this.get('changeset').rollback();
      });

      assert.equal(testEl!.textContent, 'Bob');
    } catch (e) {
      assert.ok(false, e.message);
    }
  });

  test('it succeeds in retrieving the current value using {{changeset-get}}', async function(assert) {
    await render(hbs`
      <input
        type="text"
        oninput={{action (changeset-set changeset fieldName) value="target.value"}}
        onchange={{action (changeset-set changeset fieldName) value="target.value"}}
        value={{changeset-get changeset fieldName}}
      />
      <p id="test-el">{{changeset-get changeset fieldName}}</p>
      <ul>
        {{#each (get changeset "changes") as |change|}}
          <li>{{change.key}}: {{change.value}}</li>
        {{/each}}
      </ul>
    `);

    const input = find('input') as HTMLInputElement;
    const testEl = find('#test-el');

    try {
      await fillIn(input!, 'Robert');

      assert.equal(testEl!.textContent, 'Robert');

      run(() => {
        this.get('changeset').rollback();
      });

      assert.equal(testEl!.textContent, 'Bob');
    } catch (e) {
      assert.ok(false, e.message);
    }
  });
});
