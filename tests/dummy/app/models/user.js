import Model, { belongsTo, hasMany } from '@ember-data/model';

export default Model.extend({
  profile: belongsTo('profile'),
  dogs: hasMany('dog'),
});
