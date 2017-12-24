import { test } from 'qunit';
import moduleForAcceptance from '../../tests/helpers/module-for-acceptance';
import Model from 'ember-data/model';
import attr from 'ember-data/attr';
import { belongsTo } from 'ember-data/relationships';
import { run } from '@ember/runloop';
import Changeset from 'ember-changeset';

moduleForAcceptance('Acceptance | main', {
  beforeEach: function() {
    let store = this.application.__container__.lookup('service:store');

    this.application.register('model:profile', Model.extend({
      firstName: attr('string', { defaultValue: 'Bob' }),
      lastName: attr('string', { defaultValue: 'Ross' }),
    }));

    this.application.register('model:user', Model.extend({
      profile: belongsTo('profile'),
    }));

    run(() => {
      let p = store.createRecord('profile');
      let u = store.createRecord('user', { profile: p });
      this.dummyUser = u;
    });
  },
});

test('it works for belongsTo', function(assert) {
  let u = this.dummyUser;
  let c = new Changeset(u);

  assert.equal(c.get('profile'), u.get('profile'));
  assert.equal(u.get('profile.firstName'), u.get('profile.firstName'));
  assert.equal(u.get('profile.lastName'), u.get('profile.lastName'));

  run(() => {
    c.set('profile.firstName', 'Grace');
    c.set('profile.lastName', 'Hopper');

    assert.equal(c.get('profile.firstName'), 'Grace');
    assert.equal(c.get('profile.lastName'), 'Hopper');

    c.execute();

    assert.equal(u.get('profile.firstName'), 'Grace');
    assert.equal(u.get('profile.lastName'), 'Hopper');
  })
});
