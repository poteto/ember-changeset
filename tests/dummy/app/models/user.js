import Model, { belongsTo, hasMany } from '@ember-data/model';

export default class User extends Model {
  @belongsTo('profile') profile;
  @hasMany('dog') dogs;
}
