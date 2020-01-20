export default function keyInObject(obj: any, key: string = ''): boolean {
  let [baseKey, ...keys] = key.split('.');

  if (!baseKey || !(baseKey in obj)) {
    return false;
  }

  if (!keys.length) {
    return !!(obj[baseKey]);
  }

  let value = obj[baseKey];
  if (value !== null && typeof value === 'object') {
    return keyInObject(obj[baseKey], keys.join('.'));
  }

  return false;
}
