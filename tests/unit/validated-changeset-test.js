import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import { object, array } from 'yup';
import { ValidatedChangeset } from 'ember-changeset';

module('Unit | Utility | validated changeset (experimental)', function (hooks) {
  setupTest(hooks);
  // eslint-disable-next-line qunit/require-expect
  test('changes from validated stay an array when set', async (assert) => {
    assert.expect(1);
    let initialData = { shipments: [] };
    const formQuoteSchemaValidation = object().shape({
      shipments: array(),
    });

    const changeset = ValidatedChangeset(initialData);

    changeset.set('shipments', [
      ...changeset.get('shipments'),
      {
        name: 'william',
      },
    ]);

    changeset.set('shipments.0.name', 'albium');

    await changeset.validate((changes) => {
      assert.true(Array.isArray(changes.shipments));
      return formQuoteSchemaValidation.validate(changes);
    });
  });
});