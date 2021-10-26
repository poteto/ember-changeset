import Model, { attr, belongsTo } from '@ember-data/model';

export default class Dog extends Model {
  @attr('string', { defaultValue: 'rough collie' }) breed;
  @belongsTo('user') user;
}
