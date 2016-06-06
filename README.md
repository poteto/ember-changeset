# ember-changeset [![Build Status](https://travis-ci.org/DockYard/ember-changeset.svg?branch=master)](https://travis-ci.org/DockYard/ember-changeset) [![npm version](https://badge.fury.io/js/ember-changeset.svg)](https://badge.fury.io/js/ember-changeset) [![Ember Observer Score](http://emberobserver.com/badges/ember-changeset.svg)](http://emberobserver.com/addons/ember-changeset)

Changesets for Ember.js, inspired by [Ecto](https://github.com/elixir-lang/ecto). To install:

```
ember install ember-changeset
```

## Philosophy

The idea behind a changeset is simple: it represents a set of validated changes to be applied onto any Object. Each change is tested against an optional validation, and if the change is valid, the change is applied when executed. Given Ember's Data Down, Actions Up (DDAU) approach, a changeset is more appropriate compared to implicit 2 way bindings, and allows you to selectively apply changes against a given object.

This addon is designed to be un-opinionated about your choice of form and/or validation library.

## Usage

First, create a `Changeset` using the `changeset` helper:

```hbs
{{! application/template.hbs}}
{{dummy-form
    changeset=(changeset model (action "validate"))
    submit=(action "submit")
    rollback=(action "rollback")
}}
```

The helper receives any Object (including `DS.Model`, `Ember.Object`, or even POJOs) and an optional `validator` action. If a `validator` is passed into the helper, the changeset will attempt to call that function when a value changes.

```js
// application/controller.js
import Ember from 'ember';

const { Controller } = Ember;

export default Controller.extend({
  actions: {
    submit(changeset) {
      return changeset
        .execute()
        .save();
    },

    rollback(changeset) {
      return changeset.rollback();
    },

    validate(key, newValue, oldValue) {
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

## API

TODO

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
