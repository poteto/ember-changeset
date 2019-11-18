function isMergeableObject(value: any): Boolean {
  return isNonNullObject(value) && !isSpecial(value)
}

function isNonNullObject(value: any): Boolean {
  return !!value && typeof value === 'object'
}

function isSpecial(value: any): Boolean {
  var stringValue = Object.prototype.toString.call(value)

  return stringValue === '[object RegExp]' || stringValue === '[object Date]'
}

function emptyTarget(val: any): [] | {} {
	return Array.isArray(val) ? [] : {}
}

function cloneUnlessOtherwiseSpecified(value: any): any {
	return (isMergeableObject(value))
		? mergeDeep(emptyTarget(value), value)
		: value
}

function arrayMerge(target: any, source: any): object[] {
	return target.concat(source).map((item: any) => {
		return cloneUnlessOtherwiseSpecified(item)
	})
}

function getEnumerableOwnPropertySymbols(target: any): any {
	return Object.getOwnPropertySymbols
		? Object.getOwnPropertySymbols(target).filter(symbol => {
			return target.propertyIsEnumerable(symbol)
		})
		: []
}

function getKeys(target: any) {
	return Object.keys(target).concat(getEnumerableOwnPropertySymbols(target))
}

function propertyIsOnObject(object: any, property: any) {
	try {
		return property in object
	} catch(_) {
		return false
	}
}

// Protects from prototype poisoning and unexpected merging up the prototype chain.
function propertyIsUnsafe(target: any, key: string): Boolean {
  return propertyIsOnObject(target, key) // Properties are safe to merge if they don't exist in the target yet,
		&& !(Object.hasOwnProperty.call(target, key) // unsafe if they exist up the prototype chain,
    && Object.propertyIsEnumerable.call(target, key)) // and also unsafe if they're nonenumerable.
}

function mergeObject(target: any, source: any) {
	// var destination: { [k: string]: any } = {}
	// if (isMergeableObject(target)) {
	// 	getKeys(target).forEach(key => {
	// 		destination[key] = target[key];//cloneUnlessOtherwiseSpecified(target[key])
	// 	})
	// }
	getKeys(source).forEach(key => {
		if (propertyIsUnsafe(target, key)) {
			return;
		}

		if (propertyIsOnObject(target, key) && isMergeableObject(source[key])) {
			target[key] = mergeDeep(target[key], source[key]);
		} else {
			target[key] = source[key];// cloneUnlessOtherwiseSpecified(source[key])
		}
  });

	return target;
}

export default function mergeDeep(target: any, source: any) {
	var sourceIsArray = Array.isArray(source)
	var targetIsArray = Array.isArray(target)
	var sourceAndTargetTypesMatch = sourceIsArray === targetIsArray

	if (!sourceAndTargetTypesMatch) {
		return cloneUnlessOtherwiseSpecified(source)
	} else if (sourceIsArray) {
		return source;
	} else {
		return mergeObject(target, source)
	}
}
