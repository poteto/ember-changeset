import { module, test } from 'qunit';
import {
  check,
  gen,
  property,
  sampleOne
} from 'ember-changeset/testcheck';
import deepSet from 'ember-deep-set';
import Ember from 'ember';
const { get } = Ember;

module('Property | Utility | changeset');

test('examples', function(assert) {
  assert.expect(0);

  /*
  {
    let result = check(property(gen.int, x => (
      x - x === 0
    )));

    console.log(result);
  }

  {
    // let result = check(property(gen.int, gen.int, (a, b) => (
    let result = check(property(gen.posInt, gen.posInt, (a, b) => (
      a + b >= a && a + b >= b
    )));

    console.log(result);
  }

  function* rng(n) {
    while (n--) yield sampleOne(gen.int)
  }

  for (let i of rng(3)) console.log(i);

  {
    let result = check(
      property(
        gen.asciiString.notEmpty().then(
          str => (
            gen.array([str, gen.substring(str).notEmpty()])
          )
        ),
        ([str, separator]) => (
          str.split(separator).length === 1
        )
      )
    );

    console.log(result);
  }

  console.log('json:', sampleOne(gen.JSON));
  console.log('nested:', sampleOne(gen.nested(gen.object, gen.JSON)));
 */
});

test('deepSet can set anything', function(assert) {
  assert.expect(2 * 100);

  let canSetAnything = property(gen.JSON, gen.string.notEmpty(), gen.JSON, (j1, key, j2) => {
    if (key[0] === '.') key = key.slice(1);
    console.log(`testing:`, j1, key, j2);

    deepSet(j1, key, j2);
    assert.equal(get(j1, key), j2);

    let o = Ember.Object.create(j1);
    deepSet(o, key, j2);
    assert.equal(get(o, key), j2);
  });

  let result = check(canSetAnything);
  console.log(result);
});
