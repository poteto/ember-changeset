import DS from 'ember-data';
import attr from 'ember-data/attr';

export default DS.Model.extend({
  firstName: attr('string', { defaultValue: 'Bob' }),
  lastName: attr('string', { defaultValue: 'Ross' }),
});
