import Changeset from 'ember-changeset';
import Relay from 'ember-changeset/-private/relay';
import { get, set } from '@ember/object';
import { module, test } from 'qunit';

module('Unit | Utility | Relay');

test("it shouldn't leak memory", function(assert) {
  let c = new Changeset({});
  let r = Relay.create({ changeset: c });

  let n = 100;
  while (n--) set(r, 'invalidKey', 'test');

  let expectedResult = 1;
  let result = Object.keys(get(r, '_changedKeys')).length;
  assert.equal(result, expectedResult, 'has a single changed key');
});
