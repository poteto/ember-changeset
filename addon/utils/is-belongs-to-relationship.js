// TODO: Get rid of this heuristic check by passing an option to the Changeset constructor
export function isBelongsToRelationship(obj) {
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

