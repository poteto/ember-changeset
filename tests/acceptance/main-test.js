import { module, test, skip } from 'qunit';
import { setupApplicationTest } from 'ember-qunit';
import Model from 'ember-data/model';
import attr from 'ember-data/attr';
import { belongsTo, hasMany } from 'ember-data/relationships';
import { run } from '@ember/runloop';
import Changeset from 'ember-changeset';

module('Acceptance | main', function(hooks) {
  setupApplicationTest(hooks);

  hooks.beforeEach(function() {
    // for backwards compatibility with pre 3.0 versions of ember
    let container = this.owner || this.application.__container__;
    let application = this.owner.application || this.application;
    let store = container.lookup('service:store');

    application.register('model:profile', Model.extend({
      firstName: attr('string', { defaultValue: 'Bob' }),
      lastName: attr('string', { defaultValue: 'Ross' }),
    }));

    application.register('model:user', Model.extend({
      profile: belongsTo('profile'),
      dogs: hasMany('dog'),
    }));

    application.register('model:dog', Model.extend({
      breed: attr('string', { defaultValue: 'rough collie' }),
      user: belongsTo('user'),
    }));

    run(() => {
      let profile = store.createRecord('profile');
      let user = store.createRecord('user', { profile });
      this.dummyUser = user;

      return user.get('dogs').then(() => {
        for (let i = 0; i < 2; i++) {
          user.get('dogs').addObject(store.createRecord('dog'))
        }
      });
    });
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

  skip("it (doesn't) work for hasMany / firstObject", function(a) {
    a.expect(2 + 4);

    run(() => {
      let user = this.dummyUser;

      // TODO: Add special handling if content is DS.ManyArray?
      // `dogs.firstObject` is readonly.
      return user.get('dogs').then(dogs => {
        const FirstName = 'firstObject.user.profile.firstName';
        const LastName  = 'firstObject.user.profile.lastName';

        let cs = new Changeset(dogs);

        cs.set(FirstName, 'Grace');
        cs.set(LastName,  'Hopper');
        a.equal(cs.get(FirstName), 'Grace');
        a.equal(cs.get(LastName),  'Hopper');

        cs.execute();
        a.equal(user.get(FirstName), 'Grace');
        a.equal(user.get(LastName),  'Hopper');
        a.equal(user.get('profile.firstName'), 'Grace');
        a.equal(user.get('profile.lastName'),  'Hopper');
      });
    });
  });
});
