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

    assert.strictEqual(find('[data-test-cid]').value, '2', 'has cid input value');
    assert.strictEqual(find('[data-test-user-email]').value, 'foo', 'has email input value');
    assert.strictEqual(find('[data-test-user-name]').value, 'someone', 'has name input value');

    assert.true(find('[data-test-submit]').disabled, 'button disabled due to invalid email');

    assert.strictEqual(
      find('[data-test-model-user-email]').textContent.trim(),
      'something',
      'has old email still b/c input not valid'
    );

    await fillIn('[data-test-user-email]', 'foo@gmail.com');

    assert.false(find('[data-test-submit]').disabled, 'button not disabled after valid email');

    // submit - now enabled with valid email
    await click('[data-test-submit]');

    // toggle submit valid state
    await fillIn('[data-test-user-email]', 'bar ');

    assert.true(find('[data-test-submit]').disabled, 'button disabled due to new invalid email');

    await fillIn('[data-test-user-email]', 'foo@gmail.com');

    assert.false(find('[data-test-submit]').disabled, 'button not disabled b/c valid email was input-ed');

    await fillIn('[data-test-user-name]', 'makers');

    // submit - still enabled
    assert.false(find('[data-test-submit]').disabled, 'button not disabled');

    assert.strictEqual(find('[data-test-model-cid]').textContent.trim(), '2', 'has cid after submit');
    assert.strictEqual(
      find('[data-test-model-user-email]').textContent.trim(),
      'foo@gmail.com',
      'has email after submit'
    );
    assert.strictEqual(
      find('[data-test-changeset-user-email]').textContent.trim(),
      'foo@gmail.com',
      'changeset has email after submit'
    );
    assert.strictEqual(find('[data-test-cid]').value, '2', 'still has cid input value');
    assert.strictEqual(find('[data-test-user-email]').value, 'foo@gmail.com', 'still has email input value');
    assert.strictEqual(find('[data-test-user-name]').value, 'makers', 'still has name input value');

    await fillIn('[data-test-user-name]', 'bar');

    assert.strictEqual(
      find('[data-test-changeset-user-name]').textContent.trim(),
      'bar',
      'has user name after fill in'
    );
    assert.strictEqual(
      find('[data-test-changeset-user-email]').textContent.trim(),
      'foo@gmail.com',
      'has correct email even when changing related properties'
    );
    assert.strictEqual(
      find('[data-test-model-user-email]').textContent.trim(),
      'foo@gmail.com',
      'has correct email even when changing related properties'
    );
    assert.strictEqual(
      find('[data-test-changeset-cid]').textContent.trim(),
      '2',
      'has correct cid even when changing related properties'
    );
    assert.strictEqual(
      find('[data-test-model-cid]').textContent.trim(),
      '2',
      'has correct cid even when changing related properties'
    );
    assert.strictEqual(find('[data-test-cid]').value, '2', 'has cid input value');
    assert.strictEqual(find('[data-test-user-email]').value, 'foo@gmail.com', 'has email input value in final state');
    assert.strictEqual(find('[data-test-user-name]').value, 'bar', 'has name input value in final state');
  });

  test('it correctly toggle boolean values', async function (assert) {
    await render(hbs`<ChangesetForm />`);

    assert.strictEqual(
      find('[data-test-changeset-notifications-email]').textContent.trim(),
      'false',
      'has initial value'
    );
    await click('[data-test-notifications-email]');
    assert.strictEqual(
      find('[data-test-changeset-notifications-email]').textContent.trim(),
      'true',
      'has updated value'
    );
    await click('[data-test-notifications-email]');
    assert.strictEqual(
      find('[data-test-changeset-notifications-email]').textContent.trim(),
      'false',
      'has original value again'
    );

    assert.strictEqual(find('[data-test-changeset-notifications-sms]').textContent.trim(), 'true', 'has initial value');
    await click('[data-test-notifications-sms]');
    assert.strictEqual(
      find('[data-test-changeset-notifications-sms]').textContent.trim(),
      'false',
      'has updated value'
    );
    await click('[data-test-notifications-sms]');
    assert.strictEqual(
      find('[data-test-changeset-notifications-sms]').textContent.trim(),
      'true',
      'has original value again'
    );
  });

  test('it handles array of addresses', async function (assert) {
    await render(hbs`<ChangesetForm />`);

    assert.strictEqual(find('[data-test-address="0"]').textContent.trim(), '123 Yurtville', 'address 1 model value');
    assert.strictEqual(find('[data-test-address="1"]').textContent.trim(), '123 Woods', 'address 2 model value');

    assert.strictEqual(find('[data-test-address-street="0"]').value, '123', 'street 1 initial value');
    assert.strictEqual(find('[data-test-address-city="0"]').value, 'Yurtville', 'city 1 initial value');
    assert.strictEqual(find('[data-test-address-street="1"]').value, '123', 'street 2 initial value');
    assert.strictEqual(find('[data-test-address-city="1"]').value, 'Woods', 'city 2 initial value');

    await fillIn('[data-test-address-street="0"]', '456');

    assert.strictEqual(
      find('[data-test-address="0"]').textContent.trim(),
      '123 Yurtville',
      'address 1 model keeps value'
    );
    assert.strictEqual(find('[data-test-address="1"]').textContent.trim(), '123 Woods', 'address 2 model keeps value');

    assert.strictEqual(find('[data-test-address-street="0"]').value, '456', 'street 1 new value');
    assert.strictEqual(find('[data-test-address-city="0"]').value, 'Yurtville', 'city 1 initial value');
    assert.strictEqual(find('[data-test-address-street="1"]').value, '123', 'street 2 initial value');
    assert.strictEqual(find('[data-test-address-city="1"]').value, 'Woods', 'city 2 initial value');
  });
});
