import Ember from 'ember';
import Relay from 'ember-changeset/-private/relay';
import Changeset from 'ember-changeset';
import { module, test } from 'qunit';

const { get, set } = Ember;

module('Unit | Utility | Relay');

test("it shouldn't leak memory", function(assert) {
  let c = new Changeset({ someKey: '' });
  let r = Relay.create({ changeset: c, key: 'someKey' });

  let n = 100;
  while (n--) set(r, 'invalidKey', 'test');

  let expectedResult = 1;
  let result = Object.keys(get(r, '_changedKeys')).length;
  assert.equal(result, expectedResult, 'has a single changed key');
});
