import leafKeys from 'ember-changeset/utils/leaf-keys';
import { module, test } from 'qunit';

import EmberObject from '@ember/object';

module('Unit | Utility | leaf-keys');

const TEST_DATA = [{
  desc: 'it returns an array with keys as nested strings',
  input: {
    topValue: -1,
    item: {
      secondValue: 0,
      innerItem: {
        thing: 1,
        other: '2222',
        nest: {
          thing: 3,
          other: 4
        }
      }
    },
  },
  expected: [
    'topValue',
    'item.secondValue',
    'item.innerItem.thing',
    'item.innerItem.other',
    'item.innerItem.nest.thing',
    'item.innerItem.nest.other',
  ],
}, {
  desc: 'it returns an array with keys as nested strings, can work with an ember object',
  input: EmberObject.create({
    topValue: -1,
    item: EmberObject.create({
      secondValue: 0,
      innerItem: EmberObject.create({
        thing: 1,
        other: '2222',
        nest: EmberObject.create({
          thing: 3,
          other: 4
        })
      })
    })
  }),
  expected: [
    'topValue',
    'item.secondValue',
    'item.innerItem.thing',
    'item.innerItem.other',
    'item.innerItem.nest.thing',
    'item.innerItem.nest.other',
  ],
}, {
  desc: 'it returns an only keys that are available, even if they have no conect',
  input: {
    topValue: -1,
    item: {
      secondValue: 0,
      innerItem: {
        thing: 1,
        other: '2222',
        nest: null
      }
    },
  },
  expected: [
    'topValue',
    'item.secondValue',
    'item.innerItem.thing',
    'item.innerItem.other',
    'item.innerItem.nest',
  ],
}, {
  desc: 'it treats null and empty objects as null values',
  input: {
    topValue: -1,
    item: {
      secondValue: 0,
      innerItem: {
        thing: 1,
        other: '2222',
        empty: {},
        nest: Object.create(null),
        emberNest: EmberObject.create(null)
      }
    }
  },
  expected: [
    'topValue',
    'item.secondValue',
    'item.innerItem.thing',
    'item.innerItem.other',
    'item.innerItem.empty',
    'item.innerItem.nest',
    'item.innerItem.emberNest',
  ],
}, {
  desc: 'it skips object inside of arrays, and only returns the arrays key',
  input: {
    topValue: -1,
    item: {
      secondValue: 0,
      innerItem: {
        thing: 1,
        other: '2222',
        nest: [{
          a: 3
        }, {
          b: 4
        }]
      }
    }
  },
  expected: [
    'topValue',
    'item.secondValue',
    'item.innerItem.thing',
    'item.innerItem.other',
    'item.innerItem.nest',
  ],
}, {
  desc: 'it can hanlde null created objects',
  input: nullCreatedObjects(),
  expected: [
    'topValue',
    'item.secondValue',
    'item.innerItem.thing',
    'item.innerItem.other',
    'item.innerItem.nest.thing',
    'item.innerItem.nest.other',
  ],
}];

function nullCreatedObjects() {
  const input = Object.create(null);
  const item = Object.create(null);
  const innerItem = Object.create(null);
  const nest = Object.create(null);

  input.topValue = -1;
  input.item = item;
    item.secondValue = 0;
    item.innerItem = innerItem;
      innerItem.thing = 1;
      innerItem.other = '2222';
      innerItem.nest = nest;
        nest.thing = 3;
        nest.other = 4;

  return input;
}

TEST_DATA.forEach(function({ desc, input, expected }) {
  test(desc, function(assert) {
    assert.deepEqual(leafKeys(input), expected, desc);
  });
});
