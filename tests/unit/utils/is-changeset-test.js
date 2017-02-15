import Ember from 'ember';
import isChangeset from 'ember-changeset/utils/is-changeset';
import Changeset from 'ember-changeset';
import { module, test } from 'qunit';

const { Object: EmberObject } = Ember;

module('Unit | Utility | is changeset');

test('it correctly identifies changesets', function(assert) {
  let dummy = new Changeset(EmberObject.create());
  assert.ok(isChangeset(dummy), 'should be true');
});

test('it correctly identifies non-changesets', function(assert) {
  let dummy = EmberObject.create();
  assert.notOk(isChangeset(dummy), 'should be false');
});
