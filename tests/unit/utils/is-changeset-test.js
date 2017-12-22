import Changeset from 'ember-changeset';
import EmberObject from '@ember/object';
import isChangeset from 'ember-changeset/utils/is-changeset';
import { module, test } from 'qunit';

module('Unit | Utility | is changeset');

test('it correctly identifies changesets', function(assert) {
  let dummy = new Changeset(EmberObject.create());
  assert.ok(isChangeset(dummy), 'should be true');
});

test('it correctly identifies non-changesets', function(assert) {
  let dummy = EmberObject.create();
  assert.notOk(isChangeset(dummy), 'should be false');
});
