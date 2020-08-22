import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { click, find, fillIn, render } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';

module('Integration | Component | changeset-form', function (hooks) {
  setupRenderingTest(hooks);

  test('it renders form', async function (assert) {
    await render(hbs`<ChangesetForm />`);

    // start filling in some data to test states of form
    await fillIn('[data-test-user-email]', 'foo');
    await fillIn('[data-test-cid]', 2);

    assert.equal(find('[data-test-cid]').value, '2', 'has cid input value');
    assert.equal(find('[data-test-user-email]').value, 'foo', 'has email input value');
    assert.equal(find('[data-test-user-name]').value, 'someone', 'has name input value');

    assert.equal(find('[data-test-submit]').disabled, true, 'button disabled due to invalid email');

    // submit - disabled until fill in proper email
    await click('[data-test-submit]');

    assert.equal(find('[data-test-submit]').disabled, true, 'button still disabled after email');
    assert.equal(
      find('[data-test-model-user-email]').textContent.trim(),
      'something',
      'has old email still b/c input not valid'
    );

    await fillIn('[data-test-user-email]', 'foo@gmail.com');

    assert.equal(find('[data-test-submit]').disabled, false, 'button not disabled after valid email');

    // submit - now enabled with valid email
    await click('[data-test-submit]');

    // toggle submit valid state
    await fillIn('[data-test-user-email]', 'bar ');

    assert.equal(find('[data-test-submit]').disabled, true, 'button disabled due to new invalid email');

    await fillIn('[data-test-user-email]', 'foo@gmail.com');

    assert.equal(find('[data-test-submit]').disabled, false, 'button not disabled b/c valid email was input-ed');

    await fillIn('[data-test-user-name]', 'makers');

    // submit - still enabled
    assert.equal(find('[data-test-submit]').disabled, false, 'button not disabled');

    assert.equal(find('[data-test-model-cid]').textContent.trim(), '2', 'has cid after submit');
    assert.equal(find('[data-test-model-user-email]').textContent.trim(), 'foo@gmail.com', 'has email after submit');
    assert.equal(
      find('[data-test-changeset-user-email]').textContent.trim(),
      'foo@gmail.com',
      'changeset has email after submit'
    );
    assert.equal(find('[data-test-cid]').value, '2', 'still has cid input value');
    assert.equal(find('[data-test-user-email]').value, 'foo@gmail.com', 'still has email input value');
    assert.equal(find('[data-test-user-name]').value, 'makers', 'still has name input value');

    await fillIn('[data-test-user-name]', 'bar');

    assert.equal(find('[data-test-changeset-user-name]').textContent.trim(), 'bar', 'has user name after fill in');
    assert.equal(
      find('[data-test-changeset-user-email]').textContent.trim(),
      'foo@gmail.com',
      'has correct email even when changing related properties'
    );
    assert.equal(
      find('[data-test-model-user-email]').textContent.trim(),
      'foo@gmail.com',
      'has correct email even when changing related properties'
    );
    assert.equal(
      find('[data-test-changeset-cid]').textContent.trim(),
      '2',
      'has correct cid even when changing related properties'
    );
    assert.equal(
      find('[data-test-model-cid]').textContent.trim(),
      '2',
      'has correct cid even when changing related properties'
    );
    assert.equal(find('[data-test-cid]').value, '2', 'has cid input value');
    assert.equal(find('[data-test-user-email]').value, 'foo@gmail.com', 'has email input value in final state');
    assert.equal(find('[data-test-user-name]').value, 'bar', 'has name input value in final state');
  });

  test('it correctly toggle boolean values', async function (assert) {
    await render(hbs`<ChangesetForm />`);

    assert.equal(find('[data-test-changeset-notifications-email]').textContent.trim(), 'false', 'has initial value');
    await click('[data-test-notifications-email]');
    assert.equal(find('[data-test-changeset-notifications-email]').textContent.trim(), 'true', 'has updated value');
    await click('[data-test-notifications-email]');
    assert.equal(
      find('[data-test-changeset-notifications-email]').textContent.trim(),
      'false',
      'has original value again'
    );

    assert.equal(find('[data-test-changeset-notifications-sms]').textContent.trim(), 'true', 'has initial value');
    await click('[data-test-notifications-sms]');
    assert.equal(find('[data-test-changeset-notifications-sms]').textContent.trim(), 'false', 'has updated value');
    await click('[data-test-notifications-sms]');
    assert.equal(
      find('[data-test-changeset-notifications-sms]').textContent.trim(),
      'true',
      'has original value again'
    );
  });
});
