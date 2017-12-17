![ember-changeset](https://user-images.githubusercontent.com/914228/34072699-2536e494-e25a-11e7-8406-38ca4e5a5d42.png)
<br>
[![Download count all time](https://img.shields.io/npm/dt/ember-changeset.svg)](https://badge.fury.io/js/ember-changeset)
[![TravisCI Build Status](https://img.shields.io/travis/poteto/ember-changeset/master.svg)](https://travis-ci.org/poteto/ember-changeset)
[![npm version](https://badge.fury.io/js/ember-changeset.svg)](https://badge.fury.io/js/ember-changeset)
[![Ember Observer Score](https://emberobserver.com/badges/ember-changeset.svg)](https://emberobserver.com/addons/ember-changeset)
===

Ember.js flavored changesets, inspired by [Ecto](https://github.com/elixir-lang/ecto). To install:

```
ember install ember-changeset
```

> [Watch a free video intro presented by EmberScreencasts](https://www.emberscreencasts.com/posts/168-introduction-to-ember-changeset)
>
> <img alt="" src="https://user-images.githubusercontent.com/914228/34072730-9d2d0bcc-e25a-11e7-9ab5-405ddce05303.gif" width="25"> <img alt="" src="https://user-images.githubusercontent.com/914228/34072749-07a8ab50-e25b-11e7-80ba-d0f6250aad11.png" width="20.5">

## Philosophy

The idea behind a changeset is simple: it represents a set of valid changes to be applied onto any Object (`Ember.Object`, `DS.Model`, POJOs, etc). Each change is tested against an optional validation, and if valid, the change is stored and applied when executed.

Given Ember's Data Down, Actions Up (DDAU) approach, a changeset is more appropriate compared to implicit 2 way bindings. Other validation libraries only validate a property *after* it is set on an Object, which means that your Object can enter an invalid state.

`ember-changeset` only allows valid changes to be set, so your Objects will never become invalid (assuming you have 100% validation coverage). Additionally, this addon is designed to be un-opinionated about your choice of form and/or validation library, so you can easily integrate it into an existing solution.

The simplest way to incorporate validations is to use [`ember-changeset-validations`](https://github.com/poteto/ember-changeset-validations/), a companion addon to this one. It has a simple mental model, and there are no Observers or CPs involved – just pure functions.

See also the [plugins](#plugins) section for addons that extend `ember-changeset`.

#### tl;dr

```js
let changeset = new Changeset(user, validatorFn);
user.get('firstName'); // "Michael"
user.get('lastName'); // "Bolton"

changeset.set('firstName', 'Jim');
changeset.set('lastName', 'B');
changeset.get('isInvalid'); // true
changeset.get('errors'); // [{ key: 'lastName', validation: 'too short', value: 'B' }]
changeset.set('lastName', 'Bob');
changeset.get('isValid'); // true

user.get('firstName'); // "Michael"
user.get('lastName'); // "Bolton"

changeset.save(); // sets and saves valid changes on the user
user.get('firstName'); // "Jim"
user.get('lastName'); // "Bob"
```

## Usage

First, create a new `Changeset` using the `changeset` helper or through JavaScript:

```hbs
{{! application/template.hbs}}
{{#with (changeset model (action "validate")) as |changeset|}}
  {{dummy-form
      changeset=changeset
      submit=(action "submit")
      rollback=(action "rollback")
  }}
{{/with}}
```

```js
import Component from '@ember/component';
import { get }   from '@ember/object';
import Changeset from 'ember-changeset';

export default Component.extend({
  init() {
    this._super(...arguments);
    let model = get(this, 'model');
    let validator = get(this, 'validate');
    this.changeset = new Changeset(model, validator);
  }
});
```

The helper receives any Object (including `DS.Model`, `Ember.Object`, or even POJOs) and an optional `validator` action. If a `validator` is passed into the helper, the changeset will attempt to call that function when a value changes.

```js
// application/controller.js
import Controller from '@ember/controller';

export default Controller.extend({
  actions: {
    submit(changeset) {
      return changeset.save();
    },

    rollback(changeset) {
      return changeset.rollback();
    },

    validate({ key, newValue, oldValue, changes, content }) {
      // lookup a validator function on your favorite validation library
      // should return a Boolean
    }
  }
});
```

Then, in your favorite form library, simply pass in the `changeset` in place of the original model.

```hbs
{{! dummy-form/template.hbs}}
<form>
  {{input value=changeset.firstName}}
  {{input value=changeset.lastName}}

  <button {{action submit changeset}}>Submit</button>
  <button {{action rollback changeset}}>Cancel</button>
</form>
```

In the above example, when the input changes, only the changeset's internal values are updated. When the submit button is clicked, the changes are only executed if *all changes* are valid.

On rollback, all changes are dropped and the underlying Object is left untouched.

## Disabling Automatic Validation

The default behavior of `Changeset` is to automatically validate a field when it is set. Automatic validation can be disabled by passing `skipValidate` as an option when creating a changeset.

```js
let changeset = new Changeset(model, validatorFn, validationMap, { skipValidate: true });
```

```hbs
{{#with (changeset model (action "validate") skipValidate=true) as |changeset|}}
  ...
{{/with}}
```

Be sure to call `validate()` on the `changeset` before saving or committing changes.

## API

* Properties
  + [`error`](#error)
  + [`change`](#change)
  + [`errors`](#errors)
  + [`changes`](#changes)
  + [`isValid`](#isvalid)
  + [`isInvalid`](#isinvalid)
  + [`isPristine`](#ispristine)
  + [`isDirty`](#isdirty)
* Methods
  + [`get`](#get)
  + [`set`](#set)
  + [`prepare`](#prepare)
  + [`execute`](#execute)
  + [`save`](#save)
  + [`merge`](#merge)
  + [`rollback`](#rollback)
  + [`validate`](#validate)
  + [`addError`](#adderror)
  + [`pushErrors`](#pusherrors)
  + [`snapshot`](#snapshot)
  + [`restore`](#restore)
  + [`cast`](#cast)
  + [`isValidating`](#isvalidating)
* Events
  + [`beforeValidation`](#beforevalidation)
  + [`afterValidation`](#aftervalidation)

#### `error`

Returns the error object.

```js
{
  firstName: {
    value: 'Jim',
    validation: 'First name must be greater than 7 characters'
  }
}
```

Note that keys can be arbitrarily nested:

```js
{
  address: {
    zipCode: {
      value: '123',
      validation: 'Zip code must have 5 digits'
    }
  }
}
```

You can use this property to locate a single error:

```hbs
{{#if changeset.error.firstName}}
  <p>{{changeset.error.firstName.validation}}</p>
{{/if}}

{{#if changeset.error.address.zipCode}}
  <p>{{changeset.error.address.zipCode.validation}}</p>
{{/if}}
```

**[⬆️ back to top](#api)**

#### `change`

Returns the change object.

```js
{
  firstName: 'Jim'
}
```

Note that keys can be arbitrarily nested:

```js
{
  address: {
    zipCode: '10001'
  }
}
```

You can use this property to locate a single change:

```hbs
{{changeset.change.firstName}}
{{changeset.change.address.zipCode}}
```

**[⬆️ back to top](#api)**

#### `errors`

Returns an array of errors. If your `validate` function returns a non-boolean value, it is added here as the `validation` property.

```js
[
  {
    key: 'firstName',
    value: 'Jim',
    validation: 'First name must be greater than 7 characters'
  },
  {
    key: 'address.zipCode',
    value: '123',
    validation: 'Zip code must have 5 digits'
  }
]
```

You can use this property to render a list of errors:

```hbs
{{#if changeset.isInvalid}}
  <p>There were errors in your form:</p>
  <ul>
    {{#each changeset.errors as |error|}}
      <li>{{error.key}}: {{error.validation}}</li>
    {{/each}}
  </ul>
{{/if}}
```

**[⬆️ back to top](#api)**

#### `changes`

Returns an array of changes to be executed. Only valid changes will be stored on this property.

```js
[
  {
    key: 'firstName',
    value: 'Jim'
  },
  {
    key: 'address.zipCode',
    value: 10001
  }
]
```

You can use this property to render a list of changes:

```hbs
<ul>
  {{#each changeset.changes as |change|}}
    <li>{{change.key}}: {{change.value}}</li>
  {{/each}}
</ul>
```

**[⬆️ back to top](#api)**

#### `isValid`

Returns a Boolean value of the changeset's validity.

```js
get(changeset, 'isValid'); // true
```

You can use this property in the template:

```hbs
{{#if changeset.isValid}}
  <p>Good job!</p>
{{/if}}
```

**[⬆️ back to top](#api)**

#### `isInvalid`

Returns a Boolean value of the changeset's (in)validity.

```js
get(changeset, 'isInvalid'); // true
```

You can use this property in the template:

```hbs
{{#if changeset.isInvalid}}
  <p>There were one or more errors in your form</p>
{{/if}}
```

**[⬆️ back to top](#api)**

#### `isPristine`

Returns a Boolean value of the changeset's state. A pristine changeset is one with no changes.

```js
get(changeset, 'isPristine'); // true
```

If changes present on the changeset are equal to the content's, this will return `true`. However, note that key/value pairs in the list of changes must all be present and equal on the content, but not necessarily vice versa:

```js
let user = { name: 'Bobby', age: 21, address: { zipCode: '10001' } };

changeset.set('name', 'Bobby');
changeset.get('isPristine'); // true

changeset.set('address.zipCode', '10001');
changeset.get('isPristine'); // true

changeset.set('foo', 'bar');
changeset.get('isPristine'); // false
```

**[⬆️ back to top](#api)**

#### `isDirty`

Returns a Boolean value of the changeset's state. A dirty changeset is one with changes.

```js
get(changeset, 'isDirty'); // true
```

**[⬆️ back to top](#api)**

#### `get`

Exactly the same semantics as `Ember.get`. This proxies first to the error value, the changed value, and finally to the underlying Object.

```js
get(changeset, 'firstName'); // "Jim"
set(changeset, 'firstName', 'Billy'); // "Billy"
get(changeset, 'firstName'); // "Billy"

get(changeset, 'address.zipCode'); // "10001"
set(changeset, 'address.zipCode', '94016'); // "94016"
get(changeset, 'address.zipCode'); // "94016"
```

You can use and bind this property in the template:

```hbs
{{input value=changeset.firstName}}
```

Fetching a key that is tied to an Object will return a sub-changeset:

```js
let subset = get(changeset, 'address');
get(subset, 'zipCode'); // "94016"
```

Because `ember-changeset` treats Objects as sub-changesets, you should always use `Ember.get` when expecting an Object. A sub-changeset proxies method calls to the original object:

```js
let momentDate = get(changeset, 'momentDate');
get(momentDate, 'format')('dddd'); // "Friday"
```

**[⬆️ back to top](#api)**

#### `set`

Exactly the same semantics as `Ember.set`. This stores the change on the changeset.

```js
set(changeset, 'firstName', 'Milton'); // "Milton"
set(changeset, 'address.zipCode', '10001'); // "10001"
```

You can use and bind this property in the template:

```hbs
{{input value=changeset.firstName}}
{{input value=changeset.address.country}}
```

Any updates on this value will only store the change on the changeset, even with 2 way binding.

**[⬆️ back to top](#api)**

#### `prepare`

Provides a function to run before emitting changes to the model. The callback function must return a hash in the same shape:

```js
changeset.prepare((changes) => {
  // changes = { firstName: "Jim", lastName: "Bob", 'address.zipCode': "07030" };
  let modified = {};

  for (let key in changes) {
    let newKey = key.split('.').map(underscore).join('.')
    modified[newKey] = changes[key];
  }

  // don't forget to return, the original changes object is not mutated
  // modified = { first_name: "Jim", last_name: "Bob", 'address.zip_code': "07030" };
  return modified;
}); // returns changeset
```

The callback function is **not validated** – if you modify a value, it is your responsibility to ensure that it is valid.

Returns the changeset.

**[⬆️ back to top](#api)**

#### `execute`

Applies the valid changes to the underlying Object.

```js
changeset.execute(); // returns changeset
```

Note that executing the changeset will not remove the internal list of changes - instead, you should do so explicitly with `rollback` or `save` if that is desired.

**[⬆️ back to top](#api)**

#### `save`

Executes changes, then proxies to the underlying Object's `save` method, if one exists. If it does, the method can either return a `Promise` or a non-`Promise` value. Either way, the changeset's `save` method will return
a promise.

```js
changeset.save(); // returns Promise
```

The `save` method will also remove the internal list of changes if the `save` is successful.

**[⬆️ back to top](#api)**

#### `merge`

Merges 2 changesets and returns a new changeset with the same underlying content and validator as the origin. Both changesets must point to the same underlying object. For example:

```js
let changesetA = new Changeset(user, validatorFn);
let changesetB = new Changeset(user, validatorFn);

changesetA.set('firstName', 'Jim');
changesetA.set('address.zipCode', '94016');

changesetB.set('firstName', 'Jimmy');
changesetB.set('lastName', 'Fallon');
changesetB.set('address.zipCode', '10112');

let changesetC = changesetA.merge(changesetB);
changesetC.execute();

user.get('firstName'); // "Jimmy"
user.get('lastName'); // "Fallon"
user.get('address.city'); // "10112"
```

Note that both changesets `A` and `B` are not destroyed by the merge, so you might want to call `destroy()` on them to avoid memory leaks.

**[⬆️ back to top](#api)**

#### `rollback`

Rollsback all unsaved changes and resets all errors.

```js
changeset.rollback(); // returns changeset
```

**[⬆️ back to top](#api)**

#### `validate`

Validates all or a single field on the changeset. This will also validate the property on the underlying object, and is a useful method if you require the changeset to validate immediately on render.

**Note:** This method requires a validation map to be passed in when the changeset is first instantiated.

```js
user.set('lastName', 'B');
user.set('address.zipCode', '123');

let validationMap = {
  lastName: validateLength({ min: 8 }),

  // specify nested keys with dot delimiters
  'address.zipCode': validateLength({ is: 5 }),

  // nested objects will also work
  address: {
    zipCode: validateLength({ is: 5 })
  }
};

let changeset = new Changeset(user, validatorFn, validationMap);
changeset.get('isValid'); // true

// validate single field; returns Promise
changeset.validate('lastName');
changeset.validate('address.zipCode');

// validate all fields; returns Promise
changeset.validate().then(() => {
  changeset.get('isInvalid'); // true

  // [{ key: 'lastName', validation: 'too short', value: 'B' },
  //  { key: 'address.zipCode', validation: 'too short', value: '123' }]
  changeset.get('errors');
});
```

**[⬆️ back to top](#api)**

#### `addError`

Manually add an error to the changeset.

```js
changeset.addError('email', {
  value: 'jim@bob.com',
  validation: 'Email already taken'
});

changeset.addError('address.zip', {
  value: '123',
  validation: 'Must be 5 digits'
});

// shortcut
changeset.addError('email', 'Email already taken');
changeset.addError('address.zip', 'Must be 5 digits');
```

Adding an error manually does not require any special setup. The error will be cleared if the value for the `key` is subsequently set to a valid value.  Adding an error will overwrite any existing error or change for `key`.

If using the shortcut method, the value in the changeset will be used as the value for the error.

**[⬆️ back to top](#api)**

#### `pushErrors`

Manually push errors to the changeset.

```js
changeset.pushErrors('age', 'Too short', 'Not a valid number', 'Must be greater than 18');
changeset.pushErrors('dogYears.age', 'Too short', 'Not a valid number', 'Must be greater than 2.5');
```

This is compatible with `ember-changeset-validations`, and allows you to either add a new error with multiple validation messages or push to an existing array of validation messages.

**[⬆️ back to top](#api)**

#### `snapshot`

Creates a snapshot of the changeset's errors and changes. This can be used to `restore` the changeset at a later time.

```js
let snapshot = changeset.snapshot(); // snapshot
```

**[⬆️ back to top](#api)**

#### `restore`

Restores a snapshot of changes and errors to the changeset. This overrides existing changes and errors.

```js
let user = { name: 'Adam', address: { country: 'United States' } };
let changeset = new Changeset(user, validatorFn);

changeset.set('name', 'Jim Bob');
changeset.set('address.country', 'North Korea');
let snapshot = changeset.snapshot();

changeset.set('name', 'Poteto');
changeset.set('address.country', 'Australia')

changeset.restore(snapshot);
changeset.get('name'); // "Jim Bob"
changeset.get('address.country'); // "North Korea"
```

**[⬆️ back to top](#api)**

#### `cast`

Unlike `Ecto.Changeset.cast`, `cast` will take an array of allowed keys and remove unwanted keys off of the changeset.

```js
let allowed = ['name', 'password', 'address.country'];
let changeset = new Changeset(user, validatorFn);

changeset.set('name', 'Jim Bob');
changeset.set('address.country', 'United States');

changeset.set('unwantedProp', 'foo');
changeset.set('address.unwantedProp', 123);
changeset.get('unwantedProp'); // "foo"
changeset.get('address.unwantedProp'); // 123

changeset.cast(allowed); // returns changeset
changeset.get('unwantedProp'); // undefined
changeset.get('address.country'); // "United States"
changeset.get('another.unwantedProp'); // undefined
```

For example, this method can be used to only allow specified changes through prior to saving. This is especially useful if you also setup a `schema` object for your model (using Ember Data), which can then be exported and used as a list of allowed keys:

```js
// models/user.js
export const schema = {
  name: attr('string'),
  password: attr('string')
};

export default Model.extend(schema);
```

```js
// controllers/foo.js
import { schema } from '../models/user';
const { keys } = Object;

export default Controller.extend({
  // ...

  actions: {
    save(changeset) {
      return changeset
        .cast(keys(schema))
        .save();
    }
  }
});
```

**[⬆️ back to top](#api)**

#### `isValidating`

Checks to see if async validator for a given key has not resolved.  If no key is provided it will check to see if any async validator is running.

```js
changeset.set('lastName', 'Appleseed');
changeset.set('firstName', 'Johnny');
changeset.set('address.city', 'Anchorage');
changeset.validate();

changeset.isValidating(); // true if any async validation is still running
changeset.isValidating('lastName'); // true if lastName validation is async and still running
changeset.isValidating('address.city'); // true if address.city validation is async and still running

changeset.validate().then(() => {
  changeset.isValidating(); // false since validations are complete
});
```

**[⬆️ back to top](#api)**

#### `beforeValidation`

This event is triggered after isValidating is set to true for a key, but before the validation is complete.

```js
changeset.on('beforeValidation', key => {
  console.log(`${key} is validating...`);
});
changeset.validate();
changeset.isValidating(); // true
// console output: lastName is validating...
// console output: address.city is validating...
```

**[⬆️ back to top](#api)**

#### `afterValidation`

This event is triggered after async validations are complete and isValidating is set to false for a key.

```js
changeset.on('afterValidation', key => {
  console.log(`${key} has completed validating`);
});
changeset.validate().then(() => {
  changeset.isValidating(); // false
  // console output: lastName has completed validating
  // console output: address.city has completed validating
});
```

**[⬆️ back to top](#api)**

## Validation signature

To use with your favorite validation library, you should create a custom `validator` action to be passed into the changeset:

```js
// application/controller.js
import Controller from '@ember/controller';

export default Controller.extend({
  actions: {
    validate({ key, newValue, oldValue, changes, content }) {
      // lookup a validator function on your favorite validation library
      // should return a Boolean
    }
  }
});
```

```hbs
{{! application/template.hbs}}
{{dummy-form changeset=(changeset model (action "validate"))}}
```

Your action will receive a single POJO containing the `key`, `newValue`, `oldValue`, a one way reference to `changes`, and the original object `content`.

## Handling Server Errors

When you run `changeset.save()`, under the hood this executes the changeset, and then runs the save method on your original content object, passing its return value back to you. You are then free to use this result to add additional errors to the changeset via the `addError` method, if applicable.

For example, if you are using an Ember Data model in your route, saving the changeset will save the model. If the save rejects, Ember Data will add errors to the model for you. To copy the model errors over to your changeset, add a handler like this:

```js
changeset.save()
  .then(() => { /* ... */ })
  .catch(() => {
    get(this, 'model.errors').forEach(({ attribute, message }) => {
      changeset.pushErrors(attribute, message);
    });
  });
```

## Detecting Changesets

If you're uncertain whether or not you're dealing with a `Changeset`, you can use the `isChangeset` util.

```js
import isChangeset from 'ember-changeset/utils/is-changeset';

if (isChangeset(model)) {
  model.execute();
  // other changeset-specific code...
}
```

## Plugins

- [`ember-changeset-validations`](https://github.com/poteto/ember-changeset-validations) - Pure, functional validations without CPs or Observers
- [`ember-changeset-cp-validations`](https://github.com/offirgolan/ember-changeset-cp-validations) - Work with `ember-cp-validations`
- [`ember-changeset-hofs`](https://github.com/nucleartide/ember-changeset-hofs) - Higher-order validation functions
- [`ember-bootstrap-changeset-validations`](https://github.com/kaliber5/ember-bootstrap-changeset-validations) - Adds support for changeset validations to `ember-bootstrap`

## Installation

* `git clone` this repository
* `npm install`

## Running

* `ember server`
* Visit your app at http://localhost:4200.

## Running Tests

* `npm test` (Runs `ember try:testall` to test your addon against multiple Ember versions)
* `ember test`
* `ember test --server`

## Building

* `ember build`

For more information on using ember-cli, visit [http://ember-cli.com/](http://ember-cli.com/).
