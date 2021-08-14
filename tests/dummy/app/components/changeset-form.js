import Component from '@ember/component';
import { later } from '@ember/runloop';
import { action, get } from '@ember/object';
import { tracked } from '@glimmer/tracking';
import { Changeset } from 'ember-changeset';

function validate() {
  return 'not good';
}

let dummyValidations = {
  user: {
    name(value) {
      return !!value;
    },
    email(value) {
      let ok = value && value.includes('@');
      return new Promise((resolve) =>
        later(
          this,
          () => {
            resolve(ok);
          },
          400
        )
      );
    },
  },
};

function dummyValidator({ key, newValue, oldValue, changes, content }) {
  let validatorFn = get(dummyValidations, key);

  if (typeof validatorFn === 'function') {
    return validatorFn(newValue, oldValue, changes, content);
  }
}

class Address {
  constructor(args) {
    Object.assign(this, args);
  }
  street = '123';
  city = 'Yurtville';
}

class Foo {
  user = {
    aliases: ['someone'],
    name: 'someone',
    email: 'something',
  };

  addresses = [new Address(), new Address({ city: 'Woods' })];

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

  get validateOnRender() {
    let cs = Changeset({}, null, { title: validate });
    cs.validate();
    return cs;
  }

  @action
  async submitForm(changeset, event) {
    event.preventDefault();

    await changeset.validate();

    changeset.save();
  }
}
