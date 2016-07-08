import Ember from 'ember';

const {
  assert,
  computed,
  get,
  isPresent
} = Ember;
const { keys } = Object;

export default function isEmptyObject(dependentKey) {
  assert('`dependentKey` must be defined', isPresent(dependentKey));

  return computed(dependentKey, function() {
    return keys(get(this, dependentKey)).length === 0;
  }).readOnly();
}
