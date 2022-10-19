import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { click, find, fillIn, render } from '@ember/test-helpers';
import { helper } from '@ember/component/helper';
import hbs from 'htmlbars-inline-precompile';
import { ValidatedChangeset } from 'ember-changeset';

module('Integration | Component | validated-form', function (hooks) {
  setupRenderingTest(hooks);

  test(`changing one property does not dirty other properties`, async function (assert) {
    let data = { foo: 'FOO', bar: 'BAR' };
    let changeset = new ValidatedChangeset(data);
    this.setProperties({
      changeset,
      changeFoo: () => (changeset.foo = 'FOO-changed'),
      checkFoo: helper(([foo]) => assert.step(`checkFoo: ${foo}`)),
      checkBar: helper(([bar]) => assert.step(`checkBar: ${bar}`)),
    });

    await render(hbs`
      <input id="foo" {{on 'input' this.changeFoo}} />
      {{this.checkFoo this.changeset.foo}}
      {{this.checkBar this.changeset.bar}}
    `);

    assert.verifySteps(['checkFoo: FOO', 'checkBar: BAR'], 'expected check helpers called on inial render');

    await fillIn('#foo', 'test-foo');

    assert.verifySteps(['checkFoo: FOO-changed'], 'expected only checkFoo to be called');
  });

  test('it renders form', async function (assert) {
    await render(hbs`<ValidatedForm />`);

    // start filling in some data to test states of form
    await fillIn('[data-test-user-email]', 'foo');
    await fillIn('[data-test-cid]', 2);

    assert.dom('[data-test-cid]').hasValue('2', 'has cid input value');
    assert.dom('[data-test-user-email]').hasValue('foo', 'has email input value');
    assert.dom('[data-test-user-name]').hasValue('someone', 'has name input value');

    assert.true(find('[data-test-submit]').disabled, 'button disabled due to invalid email');

    assert
      .dom('[data-test-model-user-email]')
      .hasText('something@gmail.com', 'has old email still b/c input not valid');

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

    assert.dom('[data-test-model-cid]').hasText('2', 'has cid after submit');
    assert.dom('[data-test-model-user-email]').hasText('foo@gmail.com', 'has email after submit');
    assert.dom('[data-test-changeset-user-email]').hasText('foo@gmail.com', 'changeset has email after submit');
    assert.dom('[data-test-cid]').hasValue('2', 'still has cid input value');
    assert.dom('[data-test-user-email]').hasValue('foo@gmail.com', 'still has email input value');
    assert.dom('[data-test-user-name]').hasValue('makers', 'still has name input value');

    await fillIn('[data-test-user-name]', 'bar');

    assert.dom('[data-test-changeset-user-name]').hasText('bar', 'has user name after fill in');
    assert
      .dom('[data-test-changeset-user-email]')
      .hasText('foo@gmail.com', 'has correct email even when changing related properties');
    assert
      .dom('[data-test-model-user-email]')
      .hasText('foo@gmail.com', 'has correct email even when changing related properties');
    assert.dom('[data-test-changeset-cid]').hasText('2', 'has correct cid even when changing related properties');
    assert.dom('[data-test-model-cid]').hasText('2', 'has correct cid even when changing related properties');
    assert.dom('[data-test-cid]').hasValue('2', 'has cid input value');
    assert.dom('[data-test-user-email]').hasValue('foo@gmail.com', 'has email input value in final state');
    assert.dom('[data-test-user-name]').hasValue('bar', 'has name input value in final state');
  });

  test('it correctly toggle boolean values', async function (assert) {
    await render(hbs`<ChangesetForm />`);

    assert.dom('[data-test-changeset-notifications-email]').hasText('false', 'has initial value');
    await click('[data-test-notifications-email]');
    assert.dom('[data-test-changeset-notifications-email]').hasText('true', 'has updated value');
    await click('[data-test-notifications-email]');
    assert.dom('[data-test-changeset-notifications-email]').hasText('false', 'has original value again');

    assert.dom('[data-test-changeset-notifications-sms]').hasText('true', 'has initial value');
    await click('[data-test-notifications-sms]');
    assert.dom('[data-test-changeset-notifications-sms]').hasText('false', 'has updated value');
    await click('[data-test-notifications-sms]');
    assert.dom('[data-test-changeset-notifications-sms]').hasText('true', 'has original value again');
  });

  test('it handles array of addresses', async function (assert) {
    await render(hbs`<ChangesetForm />`);

    assert.dom('[data-test-address="0"]').hasText('123 Yurtville', 'address 1 model value');
    assert.dom('[data-test-address="1"]').hasText('123 Woods', 'address 2 model value');

    assert.dom('[data-test-address-street="0"]').hasValue('123', 'street 1 initial value');
    assert.dom('[data-test-address-city="0"]').hasValue('Yurtville', 'city 1 initial value');
    assert.dom('[data-test-address-street="1"]').hasValue('123', 'street 2 initial value');
    assert.dom('[data-test-address-city="1"]').hasValue('Woods', 'city 2 initial value');

    await fillIn('[data-test-address-street="0"]', '456');

    assert.dom('[data-test-address="0"]').hasText('123 Yurtville', 'address 1 model keeps value');
    assert.dom('[data-test-address="1"]').hasText('123 Woods', 'address 2 model keeps value');

    assert.dom('[data-test-address-street="0"]').hasValue('456', 'street 1 new value');
    assert.dom('[data-test-address-city="0"]').hasValue('Yurtville', 'city 1 initial value');
    assert.dom('[data-test-address-street="1"]').hasValue('123', 'street 2 initial value');
    assert.dom('[data-test-address-city="1"]').hasValue('Woods', 'city 2 initial value');
  });
});
