import Change from '../-private/change';

interface Options {
  safeGet: any
  safeSet: any
}

function isMergeableObject(value: any): Boolean {
  return isNonNullObject(value) && !isSpecial(value);
}

function isNonNullObject(value: any): Boolean {
  return !!value && typeof value === 'object';
}

function isSpecial(value: any): Boolean {
  let stringValue = Object.prototype.toString.call(value);

  return stringValue === '[object RegExp]' || stringValue === '[object Date]';
}

function getEnumerableOwnPropertySymbols(target: any): any {
  return Object.getOwnPropertySymbols
    ? Object.getOwnPropertySymbols(target).filter(symbol => {
      return target.propertyIsEnumerable(symbol)
    })
    : [];
}

function getKeys(target: any) {
  return Object.keys(target).concat(getEnumerableOwnPropertySymbols(target))
}

function propertyIsOnObject(object: any, property: any) {
  try {
    return property in object;
  } catch (_) {
    return false;
  }
}

// Protects from prototype poisoning and unexpected merging up the prototype chain.
function propertyIsUnsafe(target: any, key: string): Boolean {
  return propertyIsOnObject(target, key) // Properties are safe to merge if they don't exist in the target yet,
    && !(Object.hasOwnProperty.call(target, key) // unsafe if they exist up the prototype chain,
      && Object.propertyIsEnumerable.call(target, key)); // and also unsafe if they're nonenumerable.
}

/**
 * DFS - traverse depth first until find object with `value`.  Then go back up tree and try on next key
 * Need to exhaust all possible avenues.
 *
 * @method buildPathToValue
 */
function buildPathToValue(source: any, options: Options, kv: Record<string, any>, possibleKeys: string[]): Record<string, any> {
  Object.keys(source).forEach((key: string): void => {
    let possible = source[key];
    if (possible && possible.hasOwnProperty('value')) {
      possibleKeys.push(key);
      kv[possibleKeys.join('.')] = possible.value;
      return;
    }

    if (typeof possible === 'object') {
      possibleKeys.push(key);
      buildPathToValue(possible, options, kv, possibleKeys);
    }
  });

  return kv;
}

/**
 * `source` will always have a leaf key `value` with the property we want to set
 *
 * @method mergeTargetAndSource
 */
function mergeTargetAndSource(target: any, source: any, options: Options): any {
  getKeys(source).forEach(key => {
    // proto poisoning.  So can set by nested key path 'person.name'
    if (propertyIsUnsafe(target, key)) {
      // if safeSet, we will find keys leading up to value and set
      if (options.safeSet) {
        const kv: Record<string, any> = buildPathToValue(source, options, {}, []);
        // each key will be a path nested to the value `person.name.other`
        if (Object.keys(kv).length > 0) {
          // we found some keys!
          for (key in kv) {
            const val = kv[key];
            options.safeSet(target, key, val);
          }
        }
      }

      return;
    }

    // else safe key on object
    if (propertyIsOnObject(target, key) && isMergeableObject(source[key]) && !source[key].hasOwnProperty('value')) {
      target[key] = mergeDeep(options.safeGet(target, key), options.safeGet(source, key), options);
    } else {
      let next = source[key];
      if (next && next instanceof Change) {
        return target[key] = next.value;
      }

      // if just some normal leaf value, then set
      return target[key] = next;
    }
  });

  return target;
}

/**
 * goal is to mutate target with source's properties, ensuring we dont encounter
 * pitfalls of { ..., ... } spread syntax overwriting keys on objects that we merged
 *
 * This is also adjusted for Ember peculiarities.  Specifically `options.setPath` will allows us
 * to handle properties on Proxy objects (that aren't the target's own property)
 *
 * @method mergeDeep
 */
export default function mergeDeep(target: any, source: any, options: Options = { safeGet: undefined, safeSet: undefined }): object | [any] {
  options.safeGet = options.safeGet || function (obj: any, key: string): any { return obj[key] };
  options.safeSet = options.safeSet;
  let sourceIsArray = Array.isArray(source);
  let targetIsArray = Array.isArray(target);
  let sourceAndTargetTypesMatch = sourceIsArray === targetIsArray;

  if (!sourceAndTargetTypesMatch) {
    return source;
  } else if (sourceIsArray) {
    return source;
  } else {
    return mergeTargetAndSource(target, source, options);
  }
}
