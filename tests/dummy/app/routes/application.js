import Ember from 'ember';

const {
  Object: EmberObject,
  RSVP: { resolve },
  Route
} = Ember;

export default Route.extend({
  model() {
    let user = EmberObject.extend({
      firstName: 'Jim',
      lastName: 'Bob',
      age: 50,

      save() {
        return resolve(true);
      }
    });

    return user.create();
  }
});
