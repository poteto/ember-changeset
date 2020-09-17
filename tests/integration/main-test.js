import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import { set } from '@ember/object';
import { Changeset } from 'ember-changeset';
import { isEmpty } from '@ember/utils';

module('Integration | main', function (hooks) {
  setupTest(hooks);

  hooks.beforeEach(function () {
    this.store = this.owner.lookup('service:store');

    this.createUser = (userType, withDogs) => {
      let profile = this.store.createRecord('profile');
      let user = this.store.createRecord(userType, { profile });

      if (withDogs) {
        for (let i = 0; i < 2; i++) {
          user.get('dogs').addObject(this.store.createRecord('dog'));
        }
      }
      return user;
    };
  });

  async function testBasicBelongsTo(assert, userType) {
    let user = this.createUser(userType, false);
    let changeset = Changeset(user);

    assert.equal(changeset.get('profile.firstName'), user.get('profile.firstName'));
    assert.equal(changeset.get('profile.lastName'), user.get('profile.lastName'));

    assert.equal(changeset.isDirty, false, 'is not dirty');

    changeset.get('profile').set('firstName', 'Grace');
    changeset.set('profile.nickname', 'g');
    set(changeset, 'profile.lastName', 'Hopper');

    assert.equal(changeset.get('profile.firstName'), 'Grace', 'has firstName after set');
    assert.equal(changeset.get('profile.nickname'), 'g', 'has nickname after set');
    assert.equal(changeset.get('profile.lastName'), 'Hopper', 'Ember.set does work');

    assert.equal(changeset.isDirty, true, 'is dirty');

    changeset.execute();

    assert.equal(user.get('profile.firstName'), 'Grace', 'firstName after execute');
    assert.equal(user.get('profile.lastName'), 'Hopper', 'lastName after execute');
    assert.equal(user.get('profile.nickname'), 'g', 'nickname after execute');

    assert.equal(changeset.isDirty, true, 'is dirty');

    let profile = this.store.createRecord('profile', { firstName: 'Terry', lastName: 'Bubblewinkles', nickname: 't' });

    changeset.set('profile', profile);

    assert.equal(changeset.get('profile').get('firstName'), 'Terry', 'firstName after set');
    assert.equal(changeset.get('profile').get('lastName'), 'Bubblewinkles', 'lastName after set');
    assert.equal(changeset.get('profile.firstName'), 'Terry', 'firstName after set nested');
    assert.equal(changeset.profile.firstName, 'Terry', 'firstName after set nested');
    assert.equal(changeset.get('profile.lastName'), 'Bubblewinkles', 'lastName after set nested');
    assert.equal(changeset.profile.lastName, 'Bubblewinkles', 'lastName after set nested');
    assert.equal(changeset.get('profile.nickname'), 't', 'nickname after set nested');
    assert.equal(changeset.profile.nickname, 't', 'nickname after set nested');

    assert.equal(changeset.isDirty, true, 'is dirty');

    changeset.execute();

    assert.equal(user.get('profile.firstName'), 'Terry');
    assert.equal(user.get('profile.lastName'), 'Bubblewinkles');

    assert.equal(changeset.isDirty, true, 'is dirty');

    changeset.set('profile', null);
    assert.equal(changeset.get('profile'), null, 'changeset profile is null');

    assert.equal(changeset.isDirty, true, 'is dirty');

    changeset.execute();

    assert.equal(changeset.get('profile'), null, 'changeset profile relationship is still null');
    assert.equal(user.get('profile.firstName'), null, 'underlying user profile firstName is null');

    assert.equal(changeset.isDirty, true, 'is dirty');
  }

  test('it works for belongsTo', async function (assert) {
    await testBasicBelongsTo.call(this, assert, 'user');
  });

  test('it works for sync belongsTo', async function (assert) {
    await testBasicBelongsTo.call(this, assert, 'sync-user');
  });

  test('can call prepare with belongsTo', async function (assert) {
    let user = this.createUser('sync-user', false);
    let changeset = Changeset(user);
    let profile = this.store.createRecord('profile', { firstName: 'Terry', lastName: 'Bubblewinkles', nickname: 't' });

    changeset.set('profile', profile);
    changeset.prepare((changes) => {
      let modified = {};

      for (let key in changes) {
        modified[key] = changes[key];
      }

      return modified;
    });

    assert.equal(changeset.get('profile').get('firstName'), 'Terry', 'firstName after set');
  });

  async function testSaveUser(assert, userType) {
    assert.expect(1);

    let profile = this.store.createRecord('profile');
    let save = () => {
      assert.ok(true, 'user save was called');
    };

    let user = this.store.createRecord(userType, { profile, save });
    let changeset = Changeset(user);

    changeset.set('profile.firstName', 'Grace');
    changeset.save();
  }

  test('can save user', async function (assert) {
    await testSaveUser.call(this, assert, 'user');
  });

  test('can save sync user', async function (assert) {
    await testSaveUser.call(this, assert, 'sync-user');
  });

  test('can save ember data model with multiple attributes', async function (assert) {
    assert.expect(1);

    let save = () => {
      assert.ok(true, 'profile save was called');
    };
    let profile = this.store.createRecord('profile', { save });
    let pet = this.store.createRecord('dog');
    let changeset = Changeset(profile);

    changeset.set('firstName', 'bo');
    changeset.set('lastName', 'jackson');
    changeset.set('pet', pet);

    changeset.save();
  });

  async function testBelongsToViaChangeset(assert, userType) {
    let profile = this.store.createRecord('profile');
    let user = this.store.createRecord(userType, { profile });

    let changeset = Changeset(user);

    changeset.set('profile.firstName', 'Grace');
    profile = changeset.get('profile');
    let profileChangeset = Changeset(profile);

    assert.equal(profileChangeset.get('firstName'), 'Grace', 'profileChangeset profile firstName is set');
    assert.equal(changeset.get('profile.firstName'), 'Grace', 'changeset profile firstName is set');

    profileChangeset.execute();

    assert.equal(profile.firstName, 'Grace', 'profile has first name');
    assert.equal(user.get('profile.firstName'), 'Bob', 'user still has profile has first name');

    changeset.execute();

    assert.equal(profile.firstName, 'Grace', 'profile has first name');
    assert.equal(user.get('profile.firstName'), 'Grace', 'user now has profile has first name');
  }

  test('can work with belongsTo via changeset', async function (assert) {
    await testBelongsToViaChangeset.call(this, assert, 'user');
  });

  test('can work with sync belongsTo via changeset', async function (assert) {
    await testBelongsToViaChangeset.call(this, assert, 'sync-user');
  });

  async function testHasMany(assert, userType) {
    let user = this.createUser(userType, true);
    let changeset = Changeset(user);
    let newDog = this.store.createRecord('dog', { breed: 'Münsterländer' });

    assert.equal(changeset.isDirty, false, 'is not dirty');
    assert.deepEqual(changeset.changes, [], 'has no changes');

    let dogs = changeset.get('dogs');
    dogs.pushObjects([newDog]);

    assert.equal(changeset.isDirty, false, 'is not dirty b/c no set');
    assert.deepEqual(changeset.changes, [], 'has no changes');

    dogs = changeset.get('dogs');
    assert.equal(dogs.objectAt(0).get('breed'), 'rough collie', 'has first breed');
    assert.equal(dogs.objectAt(1).get('breed'), 'rough collie', 'has second breed');
    assert.equal(dogs.objectAt(2).get('breed'), 'Münsterländer', 'has third breed');

    assert.equal(changeset.isDirty, false, 'is not dirty before execute');
    assert.deepEqual(changeset.changes, [], 'has no changes before execute');

    changeset.execute();

    dogs = user.get('dogs');
    assert.equal(dogs.objectAt(0).get('breed'), 'rough collie', 'has first breed');
    assert.equal(dogs.objectAt(1).get('breed'), 'rough collie', 'has second breed');
    assert.equal(dogs.objectAt(2).get('breed'), 'Münsterländer', 'has third breed');

    assert.equal(changeset.isDirty, false, 'is not dirty after execute');
    assert.deepEqual(changeset.changes, [], 'has no changes');

    changeset.set('dogs', []);

    assert.equal(changeset.isDirty, true, 'is dirty');
    assert.deepEqual(changeset.changes, [{ key: 'dogs', value: [] }], 'has changes');

    changeset.set('dogs', [newDog]);

    assert.equal(changeset.isDirty, true, 'is dirty');
    assert.deepEqual(changeset.changes, [{ key: 'dogs', value: [newDog] }], 'has changes');

    changeset.execute();

    dogs = user.get('dogs');
    assert.equal(dogs.length, 1, 'dogs removed', 'all dogs removed');

    assert.equal(changeset.isDirty, true, 'is still dirty');
    assert.deepEqual(changeset.changes, [{ key: 'dogs', value: [newDog] }], 'has changes');

    changeset.rollback();
    assert.equal(changeset.isDirty, false, 'is not dirty');
  }

  test('it works for hasMany / firstObject', async function (assert) {
    await testHasMany.call(this, assert, 'user');
  });

  test('it works for sync hasMany / firstObject', async function (assert) {
    await testHasMany.call(this, assert, 'sync-user');
  });

  async function testRollbackHasMany(assert, userType) {
    let user = this.createUser(userType, true);

    let changeset = Changeset(user);
    let newDog = this.store.createRecord('dog', { breed: 'Münsterländer' });
    changeset.set('dogs', [...changeset.get('dogs').toArray(), newDog]);

    let dogs = changeset.get('dogs');
    assert.equal(dogs.length, 3, 'changeset has 3 dogs');

    changeset.rollback();

    dogs = changeset.get('dogs');
    assert.equal(dogs.length, 2, 'changeset has 2 dogs');
  }

  test('it can rollback hasMany', async function (assert) {
    await testRollbackHasMany.call(this, assert, 'user');
  });

  test('it can rollback sync hasMany', async function (assert) {
    await testRollbackHasMany.call(this, assert, 'sync-user');
  });

  async function testInitiallyEmptyRelationships(assert, userType) {
    let profile = this.store.createRecord('profile');
    let user = this.store.createRecord(userType);

    let changeset = Changeset(user);

    changeset.set('profile', profile);
    const dogs = [this.store.createRecord('dog'), this.store.createRecord('dog', { breed: 'Münsterländer' })];

    changeset.set('dogs', dogs);

    changeset.execute();

    assert.equal(user.get('profile.firstName'), 'Bob', 'Profile is set on user');
    assert.equal(user.get('dogs.firstObject.breed'), 'rough collie');
    assert.equal(user.get('dogs.lastObject.breed'), 'Münsterländer');
  }

  test('it sets relationships which were empty initially', async function (assert) {
    await testInitiallyEmptyRelationships.call(this, assert, 'user');
  });

  test('it sets sync relationships which were empty initially', async function (assert) {
    await testInitiallyEmptyRelationships.call(this, assert, 'sync-user');
  });

  async function testBelongsToPresenceValidation(assert, userType) {
    let user = this.store.createRecord(userType);
    function userValidator({ key, newValue }) {
      if (key === 'profile') {
        return isEmpty(newValue) ? 'Cannot be blank' : true;
      }
      return true;
    }
    let userChangeset = Changeset(user, userValidator);
    // The following simulates rendering of the current value
    // and triggers the ObjectTreeNode logic in validated-changeset.
    userChangeset.profile;
    await userChangeset.validate('profile');

    assert.deepEqual(userChangeset.error.profile.validation, 'Cannot be blank');
  }

  test('#error for empty belongsTo', async function (assert) {
    await testBelongsToPresenceValidation.call(this, assert, 'user');
  });

  test('#error for empty sync belongsTo', async function (assert) {
    await testBelongsToPresenceValidation.call(this, assert, 'sync-user');
  });
});
