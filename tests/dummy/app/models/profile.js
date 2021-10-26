import Model, { attr, belongsTo } from '@ember-data/model';

export default class Profile extends Model {
  @attr('string', { defaultValue: 'Bob' }) firstName;
  @attr('string', { defaultValue: 'Ross' }) lastName;

  @belongsTo('dog') pet;
}
