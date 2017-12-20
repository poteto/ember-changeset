// @flow

export default function take(
  originalObj /*: Object */ = {},
  keysToTake /*: Array<string> */ = []
) {
  let newObj = {};

  for (let key in originalObj) {
    if (keysToTake.indexOf(key) !== -1) {
      newObj[key] = originalObj[key];
    }
  }

  return newObj;
}
