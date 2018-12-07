import { computed, get } from '@ember/object';
import ComputedProperty from '@ember/object/computed';
import { isPresent } from '@ember/utils';
import { assert } from '@ember/debug';

const { keys } = Object;

export default function isEmptyObject(
  dependentKey: string
): ComputedProperty<boolean, boolean> {
  assert('`dependentKey` must be defined', isPresent(dependentKey));

  return computed(dependentKey, function() {
    return keys(get(this, dependentKey)).length === 0;
  }).readOnly();
}
