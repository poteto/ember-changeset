import traverseObj from 'ember-changeset/utils/traverse-obj';
import { module, test } from 'qunit';
import { check, gen, property } from 'ember-changeset/testcheck';
import { A as emberArray } from '@ember/array';
import flat from 'flat';
import { get } from '@ember/object';
import { expect } from 'chai';
import isObject from 'ember-changeset/utils/is-object';

module('Unit | Utility | traverse obj');

/**
 * Given a Generator, collect the values of the Generator into an array
 * and return the array.
 */
function collect(gen) {
  const a = [];
  for (const v of gen) a.push(v);
  return a;
}

/**
 * Define a reference implementation for traversing an object.
 */
function flatten(obj) {
  if (!isObject(obj)) return {};
  const pancake = flat(obj, { safe: true });

  // Ensure `pancake` has intermediary keys. For example, if `foo.bar.baz` is a
  // key, `pancake` should have `foo`, `foo.bar`, and `foo.bar.baz`.
  Object.keys(pancake).forEach(key => {
    key.split('.').forEach((_, i, parts) => {
      const key = parts.slice(0, i+1).join('.');
      if (!pancake.hasOwnProperty(key)) pancake[key] = get(obj, key);
    });
  });

  return pancake;
}

/**
 * Test if two values are deeply equal.
 *
 * @return {boolean}
 */
function deepEqual(actual, expected) {
  try {
    expect(actual).to.deep.equal(expected);
    return true;
  } catch (err) {
    return false;
  }
}

test('returned keys are unique', function(a) {
  const p = property(gen.JSON, json => {
    // json
    // |> traverseObj
    // |> collect
    // |> map(o => o.key)
    // |> emberArray
    const pairs = collect(traverseObj(json));
    const keys = emberArray(pairs.map(p => p.key));

    // Get rid of Ember array methods with `slice`.
    const actual = keys.slice();
    const expectedResult = keys.uniq().slice();
    return deepEqual(actual, expectedResult);
  });

  const output = check(p);
  console.log(output); // eslint-disable-line
  a.ok(output.result);
});

test('keys are correct', function(a) {
  const p = property(gen.JSON, json => {
    const pairs = collect(traverseObj(json));
    const keys = pairs.map(p => p.key);

    const actual = keys.sort();
    const expectedResult = Object.keys(flatten(json)).sort();
    return deepEqual(actual, expectedResult);
  });

  const output = check(p);
  console.log(output); // eslint-disable-line
  a.ok(output.result);
});

test('values are correct', function(a) {
  function actual(json) {
    const pairs = collect(traverseObj(json));
    const keys = pairs.map(p => p.key).sort();
    const values = keys.map(k => get(json, k));
    return values;
  }

  function expected(json) {
    const obj = flatten(json);
    const values = Object.keys(obj).sort().map(k => obj[k]);
    return values;
  }

  const p = property(gen.JSON, json => (
    deepEqual(actual(json), expected(json))
  ));

  const output = check(p);
  console.log(output); // eslint-disable-line
  a.ok(output.result);
});

// TODO: example test for circular dependencies
// TODO: example test for ember objects
