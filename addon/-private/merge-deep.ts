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
	} catch(_) {
		return false;
	}
}

// Protects from prototype poisoning and unexpected merging up the prototype chain.
function propertyIsUnsafe(target: any, key: string): Boolean {
  return propertyIsOnObject(target, key) // Properties are safe to merge if they don't exist in the target yet,
		&& !(Object.hasOwnProperty.call(target, key) // unsafe if they exist up the prototype chain,
    && Object.propertyIsEnumerable.call(target, key)); // and also unsafe if they're nonenumerable.
}

let kv: { [k: string]: any } = {};
let possibleKeys: string[] = [];

/**
 * DFS - traverse depth first until find object with `value`.  Then go back up tree and try on next key
 * need to exhaust all possible avenues.
 *
 * @method buildPathToValue
 */
function buildPathToValue(source: any, options: Options): void {
  Object.keys(source).forEach((key: string): void => {
    let possible = source[key];
    if (possible && possible.hasOwnProperty('value')) {
      possibleKeys.push(key);
      kv[possibleKeys.join('.')] = possible.value;
      possibleKeys = [];
      return;
    }

    if (typeof possible === 'object') {
      possibleKeys.push(key);
      buildPathToValue(possible, options);
    } else {
      possibleKeys = [];
    }
  });
}

/**
 * `source` will always have a leaf key `value` with the proeprty we want to set
 * @method mergeObject
 */
function mergeObject(target: any, source: any, options: Options) {
	getKeys(source).forEach(key => {
    // proto poisoning.  So can set by nested key path 'person.name'
		if (propertyIsUnsafe(target, key)) {
      if (options.safeSet) {
        buildPathToValue(source, options);
        if (Object.keys(kv).length > 0) {
          // we found some keys!
          for (key in kv) {
            const val = kv[key];
            options.safeSet(target, key, val);
          }
        }

        kv = {};
      }

			return;
		}

    // else safe key on object
		if (propertyIsOnObject(target, key) && isMergeableObject(source[key]) && !source[key].hasOwnProperty('value')) {
			target[key] = mergeDeep(options.safeGet(target, key), options.safeGet(source, key), options);
		} else {
      return target[key] = source[key].value;
		}
  });

	return target;
}

/**
 * goal is to mutate target with source's properties, ensuring we dont encounter
 * pitfalls of { ..., ... } spread syntax overwriting keys on objects that we merged
 *
 * @method mergeDeep
 * @param target
 * @param source
 */
export default function mergeDeep(target: any, source: any, options: Options = { safeGet: undefined, safeSet: undefined }): object | [any] {
	options['safeGet'] = options.safeGet || function(obj: any, key: string): any { return obj[key] };
	options['safeSet'] = options.safeSet;
	let sourceIsArray = Array.isArray(source);
	let targetIsArray = Array.isArray(target);
	let sourceAndTargetTypesMatch = sourceIsArray === targetIsArray;

	if (!sourceAndTargetTypesMatch) {
		return source;
	} else if (sourceIsArray) {
		return source;
	} else {
		return mergeObject(target, source, options);
	}
}
