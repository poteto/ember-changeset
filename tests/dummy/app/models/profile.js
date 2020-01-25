import DS from 'ember-data';
import attr from 'ember-data/attr';
import { belongsTo } from 'ember-data/relationships';


export default DS.Model.extend({
  firstName: attr('string', { defaultValue: 'Bob' }),
  lastName: attr('string', { defaultValue: 'Ross' }),

  pet: belongsTo('dog'),
});
