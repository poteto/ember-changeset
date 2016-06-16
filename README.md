# ember-changeset [![Build Status](https://travis-ci.org/poteto/ember-changeset.svg?branch=master)](https://travis-ci.org/poteto/ember-changeset) [![npm version](https://badge.fury.io/js/ember-changeset.svg)](https://badge.fury.io/js/ember-changeset) [![Ember Observer Score](http://emberobserver.com/badges/ember-changeset.svg)](http://emberobserver.com/addons/ember-changeset)

Ember.js flavored changesets, inspired by [Ecto](https://github.com/elixir-lang/ecto). To install:

```
ember install ember-changeset
```

## Philosophy

The idea behind a changeset is simple: it represents a set of valid changes to be applied onto any Object (`Ember.Object`, `DS.Model`, POJOs, etc). Each change is tested against an optional validation, and if valid, the change is stored and applied when executed. 

Given Ember's Data Down, Actions Up (DDAU) approach, a changeset is more appropriate compared to implicit 2 way bindings. Other validation libraries only validate a property *after* it is set on an Object, which means that your Object can enter an invalid state.

`ember-changeset` only allows valid changes to be set, so your Objects will never become invalid (assuming you have 100% validation coverage). Additionally, this addon is designed to be un-opinionated about your choice of form and/or validation library, so you can easily integrate it into an existing solution.

The simplest way to incorporate validations is to use [`ember-changeset-validations`](https://github.com/poteto/ember-changeset-validations/), a companion addon to this one. It has a simple mental model, and there are no Observers or CPs involved – just pure functions.

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
{{dummy-form
    changeset=(changeset model (action "validate"))
    submit=(action "submit")
    rollback=(action "rollback")
}}
```

```js
import Ember from 'ember';
import Changeset from 'ember-changeset';

const { Component, get } = Ember;

export default Component.extend({
  init() {
    let model = get(this, 'model');
    let validator = get(this, 'validate');
    this.changeset = new Changeset(model, validator);
  }
});
```

The helper receives any Object (including `DS.Model`, `Ember.Object`, or even POJOs) and an optional `validator` action. If a `validator` is passed into the helper, the changeset will attempt to call that function when a value changes.

```js
// application/controller.js
import Ember from 'ember';

const { Controller } = Ember;

export default Controller.extend({
  actions: {
    submit(changeset) {
      return changeset.save();
    },

    rollback(changeset) {
      return changeset.rollback();
    },

    validate({ key, newValue, oldValue, changes }) {
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

## API

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

You can use this property to locate a single error:

```hbs
{{#if changeset.error.firstName}}
  <p>{{changeset.error.firstName.validation}}</p>
{{/if}}
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

#### `change`

Returns the change object.

```js
{
  firstName: 'Jim'
}
```

You can use this property to locate a single change:

```hbs
{{#if changeset.change.firstName}}
  <p>You changed {{changeset.firstName}} to {{changeset.change.firstName}}!</p>
{{/if}}
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

#### `isPristine`

Returns a Boolean value of the changeset's state. A pristine changeset is one with no changes.

```js
get(changeset, 'isPristine'); // true
```

**[⬆️ back to top](#api)**

#### `isDirty`

Returns a Boolean value of the changeset's state. A dirty changeset is one with changes.

```js
get(changeset, 'isDirty'); // true
```

**[⬆️ back to top](#api)**

#### `get`

Exactly the same semantics as `Ember.get`. This proxies to the underlying Object.

```js
get(changeset, 'firstName'); // "Jim"
```

You can use and bind this property in the template:

```hbs
{{input value=changeset.firstName}}
```

**[⬆️ back to top](#api)**

#### `set`

Exactly the same semantics as `Ember.set`. This stores the change on the changeset.

```js
set(changeset, 'firstName', 'Milton'); // "Milton"
```

You can use and bind this property in the template:

```hbs
{{input value=changeset.firstName}}
```

Any updates on this value will only store the change on the changeset, even with 2 way binding.

**[⬆️ back to top](#api)**

#### `execute`

Applies the valid changes to the underlying Object.

```js
changeset.execute(); // returns changeset
```

Note that executing the changeset will not remove the internal list of changes - instead, you should do so explicitly with `rollback` or `save` if that is desired.

**[⬆️ back to top](#api)**

#### `save`

Executes changes, then proxies to the underlying Object's `save` method, if one exists. If it does, it expects the method to return a `Promise`.

```js
changeset.save(); // returns Promise
```

The `save` method will also remove the internal list of changes if the `save` is successful.

**[⬆️ back to top](#api)**

#### `rollback`

Rollsback all unsaved changes and resets all errors.

```js
changeset.rollback(); // returns changeset
```

**[⬆️ back to top](#api)**

#### `merge`

Merges 2 valid changesets and returns a new changeset with the same underlying content and validator as the origin. Both changesets must point to the same underlying object. For example:

```js
let changesetA = new Changeset(user, validatorFn);
let changesetB = new Changeset(user, validatorFn);
changesetA.set('firstName', 'Jim');
changesetB.set('firstName', 'Jimmy');
changesetB.set('lastName', 'Fallon');
let changesetC = changesetA.merge(changesetB);
changesetC.execute();
user.get('firstName'); // "Jimmy"
user.get('lastName'); // "Fallon"
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

Validates all or a single field on the changeset. This will also validate the property on the underlying object, and is a useful method if you require the changeset to validate immediately on render. Requires a validation map to be passed in when the changeset is first instantiated.

```js
user.set('lastName', 'B');
changeset.get('isValid'); // true
changeset.validate('lastName'); // validate single field; returns Promise
changeset.validate().then(() => {
  changeset.get('isInvalid'); // true
  changeset.get('errors'); // [{ key: 'lastName', validation: 'too short', value: 'B' }]
}); // validate all fields; returns Promise
```

**[⬆️ back to top](#api)**

## Validation signature

To use with your favorite validation library, you should create a custom `validator` action to be passed into the changeset:

```js
// application/controller.js
import Ember from 'ember';

const { Controller } = Ember;

export default Controller.extend({
  actions: {
    validate({ key, newValue, oldValue, changes }) {
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

Your action will receive a single POJO containing the `key`, `newValue`, `oldValue` and a one way reference to `changes`.

## Installation

* `git clone` this repository
* `npm install`
* `bower install`

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
