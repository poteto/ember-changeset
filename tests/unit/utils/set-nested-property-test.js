import setNestedProperty from 'ember-changeset/utils/set-nested-property';
import { module, test } from 'qunit';

module('Unit | Utility | set nested property');

[
  {
    desc: 'it rejects objects with malformed keys',
    obj: {
      '.foo': 'happy',
      '.foo.': 'freakin',
      '...baz': 'holidays',
    },
    key: 'foo',
    value: 42,
    actual: (obj, key, value) => () => setNestedProperty(obj, key, value),
    expected: /Assertion Failed: Object must not have keys with empty parts./,
    method: 'throws',
  },
  {
    desc: 'it deletes keys with `key` in their path',
    obj: {
      'foo': 'happy',
      'foo.bar': 'freakin',
      'foo.bar.baz': 'holidays',
    },
    key: 'foo',
    value: 42,
    actual: (obj, key, value) => {
      setNestedProperty(obj, key, value);
      return obj;
    },
    expected: {
      'foo': 42,
    },
    method: 'deepEqual',
  },
  {
    desc: "it doesn't delete keys that don't have `key` in their path",
    obj: {
      'foo': 'happy',
      'foobar': 'freakin',
      'foobar.baz': 'holidays',
    },
    key: 'foo',
    value: 42,
    actual: (obj, key, value) => {
      setNestedProperty(obj, key, value);
      return obj;
    },
    expected: {
      'foo': 42,
      'foobar': 'freakin',
      'foobar.baz': 'holidays',
    },
    method: 'deepEqual',
  },
  {
    desc: 'it leaves sibling keys alone',
    obj: {
      'foo': 'happy',
      'foo.bar': 'freakin',
      'foo.bar.baz': 'holidays',
      'foo.bar.qux': 'holidays',
    },
    key: 'foo.bar.baz',
    value: 'whoop',
    actual: (obj, key, value) => {
      setNestedProperty(obj, key, value);
      return obj;
    },
    expected: {
      'foo.bar.baz': 'whoop',
      'foo.bar.qux': 'holidays',
    },
    method: 'deepEqual',
  },
  {
    desc: 'deletes every key in the path leading up to `key`',
    obj: {
      'foo.bar.baz': 'holidays',
    },
    key: 'foo.bar.baz',
    value: 'whoop',
    actual: (obj, key, value) => {
      setNestedProperty(obj, key, value);
      return obj;
    },
    expected: {
      'foo.bar.baz': 'whoop',
    },
    method: 'deepEqual',
  },
].forEach(({ desc, obj, key, value, actual, expected, method }) => {
  test(`setNestedProperty - ${desc}`, function(assert) {
    assert[method](actual(obj, key, value), expected);
  });
});
