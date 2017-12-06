import Ember from 'ember';
import hasOwnNestedProperty from 'ember-changeset/utils/has-own-nested-property';
import { module, test, skip } from 'qunit';

module('Unit | Utility | has own nested property');

let subject = {
  a: {
    b: {
      c: true
    }
  }
};

let testData = [
  {
    desc: 'shallow known',
    path: 'a',
    expected: true
  },
  {
    desc: 'nested known',
    path: 'a.b',
    expected: true
  },
  {
    desc: 'deep known',
    path: 'a.b.c',
    expected: true
  },
  {
    desc: 'true suffix',
    path: 'a.b.c.true',
    expected: false
  },
  {
    desc: 'shallow unknown',
    path: 'b',
    expected: false
  },
  {
    desc: 'deep unknown',
    path: 'b.b.b.b',
    expected: false
  },
  {
    desc: 'dot suffix',
    path: 'a.',
    expected: false
  },
  {
    desc: 'dot prefix',
    path: '.a',
    expected: false
  },
  {
    desc: 'double dot',
    path: 'a..a',
    expected: false
  }
];

testData.forEach(function({ desc, path, expected }) {
  test(`${path}`, function(assert) {
    let msg = `${desc} ${path} in ${JSON.stringify(subject)}`.trim();
    assert.equal(hasOwnNestedProperty(subject, path), expected, msg);
  });
});
