import Component from '@ember/component';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';
import { Changeset } from 'ember-changeset'

class Foo {
  user = {
    aliases: ['someone'],
    name: 'someone',
    email: 'something'
  }

  address = null

  cid = '1'

  @tracked
  growth = 0

  notifications = {
    email: false,
    sms: true
  }

  get doubleGrowth() {
    return this.growth * 2;
  }
}

export default class ChangesetForm extends Component {
  init() {
    super.init(...arguments);

    this.model = new Foo();
    this.changeset = Changeset(this.model);
  }

  @action
  submitForm(changeset, event) {
    event.preventDefault()
    changeset.save()
  }
}
