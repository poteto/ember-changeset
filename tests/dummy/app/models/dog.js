import DS from 'ember-data';
import attr from 'ember-data/attr';
import { belongsTo } from 'ember-data/relationships';

export default DS.Model.extend({
  breed: attr('string', { defaultValue: 'rough collie' }),
  user: belongsTo('user'),
});
