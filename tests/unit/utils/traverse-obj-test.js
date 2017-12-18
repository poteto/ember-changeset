import traverseObj from 'ember-changeset/utils/traverse-obj';
import { module, test } from 'qunit';
import { check, gen, property } from 'ember-changeset/testcheck';
import { A as emberArray } from '@ember/array';

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

test('returned keys are unique', function(a) {
  a.expect(100 + 1);

  const p = property(gen.JSON, json => {
    // keys = json
    //   |> traverseObj
    //   |> collect
    //   |> map(o => o.key)
    //   |> emberArray
    const pairs = collect(traverseObj(json));
    const keys = emberArray(pairs.map(p => p.key));

    const actual = keys;
    const expectedResult = keys.uniq();
    a.deepEqual(actual, expectedResult);
  });

  const { result } = check(p);
  a.ok(result);
});

test('keys are correct', function(a) {
  a.expect(0);
});

test('values are correct', function(a) {
  a.expect(0);
});
