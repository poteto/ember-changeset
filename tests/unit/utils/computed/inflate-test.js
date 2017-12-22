import inflate from 'ember-changeset/utils/computed/inflate';
import EmberObject from '@ember/object';
import { module, test } from 'qunit';

module('Unit | Utility | computed/inflate');

[
  {
    desc: 'precondition: keys must not overwrite each other',
    classDef: {
      changes: {
        'foo.bar.baz': 42,
        'foo.bar': 42,
        'foo': 42,
      },
      inflatedChanges: inflate('changes'),
    },
    actual: obj => () => obj.get('inflatedChanges'),
    expected: 'Assertion Failed: Path foo leading up to foo.bar.baz must be an Object if specified.',
    method: 'throws',
  },
  {
    desc: 'precondition: keys must not overwrite each other',
    classDef: {
      changes: {
        'foo.bar.baz': 42,
        'foo.bar': 42,
      },
      inflatedChanges: inflate('changes'),
    },
    actual: obj => () => obj.get('inflatedChanges'),
    expected: /Assertion Failed: Path foo.bar leading up to foo.bar.baz must be an Object if specified./,
    method: 'throws',
  },
  {
    desc: 'precondition: path leading up to key can be empty',
    classDef: {
      changes: {
        'foo.bar.baz': 42,
      },
      inflatedChanges: inflate('changes'),
    },
    actual: obj => obj.get('inflatedChanges'),
    expected: { foo: { bar: { baz: 42 } } },
    method: 'deepEqual',
  },
  {
    desc: 'it works',
    classDef: {
      changes: {
        'foo.bar.baz': 42,
        'foo.bar': {},
        'foo': {},
      },
      inflatedChanges: inflate('changes'),
    },
    actual: obj => obj.get('inflatedChanges'),
    expected: { foo: { bar: { baz: 42 } } },
    method: 'deepEqual',
  },
  {
    desc: "it doesn't overwrite sibling keys",
    classDef: {
      changes: {
        'foo.bar.baz': 42,
        'foo.bar.qux': 'hello',
        'foo.bar': {},
        'foo': {},
      },
      inflatedChanges: inflate('changes'),
    },
    actual: obj => obj.get('inflatedChanges'),
    expected: { foo: { bar: { baz: 42, qux: 'hello' } } },
    method: 'deepEqual',
  },
  {
    desc: 'it transforms values with an optional `transform` function',
    classDef: {
      changes: {
        'foo.bar.baz': { value: 42 },
        'foo.bar.qux': { value: 'hello' },
      },
      inflatedChanges: inflate('changes', obj => obj.value),
    },
    actual: obj => obj.get('inflatedChanges'),
    expected: { foo: { bar: { baz: 42, qux: 'hello' } } },
    method: 'deepEqual',
  },
].forEach(({ desc, classDef, actual, expected, method }) => {
  test(`inflate - ${desc}`, function(assert) {
    let Thing    = EmberObject.extend(classDef);
    let actually = actual(Thing.create());
    assert[method](actually, expected);
  });
});
