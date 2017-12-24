import { test } from 'qunit';
import moduleForAcceptance from '../../tests/helpers/module-for-acceptance';
import Model from 'ember-data/model';
import attr from 'ember-data/attr';
import { belongsTo } from 'ember-data/relationships';
import { run } from '@ember/runloop';

moduleForAcceptance('Acceptance | main', {
  beforeEach: function() {
    let store = this.application.__container__.lookup('service:store');

    this.application.register('model:profile', Model.extend({
      firstName: attr('string', { defaultValue: '' }),
      lastName: attr('string', { defaultValue: '' }),
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

test('it exists', function(assert) {
  let u = this.dummyUser;

  assert.equal(u.get('profile.firstName'), '', 'precondition');
  assert.equal(u.get('profile.lastName'), '', 'precondition');

  run(() => u.set('profile.firstName', 'Bob'));
  run(() => u.set('profile.lastName', 'Ross'));
});
