/* eslint-env node */
'use strict';

const emberRollup = require('ember-rollup');
const runtimeDeps = ['testcheck'];

module.exports = emberRollup(runtimeDeps, {
  name: 'ember-changeset'
});
