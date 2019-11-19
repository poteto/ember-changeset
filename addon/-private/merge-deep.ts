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

function mergeObject(target: any, source: any, options: any) {
	getKeys(source).forEach(key => {
		if (propertyIsUnsafe(target, key)) {
			return;
		}

		if (propertyIsOnObject(target, key) && isMergeableObject(source[key])) {
			target[key] = mergeDeep(options.safeGet(target, key), options.safeGet(source, key), options);
		} else {
			target[key] = source[key];
		}
  });

	return target;
}

interface Options {
  safeGet: any
}

/**
 * goal is to mutate target with source's properties, ensuring we dont encounter
 * pitfalls of { ..., ... } spread syntax overwriting keys on objects that we merged
 *
 * @method mergeDeep
 * @param target
 * @param source
 */
export default function mergeDeep(target: any, source: any, options: Options): object | [any] {
	options.safeGet = options.safeGet || function(obj: any, key: string): any { return obj[key] };
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
