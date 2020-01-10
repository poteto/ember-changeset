import Component from '@ember/component';
// @ts-ignore: Ignore import of compiled template
/* import layout from '../templates/components/changeset-form'; */
/* import { tracked } from '@glimmer/tracking'; */
import { action } from '@ember/object';
import Changeset from 'ember-changeset'

export default class ChangesetForm extends Component.extend({
  // anything which *must* be merged to prototype here
}) {
  model = {
    email: 'something'
  }

  changeset = new Changeset(this.model)
  // normal class body definition here

  @action submitForm(changeset: any, event: any) {
    event.preventDefault()
    changeset.save()
  }
}
