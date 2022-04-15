import Component from '@glimmer/component';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';
import { ValidatedChangeset } from 'ember-changeset';

import { array, object, string, number, date } from 'yup';

const FormSchema = object({
  name: string().required(),
  email: string().email(),
});

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

export default class ValidatedForm extends Component {
  constructor() {
    super(...arguments);

    this.model = new Foo();
    this.changeset = ValidatedChangeset(this.model);
  }

  @action
  async submitForm(changeset, event) {
    event.preventDefault();

    try {
      await changeset.validate((changes) => {
        FormSchema.validate(changes)
      });
    } catch (e) {
      changeset.addError(e.path, { value: e.value.age, validation: e.message });
    }
  }
}
