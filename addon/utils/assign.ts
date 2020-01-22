let getOwnPropertyDescriptors: (obj: { [x: string]: any }) => { [x: string]: PropertyDescriptor };

if (Object.getOwnPropertyDescriptors !== undefined) {
  getOwnPropertyDescriptors = Object.getOwnPropertyDescriptors;
} else {
  getOwnPropertyDescriptors = function(obj: object) {
    let desc: Record<string, any> = {};

    Object.keys(obj).forEach(key => {
      desc[key] = Object.getOwnPropertyDescriptor(obj, key);
    });

    return desc;
  };
}


// keep getters and setters
export default function pureAssign(...objects: object[]): object {
  return objects.reduce((acc, obj) => {
    return Object.defineProperties(acc, getOwnPropertyDescriptors(obj));
  }, {});
}
