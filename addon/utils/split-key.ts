export default function splitKey(key: string): [string, string | null] {
  if (!key.split) {
    // key isn't a string
    return [key, null];
  }
  var firstKeyPart = key.split('.', 1)[0];
  var subKey = null;
  if (key.length > firstKeyPart.length) {
    subKey = key.substring(firstKeyPart.length + 1, key.length);
  }
  return [firstKeyPart, subKey];
}
