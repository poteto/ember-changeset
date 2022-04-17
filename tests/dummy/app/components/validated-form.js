import Component from '@glimmer/component';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';
import { ValidatedChangeset } from 'ember-changeset';

import { object, string } from 'yup';

const FormSchema = object({
  cid: string().required(),
  user: object({
    name: string().required(),
    email: string().email(),
  })
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
    name: 'someone',
    email: 'something@gmail.com',
  };

  addresses = [new Address(), new Address({ city: 'Woods' })];

  cid = '1';

  @tracked
  growth = 0;

  // notifications = {
  //   email: false,
  //   sms: true,
  // };

  // get doubleGrowth() {
  //   return this.growth * 2;
  // }
}

export default class ValidatedForm extends Component {
  constructor() {
    super(...arguments);

    this.model = new Foo();
    this.changeset = ValidatedChangeset(this.model);
  }

  @action
  async setChangesetProperty(path, evt) {
    this.changeset.set(path, evt.target.value);
    try {
      await this.changeset.validate((changes) => {
        return FormSchema.validate(changes);
      });
      this.changeset.removeError(path);
    } catch (e) {
      this.changeset.addError(e.path, { value: this.changeset.get(e.path), validation: e.message });
    }
  }

  @action
  async submitForm(changeset, event) {
    event.preventDefault();

    changeset.execute();
  }
}
