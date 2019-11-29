import Helper from '@ember/component/helper';

export default class ChangesetGet extends Helper.extend() {
  compute() {
    throw new Error('changeset-get is now removed as of 3.0.0-beta.0.  See `https://github.com/poteto/ember-changeset/issues/379`');
  }
}
