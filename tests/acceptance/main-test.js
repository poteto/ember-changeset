import { test } from 'qunit';
import moduleForAcceptance from '../../tests/helpers/module-for-acceptance';
import Model from 'ember-data/model';
import attr from 'ember-data/attr';
import { belongsTo, hasMany } from 'ember-data/relationships';
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
      dogs: hasMany('dog'),
    }));

    this.application.register('model:dog', Model.extend({
      breed: attr('string', { defaultValue: 'rough collie' }),
    }));

    run(() => {
      let dogs = [];
      for (let i = 0; i < 2; i++) dogs.push(store.createRecord('dog'));

      let p = store.createRecord('profile');
      let u = store.createRecord('user', { profile: p, dogs });

      this.dummyUser = u;
    });
  },
});

test('it works for belongsTo', function(assert) {
  let user = this.dummyUser;
  let changeset = new Changeset(user);

  run(() => {
    assert.equal(changeset.get('profile'), user.get('profile'));
    assert.equal(changeset.get('profile.firstName'), user.get('profile.firstName'));
    assert.equal(changeset.get('profile.lastName'), user.get('profile.lastName'));

    changeset.set('profile.firstName', 'Grace');
    changeset.set('profile.lastName', 'Hopper');

    assert.equal(changeset.get('profile.firstName'), 'Grace');
    assert.equal(changeset.get('profile.lastName'), 'Hopper');

    changeset.execute();

    assert.equal(user.get('profile.firstName'), 'Grace');
    assert.equal(user.get('profile.lastName'), 'Hopper');
  })
});

test('it works for firstObject', function(assert) {
  let user = this.dummyUser;
  let changeset = new Changeset(user);

  run(() => {
    assert.equal(changeset.get('dogs'), user.get('dogs'));
    assert.equal(changeset.get('dogs.firstObject'), user.get('dogs.firstObject'));
    assert.equal(changeset.get('dogs.firstObject'), user.get('dogs.firstObject'));
  });
});

// test('it works for lastObject');
