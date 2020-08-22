import Component from '@ember/component';
import { action, get } from '@ember/object';
import { tracked } from '@glimmer/tracking';
import { Changeset } from 'ember-changeset';

let dummyValidations = {
  user: {
    name(value) {
      return !!value;
    },
    email(value) {
      return value && value.includes('@');
    },
  },
};

function dummyValidator({ key, newValue, oldValue, changes, content }) {
  let validatorFn = get(dummyValidations, key);

  if (typeof validatorFn === 'function') {
    return validatorFn(newValue, oldValue, changes, content);
  }
}

class Foo {
  user = {
    aliases: ['someone'],
    name: 'someone',
    email: 'something',
  };

  address = null;

  cid = '1';

  @tracked
  growth = 0;

  notifications = {
    email: false,
    sms: true,
  };

  get doubleGrowth() {
    return this.growth * 2;
  }
}

export default class ChangesetForm extends Component {
  init() {
    super.init(...arguments);

    this.model = new Foo();
    this.changeset = Changeset(this.model, dummyValidator);
  }

  @action
  async submitForm(changeset, event) {
    event.preventDefault();

    await changeset.validate();

    changeset.save();
  }
}
