import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { get, set } from '@ember/object';
import { Changeset } from 'ember-changeset';
import hbs from 'htmlbars-inline-precompile';
import { render, find, settled } from '@ember/test-helpers';
import { tracked } from '@glimmer/tracking';

module('Integration | misc', function(hooks) {
  setupRenderingTest(hooks);

  test('it re-renders derived state automatically when root state changes', async function(assert) {
    class MyModel {
      @tracked isOptionOne = false;
      @tracked isOptionTwo = false;
      @tracked isOptionThree = false;
    }

    const Validations = {
      isOptionSelected: (newValue) => {
        return newValue === true ? true : 'No options selected';
      }
    }

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
        return this.get('isOptionOne') || this.get('isOptionTwo') || this.get('isOptionThree');
      }
    });

    // initial validation
    await myChangeset.validate();

    this.set('myChangeset', myChangeset);

    await render(hbs`
      {{#if this.myChangeset.isInvalid}}
        <span class="invalid"></span>
      {{else}}
        <span class="valid"></span>
      {{/if}}
    `);

    assert.ok(find('.invalid'), 'Changeset is invalid as none of the options are selected');

    set(myChangeset, 'isOptionTwo', true);
    await settled();

    // We don't call validate explicitly, expecting autotracking to handle that since skipValidate is false
    assert.ok(find('.valid'), 'Changeset is valid as one of the options is selected');
  });
});
