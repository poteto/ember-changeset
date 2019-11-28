import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import { set } from '@ember/object';
import Changeset from 'ember-changeset';

module('Integration | main', function(hooks) {
  setupTest(hooks);

  hooks.beforeEach(function() {
    // for backwards compatibility with pre 3.0 versions of ember
    let container = this.owner || this.application.__container__;
    this.store = container.lookup('service:store');

    let profile = this.store.createRecord('profile');
    let user = this.store.createRecord('user', { profile });
    this.dummyUser = user;

    for (let i = 0; i < 2; i++) {
      user.get('dogs').addObject(this.store.createRecord('dog'))
    }
  });

  test('it works for belongsTo', async function(assert) {
    let user = this.dummyUser;
    let changeset = new Changeset(user);

    assert.equal(changeset.get('profile'), user.get('profile'));
    assert.equal(changeset.get('profile.firstName'), user.get('profile.firstName'));
    assert.equal(changeset.get('profile.lastName'), user.get('profile.lastName'));

    changeset.get('profile').set('firstName', 'Grace');
    changeset.set('profile.nickname', 'g');
    set(changeset, 'profile.lastName', 'Hopper');

    assert.equal(changeset.get('profile.firstName'), 'Grace', 'has firstName after set');
    assert.equal(changeset.get('profile.nickname'), 'g', 'has nickname after set');
    assert.equal(changeset.get('profile.lastName'), 'Ross', 'Ember.set does not change anything');

    changeset.execute();

    assert.equal(user.get('profile.firstName'), 'Grace', 'firstName after execute');
    assert.equal(user.get('profile.lastName'), 'Ross', 'lastName after execute');
    assert.equal(user.get('profile.nickname'), 'g', 'nickname after execute');

    let profile;
    profile = await this.store.createRecord('profile', { firstName: 'Terry', lastName: 'Bubblewinkles', nickname: 't' });

    changeset.set('profile', profile);

    assert.equal(changeset.get('profile').get('firstName'), 'Terry', 'firstName after set');
    assert.equal(changeset.get('profile').get('lastName'), 'Bubblewinkles', 'lastName after set');
    assert.equal(changeset.get('profile.firstName'), 'Terry', 'firstName after set nested');
    assert.equal(changeset.profile.firstName, 'Terry', 'firstName after set nested');
    assert.equal(changeset.get('profile.lastName'), 'Bubblewinkles', 'lastName after set nested');
    assert.equal(changeset.profile.lastName, 'Bubblewinkles', 'lastName after set nested');
    assert.equal(changeset.get('profile.nickname'), 't', 'nickname after set nested');
    assert.equal(changeset.profile.nickname, 't', 'nickname after set nested');

    changeset.execute();

    assert.equal(user.get('profile.firstName'), 'Terry');
    assert.equal(user.get('profile.lastName'), 'Bubblewinkles');

    changeset.set('profile', null);
    assert.equal(changeset.get('profile'), null, 'changeset profile is null');

    changeset.execute();

    assert.equal(changeset.get('profile'), null, 'changeset profile relationship is still null');
    assert.equal(user.get('profile').get('firstName'), null, 'underlying user profile firstName is null');
    assert.ok(user.get('profile'), 'user has yet to call save so still present as proxy');
  });

  test('can save user', async function(assert) {
    assert.expect(1);

    let profile = this.store.createRecord('profile');
    let save = () => {
      assert.ok(true, 'user save was called')
    }
    this.dummyUser = this.store.createRecord('user', { profile, save });

    let user = this.dummyUser;
    let changeset = new Changeset(user);

    changeset.set('profile.firstName', 'Grace');
    changeset.execute();
    changeset.save();
  });

  test('can work with belongsTo via changeset', async function(assert) {
    let profile = this.store.createRecord('profile');
    this.dummyUser = this.store.createRecord('user', { profile });

    let user = this.dummyUser;
    let changeset = new Changeset(user);

    changeset.set('profile.firstName', 'Grace');
    profile = changeset.get('profile');
    let profileChangeset = new Changeset(profile);

    assert.equal(profileChangeset.get('firstName'), 'Grace', 'profileChangeset profile firstName is set');
    assert.equal(changeset.get('profile.firstName'), 'Grace', 'changeset profile firstName is set');

    profileChangeset.execute();

    assert.equal(profile.firstName, 'Grace', 'profile has first name');
    assert.equal(user.get('profile.firstName'), 'Bob', 'user still has profile has first name');

    changeset.execute();

    assert.equal(profile.firstName, 'Grace', 'profile has first name');
    assert.equal(user.get('profile.firstName'), 'Grace', 'user now has profile has first name');
  });

  test('it works for hasMany / firstObject', async function(assert) {
    let user = this.dummyUser;

    let changeset = new Changeset(user);
    let newDog = this.store.createRecord('dog', { breed: 'Münsterländer' });
    let dogs = changeset.get('dogs');
    dogs.pushObjects([newDog]);

    dogs = changeset.get('dogs').toArray();
    assert.equal(dogs[0].get('breed'), 'rough collie');
    assert.equal(dogs[1].get('breed'), 'rough collie');
    assert.equal(dogs[2].get('breed'), 'Münsterländer');

    changeset.execute();

    dogs = user.get('dogs').toArray();
    assert.equal(dogs[0].get('breed'), 'rough collie');
    assert.equal(dogs[1].get('breed'), 'rough collie');
    assert.equal(dogs[2].get('breed'), 'Münsterländer');

    changeset.set('dogs', []);

    changeset.execute();

    dogs = user.get('dogs').toArray();
    assert.equal(dogs.length, 0, 'dogs removed');
  });

  test('it can rollback hasMany', async function(assert) {
    let user = this.dummyUser;

    let changeset = new Changeset(user);
    let newDog = this.store.createRecord('dog', { breed: 'Münsterländer' });
    changeset.set('dogs', [...changeset.get('dogs').toArray(), newDog]);

    let dogs = changeset.get('dogs');
    assert.equal(dogs.length, 3, 'changeset has 3 dogs');

    changeset.rollback();

    dogs = changeset.get('dogs');
    assert.equal(dogs.length, 2, 'changeset has 2 dogs');
  });
});
