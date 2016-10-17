import Ember from 'ember';
import objectEqual from 'ember-changeset/utils/computed/object-equal';
import { module, test } from 'qunit';

const {
  Object: EmberObject,
  run
} = Ember;

module('Unit | Utility | computed/object equal');

test('it returns true if all first obj KV pairs are present and equal to second obj', function(assert) {
  let Thing = EmberObject.extend({
    first: { name: 'Jim Bob' },
    second: { name: 'Jim Bob', age: 21 },
    isFirstEqualToSecond: objectEqual('first', 'second')
  });
  let theThing = Thing.create();
  let result = theThing.get('isFirstEqualToSecond');

  assert.ok(result);
});

test('it returns false if not all first obj KV pairs are present and equal to second obj', function(assert) {
  let Thing = EmberObject.extend({
    first: { name: 'Jim Bob', age: 21 },
    second: { name: 'Jim Bob' },
    isFirstEqualToSecond: objectEqual('first', 'second')
  });
  let theThing = Thing.create();
  let result = theThing.get('isFirstEqualToSecond');

  assert.notOk(result);
});

test('it returns true if second obj KV pairs are set to equal first obj', function(assert) {
  let Thing = EmberObject.extend({
    first: { name: 'Jim Bob' },
    second: { name: null },
    isFirstEqualToSecond: objectEqual('first', 'second')
  });
  let theThing = Thing.create();

  assert.notOk(theThing.get('isFirstEqualToSecond'));

  run(() => {
    theThing.set('second', { name: 'Jim Bob' });
    assert.ok(theThing.get('isFirstEqualToSecond'));
  });
});
