import Model, { attr, belongsTo } from '@ember-data/model';

export default Model.extend({
  firstName: attr('string', { defaultValue: 'Bob' }),
  lastName: attr('string', { defaultValue: 'Ross' }),

  pet: belongsTo('dog'),
});
