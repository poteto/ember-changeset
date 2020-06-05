import ObjectProxy from '@ember/object/proxy';
import ArrayProxy from '@ember/array/proxy';
import { typeOf } from '@ember/utils';

function isBelongsToRelationship(obj) {
  if (!obj) {
    return false;
  }

  if (obj.hasOwnProperty('content') &&
      obj.hasOwnProperty('isFulfilled') &&
      obj.hasOwnProperty('isRejected')) {
    // Async belongsTo()
    return true;
  }

  if ('isLoading' in obj &&
      'isLoaded' in obj &&
      'isNew' in obj &&
      'hasDirtyAttributes' in obj) {
    // Sync belongsTo()
    return true;
  }

  return false;
}

/**
 * This is used to indicate we dont want to break apart and iterate the object
 * However, it does not indicate the ability to getDeep and setDeep.
 *
 * @method isObject
 */
export default function isObject(val) {
  return val !== null &&
    (typeof val === 'object' || typeOf(val) === 'instance') &&
    !(val instanceof Date) &&
    !Array.isArray(val) &&
    !(val instanceof ObjectProxy) &&
    !(val instanceof ArrayProxy) &&
    !isBelongsToRelationship(val)
}

