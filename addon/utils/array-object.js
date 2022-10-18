export function isArrayObject(obj) {
  if (!obj) return false;

  let maybeIndicies = Object.keys(obj);

  return maybeIndicies.every((key) => Number.isInteger(parseInt(key, 10)));
}

export function arrayToObject(array) {
  return array.reduce((obj, item, index) => {
    obj[index] = item;
    return obj;
  }, {});
}

export function objectToArray(obj) {
  let result = [];

  for (let [index, value] of Object.entries(obj)) {
    result[parseInt(index, 10)] = value;
  }

  return result;
}
