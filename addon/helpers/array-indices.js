import Ember from 'ember';

const { typeOf } = Ember;

export function arrayIndices([array]) {
  if(typeOf(array._length) === 'function'){
    const length = array._length();
    if(typeOf(length) === 'number' && length >= 0){
      const indices = [...Array(length).keys()].map(n => String(n));
      return indices;
    }
  }
}

export default Ember.Helper.helper(arrayIndices);
