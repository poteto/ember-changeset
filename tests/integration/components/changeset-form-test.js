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

    assert.equal(find('[data-test-model-cid]').textContent.trim(), '2', 'has cid after submit');
    assert.equal(find('[data-test-model-user-email]').textContent.trim(), 'foo', 'has email after submit');
    assert.equal(find('[data-test-changeset-user-email]').textContent.trim(), 'foo', 'changeset has email after submit');

    await fillIn('[data-test-user-name]', 'bar');

    assert.equal(find('[data-test-changeset-user-name]').textContent.trim(), 'bar', 'has user name after fill in');
    assert.equal(find('[data-test-changeset-user-email]').textContent.trim(), 'foo', 'has correct email even when changing related properties');
    assert.equal(find('[data-test-model-user-email]').textContent.trim(), 'foo', 'has correct email even when changing related properties');
    assert.equal(find('[data-test-changeset-cid]').textContent.trim(), '2', 'has correct cid even when changing related properties');
    assert.equal(find('[data-test-model-cid]').textContent.trim(), '2', 'has correct cid even when changing related properties');
  });
});
