import Component from '@ember/component';
import { action } from '@ember/object';
import Changeset from 'ember-changeset'

export default class ChangesetForm extends Component {
  model = {
    user: {
      name: 'someone',
      email: 'something'
    },
    cid: '1'
  }

  changeset = new Changeset(this.model)

  @action submitForm(changeset: any, event: any) {
    event.preventDefault()
    changeset.save()
  }
}
