import Model, { belongsTo, hasMany } from '@ember-data/model';

export default class SyncUser extends Model {
  @belongsTo('profile', { async: false }) profile;
  @hasMany('dog', { async: false }) dogs;
}
