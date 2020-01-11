import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { click, find, fillIn, render } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';

module('Integration | Component | changeset-form', function(hooks) {
  setupRenderingTest(hooks);

  test('it renders', async function(assert) {
    await render(hbs`<ChangesetForm />`);
    await fillIn('[data-test-user-email]', 'foo');
    await fillIn('[data-test-cid]', 2);
    await click('[data-test-submit]');

    assert.equal(find('[data-test-model-cid]').textContent.trim(), '2', 'has email after submit');
    assert.equal(find('[data-test-model-user-email]').textContent.trim(), 'foo', 'has email after submit');
    assert.equal(find('[data-test-changeset-user-email]').textContent.trim(), 'foo', 'changeset has email after submit');
  });
});
