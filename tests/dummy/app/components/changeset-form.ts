import Component from '@ember/component';
import { action } from '@ember/object';
import Changeset from 'ember-changeset'

export default class ChangesetForm extends Component.extend() {
  model = {
    email: 'something'
  }

  changeset = new Changeset(this.model)
  @action submitForm(changeset: any, event: any) {
    event.preventDefault()
    changeset.save()
  }
}
