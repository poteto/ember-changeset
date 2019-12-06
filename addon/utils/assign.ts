// keep getters and setters
export default function pureAssign(...objects: object[]): object {
  return objects.reduce((acc, obj) => {
    return Object.defineProperties(acc, Object.getOwnPropertyDescriptors(obj));
  }, {});
}
