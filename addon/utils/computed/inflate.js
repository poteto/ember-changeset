// @flow

import { computed, get } from '@ember/object';
import deepSet from 'ember-deep-set';
import { assert, runInDebug } from '@ember/debug';
import isObject from 'ember-changeset/utils/is-object';

const { keys } = Object;

/**
 * Unflatten an object.
 */
export default function inflate(dependentKey /*: string */) /*: Object */ {
  return computed(dependentKey, function() {
    let obj /*: Object */ = get(this, dependentKey);
    runInDebug(() => {
      keys(obj).forEach(key => {
        key.split('.').forEach((_part, i, allParts) => {
          if (i < allParts.length - 1) {
            let path = allParts.slice(0, i+1).join('.');
            let msg = `Path ${path} leading up to ${key} must be an Object.`;
            assert(msg, isObject(obj[path]));
          }
        });
      });
    });

    let result = keys(obj)
      .sort()
      .reduce((inflatedObj, key) => {
        deepSet(inflatedObj, key, obj[key]);
        return inflatedObj;
      }, {});

    return result;
  }).readOnly();
}
