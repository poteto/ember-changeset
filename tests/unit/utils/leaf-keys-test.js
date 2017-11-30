import leafKeys from 'ember-changeset/utils/leaf-keys';
import { module, test } from 'qunit';

import EmberObject from '@ember/object';

module('Unit | Utility | leaf-keys');

test('it returns an array with keys as nested strings', function(assert) {
  const nestedObject = {
    topValue: -1,
    item: {
      secondValue: 0,
      innerItem: {
        thing: 1,
        other: 2,
        nest: {
          thing: 3,
          other: 4
        }
      }
    }
  };

  const expectedResult = [
    'topValue',
    'item.secondValue',
    'item.innerItem.thing',
    'item.innerItem.other',
    'item.innerItem.nest.thing',
    'item.innerItem.nest.other',
  ];

  const result = leafKeys(nestedObject);

  assert.deepEqual(result, expectedResult, 'it returns an array with keys as nested strings');
});

test('it returns an array with keys as nested strings, can work with an ember object', function(assert) {
  const nestedObject = EmberObject.create({
    topValue: -1,
    item: EmberObject.create({
      secondValue: 0,
      innerItem: EmberObject.create({
        thing: 1,
        other: 2,
        nest: EmberObject.create({
          thing: 3,
          other: 4
        })
      })
    })
  });

  const expectedResult = [
    'topValue',
    'item.secondValue',
    'item.innerItem.thing',
    'item.innerItem.other',
    'item.innerItem.nest.thing',
    'item.innerItem.nest.other',
  ];

  const result = leafKeys(nestedObject);

  assert.deepEqual(result, expectedResult, 'it returns an array with keys as nested strings');
});

test('it returns an only keys that are available, even if they have no conect', function(assert) {
  const nestedObject = {
    topValue: -1,
    item: {
      secondValue: 0,
      innerItem: {
        thing: 1,
        other: 2,
        nest: null
      }
    }
  };

  const expectedResult = [
    'topValue',
    'item.secondValue',
    'item.innerItem.thing',
    'item.innerItem.other',
    'item.innerItem.nest',
  ];

  const result = leafKeys(nestedObject);

  assert.deepEqual(result, expectedResult, 'it returns an array with keys as nested strings');
});

test('it treats null and empty objects as null values', function(assert) {
  const nestedObject = {
    topValue: -1,
    item: {
      secondValue: 0,
      innerItem: {
        thing: 1,
        other: 2,
        empty: {},
        nest: Object.create(null),
        emberNest: EmberObject.create(null)
      }
    }
  };

  const expectedResult = [
    'topValue',
    'item.secondValue',
    'item.innerItem.thing',
    'item.innerItem.other',
    'item.innerItem.empty',
    'item.innerItem.nest',
    'item.innerItem.emberNest',
  ];

  const result = leafKeys(nestedObject);

  assert.deepEqual(result, expectedResult, 'it returns an array with keys as nested strings');
});

test('it skips object inside of arrays, and only returns the arrays key', function(assert) {
  const nestedObject = {
    topValue: -1,
    item: {
      secondValue: 0,
      innerItem: {
        thing: 1,
        other: 2,
        nest: [{
          a: 3
        }, {
          b: 4
        }]
      }
    }
  };

  const expectedResult = [
    'topValue',
    'item.secondValue',
    'item.innerItem.thing',
    'item.innerItem.other',
    'item.innerItem.nest',
  ];

  const result = leafKeys(nestedObject);

  assert.deepEqual(result, expectedResult, 'it returns an array with keys as nested strings');
});
