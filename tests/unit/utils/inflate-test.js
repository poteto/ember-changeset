import inflate from 'ember-changeset/utils/inflate';
import { module, test } from 'qunit';

module('Unit | Utility | computed/inflate');

[
  {
    desc: 'precondition: keys must not overwrite each other',
    obj: {
      'foo.bar.baz': 42,
      'foo.bar': 42,
      'foo': 42,
    },
    expected: 'Assertion Failed: Path foo leading up to foo.bar.baz must be an Object if specified.',
    error: true,
    method: 'throws',
  },
  {
    desc: 'precondition: keys must not overwrite each other',
    obj: {
      'foo.bar.baz': 42,
      'foo.bar': 42,
    },
    expected: /Assertion Failed: Path foo.bar leading up to foo.bar.baz must be an Object if specified./,
    error: true,
    method: 'throws',
  },
  {
    desc: 'precondition: path leading up to key can be empty',
    obj: {
      'foo.bar.baz': 42,
    },
    expected: { foo: { bar: { baz: 42 } } },
    method: 'deepEqual',
  },
  {
    desc: 'it works',
    obj: {
      'foo.bar.baz': 42,
      'foo.bar': {},
      'foo': {},
    },
    expected: { foo: { bar: { baz: 42 } } },
    method: 'deepEqual',
  },
  {
    desc: "it doesn't overwrite sibling keys",
    obj: {
      'foo.bar.baz': 42,
      'foo.bar.qux': 'hello',
      'foo.bar': {},
      'foo': {},
    },
    expected: { foo: { bar: { baz: 42, qux: 'hello' } } },
    method: 'deepEqual',
  },
  {
    desc: 'it transforms values with an optional `transform` function',
    obj: {
      'foo.bar.baz': { value: 42 },
      'foo.bar.qux': { value: 'hello' },
    },
    expected: { foo: { bar: { baz: 42, qux: 'hello' } } },
    transform: (e) => e.value,
    method: 'deepEqual',
  },
].forEach(({ desc, obj, expected, error = false, transform, method }) => {
  test(`inflate - ${desc}`, async function(assert) {
    if (error) {
      try {
        inflate(obj);
      } catch(e) {
        assert[method](e);
      }
    } else {
      let actually = inflate(obj, transform);
      assert[method](actually, expected);
    }
  });
});
