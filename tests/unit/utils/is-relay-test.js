import Relay from 'ember-changeset/-private/relay';
import Changeset from 'ember-changeset';
import EmberObject from '@ember/object';
import isRelay from 'ember-changeset/utils/is-relay';
import { module, test } from 'qunit';

module('Unit | Utility | is relay');

test('it correctly identifies relays', function(a) {
  let changeset = new Changeset({});
  let dummy = Relay.create({ changeset, key: 'some-key', content: {} });
  a.ok(isRelay(dummy), 'should be true');
});

test('it correctly identifies non-relays', function(assert) {
  let dummy = EmberObject.create();
  assert.notOk(isRelay(dummy), 'should be false');
});
