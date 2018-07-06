import DS from 'ember-data';
import { belongsTo, hasMany } from 'ember-data/relationships';

export default DS.Model.extend({
  profile: belongsTo('profile'),
  dogs: hasMany('dog'),
});
