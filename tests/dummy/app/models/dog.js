import Model, { attr, belongsTo } from '@ember-data/model';

export default Model.extend({
  breed: attr('string', { defaultValue: 'rough collie' }),
  user: belongsTo('user'),
});
