export default function take(
  originalObj: { [key: string]: any } = {},
  keysToTake: string[] = []
): { [key: string]: any } {
  let newObj: { [key: string]: any } = {};

  for (let key in originalObj) {
    if (keysToTake.indexOf(key) !== -1) {
      newObj[key] = originalObj[key];
    }
  }

  return newObj;
}
