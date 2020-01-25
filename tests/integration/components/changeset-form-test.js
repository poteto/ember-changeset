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

    assert.equal(find('[data-test-cid]').value, '2', 'has cid input value');
    assert.equal(find('[data-test-user-email]').value, 'foo', 'has email input value');
    assert.equal(find('[data-test-user-name]').value, 'someone', 'has name input value');

    await click('[data-test-submit]');

    assert.equal(find('[data-test-model-cid]').textContent.trim(), '2', 'has cid after submit');
    assert.equal(find('[data-test-model-user-email]').textContent.trim(), 'foo', 'has email after submit');

    assert.equal(find('[data-test-changeset-user-email]').textContent.trim(), 'foo', 'changeset has email after submit');

    assert.equal(find('[data-test-cid]').value, '2', 'still has cid input value');
    assert.equal(find('[data-test-user-email]').value, 'foo', 'still has email input value');
    assert.equal(find('[data-test-user-name]').value, 'someone', 'still has name input value');

    await fillIn('[data-test-user-name]', 'bar');

    assert.equal(find('[data-test-changeset-user-name]').textContent.trim(), 'bar', 'has user name after fill in');
    assert.equal(find('[data-test-changeset-user-email]').textContent.trim(), 'foo', 'has correct email even when changing related properties');
    assert.equal(find('[data-test-model-user-email]').textContent.trim(), 'foo', 'has correct email even when changing related properties');
    assert.equal(find('[data-test-changeset-cid]').textContent.trim(), '2', 'has correct cid even when changing related properties');
    assert.equal(find('[data-test-model-cid]').textContent.trim(), '2', 'has correct cid even when changing related properties');

    assert.equal(find('[data-test-cid]').value, '2', 'has cid input value');
    assert.equal(find('[data-test-user-email]').value, 'foo', 'has email input value');
    assert.equal(find('[data-test-user-name]').value, 'bar', 'has name input value');
  });

  test('it correctly toggle boolean values', async function(assert) {
    await render(hbs`<ChangesetForm />`);

    assert.equal(find('[data-test-changeset-notifications-email]').textContent.trim(), 'false', 'has initial value');
    await click('[data-test-notifications-email]');
    assert.equal(find('[data-test-changeset-notifications-email]').textContent.trim(), 'true', 'has updated value');
    await click('[data-test-notifications-email]');
    assert.equal(find('[data-test-changeset-notifications-email]').textContent.trim(), 'false', 'has original value again');

    assert.equal(find('[data-test-changeset-notifications-sms]').textContent.trim(), 'true', 'has initial value');
    await click('[data-test-notifications-sms]');
    assert.equal(find('[data-test-changeset-notifications-sms]').textContent.trim(), 'false', 'has updated value');
    await click('[data-test-notifications-sms]');
    assert.equal(find('[data-test-changeset-notifications-sms]').textContent.trim(), 'true', 'has original value again');
  });
});
