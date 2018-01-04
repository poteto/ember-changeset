// @flow

import { computed, get } from '@ember/object';
import deepSet from 'ember-deep-set';
import { assert, runInDebug } from '@ember/debug';
import isObject from 'ember-changeset/utils/is-object';
import { isBlank } from '@ember/utils';

const { keys } = Object;

/**
 * Inflate an Object, optionally transforming each key's value by
 * `transform` function.
 */
export default function inflate /*:: <T> */ (
  dependentKey /*: string       */,
  transform    /*: (T) => mixed */ = a => a
) /*: Object */ {
  return computed(dependentKey, function() {
    let obj /*: Object */ = get(this, dependentKey);

    runInDebug(() => {
      keys(obj).forEach(key => {
        key.split('.').forEach((_part, i, allParts) => {
          if (i < allParts.length - 1) {
            let path = allParts.slice(0, i+1).join('.');
            let msg = `Path ${path} leading up to ${key} must be an Object if specified.`;
            assert(msg, isObject(obj[path]) || isBlank(obj[path]));
          }
        });
      });
    });

    let result = keys(obj)
      .sort()
      .reduce((inflatedObj, key) => {
        deepSet(inflatedObj, key, transform(obj[key]));
        return inflatedObj;
      }, {});

    return result;
  }).readOnly();
}
