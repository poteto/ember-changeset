import Component from '@ember/component';
import { action } from '@ember/object';
import { Changeset } from 'ember-changeset'

export default class ChangesetForm extends Component {
  model = {
    user: {
      aliases: ['someone'],
      name: 'someone',
      email: 'something'
    },
    address: null,
    cid: '1',
    notifications: {
      email: false,
      sms: true
    }
  }

  init() {
    super.init(...arguments);

    this.changeset = Changeset(this.model)
  }

  @action
  submitForm(changeset, event) {
    event.preventDefault()
    changeset.save()
  }
}
