import Change from '../-private/change';

/**
 * TODO: consider
 * https://github.com/emberjs/ember.js/blob/822452c4432620fc67a777aba3b150098fd6812d/packages/%40ember/-internals/metal/lib/property_set.ts
 *
 * Handles both single path or nested string paths ('person.name')
 *
 * @method setDeep
 */
export default function setDeep(target: any, path: string, value: unknown): any {
  const keys = split(path).filter(isValidKey);
  // We will mutate target and through complex reference, we will mutate the orig
  let orig = target;

  if (keys.length === 1) {
    target[path] = value;
    return target;
  }

  for (let i = 0; i < keys.length; i++) {
    let prop = keys[i];

    const obj = isObject(target[prop]);
    if (!obj) {
      target[prop] = {};
    } else if (obj && target[prop] instanceof Change) {
      // we don't want to merge new changes with a Change instance higher up in the obj tree
      target[prop] = {};
    }

    // last iteration
    if (i === keys.length - 1) {
      result(target, prop, value);
      break;
    }

    // assign next level of object for next loop
    target = target[prop];
  }

  return orig;
}

// to avoid overwriting child keys of leaf node
function result(target: any, path: string, value: unknown) {
  target[path] = value;
}

function split(path: string): string[] {
  const keys = path.split('.');

  return keys;
}

function isValidKey(key: unknown) {
  return key !== '__proto__' && key !== 'constructor' && key !== 'prototype';
}

function isObject(val: unknown) {
  return val !== null && (typeof val === 'object' || typeof val === 'function');
}

// function isPlainObject(o: unknown): o is object {
//   return Object.prototype.toString.call(o) === '[object Object]';
// }
