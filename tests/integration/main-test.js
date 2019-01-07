import { module, test, skip } from 'qunit';
import { setupTest } from 'ember-qunit';
import { run } from '@ember/runloop';
import { set } from '@ember/object';
import Changeset from 'ember-changeset';

module('Integration | main', function(hooks) {
  setupTest(hooks);

  hooks.beforeEach(function() {
    // for backwards compatibility with pre 3.0 versions of ember
    let container = this.owner || this.application.__container__;
    this.store = container.lookup('service:store');

    run(() => {
      let profile = this.store.createRecord('profile');
      let user = this.store.createRecord('user', { profile });
      this.dummyUser = user;

      return user.get('dogs').then(() => {
        for (let i = 0; i < 2; i++) {
          user.get('dogs').addObject(this.store.createRecord('dog'))
        }
      });
    });
  });

  test('it works for belongsTo', function(assert) {
    let user = this.dummyUser;
    let changeset = new Changeset(user);

    assert.equal(changeset.get('profile'), user.get('profile'));
    assert.equal(changeset.get('profile.firstName'), user.get('profile.firstName'));
    assert.equal(changeset.get('profile.lastName'), user.get('profile.lastName'));

    changeset.get('profile').set('firstName', 'Grace');
    changeset.set('profile.nickname', 'g');
    set(changeset, 'profile.lastName', 'Hopper');

    assert.equal(changeset.get('profile.firstName'), 'Grace');
    assert.equal(changeset.get('profile.nickname'), 'g');
    assert.equal(changeset.get('profile.lastName'), 'Hopper');

    changeset.execute();

    assert.equal(user.get('profile.firstName'), 'Grace');
    assert.equal(user.get('profile.lastName'), 'Hopper');
    assert.equal(user.get('profile.nickname'), 'g');

    let profile;
    run(() => {
      profile = this.store.createRecord('profile', { firstName: 'Terry', lastName: 'Bubblewinkles', nickname: 't' });
    });

    changeset.set('profile', profile);

    assert.equal(changeset.get('profile').get('firstName'), 'Terry');
    assert.equal(changeset.get('profile').get('lastName'), 'Bubblewinkles');
    assert.equal(changeset.get('profile.firstName'), 'Terry');
    assert.equal(changeset.get('profile.lastName'), 'Bubblewinkles');
    assert.equal(changeset.get('profile.nickname'), 't');

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

  test('can save user', function(assert) {
    assert.expect(1);

    run(() => {
      let profile = this.store.createRecord('profile');
      let save = () => {
        assert.ok(true, 'user save was called')
      }
      this.dummyUser = this.store.createRecord('user', { profile, save });
    });

    let user = this.dummyUser;
    let changeset = new Changeset(user);

    changeset.set('profile.firstName', 'Grace');
    changeset.execute();
    changeset.save();
  });

  skip('can save belongsTo via changeset', function(assert) {
    assert.expect(2);

    run(() => {
      let save = () => {
        assert.ok(true, 'user save was called')
      }
      let profile = this.store.createRecord('profile', { save });
      this.dummyUser = this.store.createRecord('user', { profile });
    });

    let user = this.dummyUser;
    let changeset = new Changeset(user);

    changeset.set('profile.firstName', 'Grace');
    let profile = changeset.get('profile');
    let profileChangeset = new Changeset(profile);

    assert.equal(profileChangeset.get('firstName'), 'Grace', 'changeset profile firstName is set');
    profileChangeset.execute();
    profileChangeset.save();
  });

  test('it works for hasMany / firstObject', function(assert) {
    let user = this.dummyUser;

    let changeset = new Changeset(user);
    run(() => {
      let newDog = this.store.createRecord('dog', { breed: 'Münsterländer' });
      let dogs = changeset.get('dogs');
      dogs.pushObjects([newDog]);
    });

    let dogs = changeset.get('dogs').toArray();
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
});
