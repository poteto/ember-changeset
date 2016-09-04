export default function take(originalObj = {}, keysToTake = []) {
  let newObj = {};

  for (let key in originalObj) {
    if (keysToTake.indexOf(key) !== -1) {
      newObj[key] = originalObj[key];
    }
  }

  return newObj;
}
