import Model, { belongsTo, hasMany } from '@ember-data/model';

export default Model.extend({
  profile: belongsTo('profile', { async: false }),
  dogs: hasMany('dog', { async: false }),
});
