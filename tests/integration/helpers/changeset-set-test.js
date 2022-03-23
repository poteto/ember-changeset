import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';
import { render, click } from '@ember/test-helpers';
import { modifier } from 'ember-modifier';
import { helper } from '@ember/component/helper';
import { tracked } from '@glimmer/tracking';

module('Integration | Helper | changeset-set', function (hooks) {
  setupRenderingTest(hooks);

  test('(modifier) does not rerender unrelated properties when changes are made', async function (assert) {
    let renderCount = 0;

    this.dummyModel = { foo: 'foo will not change', bar: 'bar will change' };
    this.owner.register(
      'modifier:capture-rerender',
      modifier(() => renderCount++)
    );

    await render(hbs`
      {{#with (changeset this.dummyModel) as |changesetObj|}}
        <div {{capture-rerender changesetObj.foo}}></div>
        <button id="submit-btn"
          {{on "click" (fn (changeset-set changesetObj "bar") "bar has changed")}}
        >Click</button>
      {{/with}}
    `);

    assert.strictEqual(renderCount, 1, 'modifier did install');

    await click('#submit-btn');

    assert.strictEqual(renderCount, 1, 'expected modifier not to have recalculated');
  });

  test('(function as modifier) does not rerender unrelated properties when changes are made', async function (assert) {
    let renderCount = 0;

    this.dummyModel = { foo: 'foo will not change', bar: 'bar will change' };
    this.captureRerender = () => renderCount++;

    await render(hbs`
      {{#with (changeset this.dummyModel) as |changesetObj|}}
        <div {{this.captureRerender changesetObj.foo}}></div>
        <button id="submit-btn"
          {{on "click" (fn (changeset-set changesetObj "bar") "bar has changed")}}
        >Click</button>
      {{/with}}
    `);

    assert.strictEqual(renderCount, 1, 'modifier did install');

    await click('#submit-btn');

    assert.strictEqual(renderCount, 1, 'expected modifier not to have recalculated');
  });

  test('(helper) does not rerender unrelated properties when changes are made', async function (assert) {
    let renderCount = 0;

    this.dummyModel = { foo: 'foo will not change', bar: 'bar will change' };
    this.owner.register(
      'helper:capture-rerender',
      helper(() => renderCount++)
    );

    await render(hbs`
      {{#with (changeset this.dummyModel) as |changesetObj|}}
        {{capture-rerender changesetObj.foo}}
        <button id="submit-btn"
          {{on "click" (fn (changeset-set changesetObj "bar") "bar has changed")}}
        >Click</button>
      {{/with}}
    `);

    assert.strictEqual(renderCount, 1, 'helper did install');

    await click('#submit-btn');

    assert.strictEqual(renderCount, 1, 'expected helper not to have recalculated');
  });

  // These are for sanity checking ember-core
  module('non-changeset tracked', function () {
    class DummyModel {
      @tracked foo = 'foo will not change';
      @tracked bar = 'bar will change';
      setBar = (value) => (this.bar = value);
    }

    test('(modifier) does not rerender unrelated properties when changes are made', async function (assert) {
      let renderCount = 0;

      this.dummyModel = new DummyModel();
      this.owner.register(
        'modifier:capture-rerender',
        modifier(() => renderCount++)
      );

      await render(hbs`
        {{#with this.dummyModel as |changesetObj|}}
          <div {{capture-rerender changesetObj.foo}}></div>
          <button id="submit-btn"
            {{on "click" (fn changesetObj.setBar "bar has changed")}}
          >Click</button>
        {{/with}}
      `);

      assert.strictEqual(renderCount, 1, 'modifier did install');

      await click('#submit-btn');

      assert.strictEqual(renderCount, 1, 'expected modifier not to have recalculated');
    });

    test('(function as modifier) does not rerender unrelated properties when changes are made', async function (assert) {
      let renderCount = 0;

      this.dummyModel = new DummyModel();
      this.captureRerender = () => renderCount++;

      await render(hbs`
        {{#with this.dummyModel as |changesetObj|}}
          <div {{this.captureRerender changesetObj.foo}}></div>
          <button id="submit-btn"
            {{on "click" (fn changesetObj.setBar "bar has changed")}}
          >Click</button>
        {{/with}}
      `);

      assert.strictEqual(renderCount, 1, 'modifier did install');

      await click('#submit-btn');

      assert.strictEqual(renderCount, 1, 'expected modifier not to have recalculated');
    });

    test('(helper) does not rerender unrelated properties when changes are made', async function (assert) {
      let renderCount = 0;

      this.dummyModel = new DummyModel();
      this.owner.register(
        'helper:capture-rerender',
        helper(() => renderCount++)
      );

      await render(hbs`
        {{#with this.dummyModel as |changesetObj|}}
          {{capture-rerender changesetObj.foo}}
          <button id="submit-btn"
            {{on "click" (fn changesetObj.setBar "bar has changed")}}
          >Click</button>
        {{/with}}
      `);

      assert.strictEqual(renderCount, 1, 'helper did install');

      await click('#submit-btn');

      assert.strictEqual(renderCount, 1, 'expected helper not to have recalculated');
    });
  });
});
