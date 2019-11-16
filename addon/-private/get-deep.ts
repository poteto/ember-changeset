export default function getDeep<T extends object>(root: T, path: string | string[]): any {
  let obj: any = root;

  if (path.indexOf('.') === -1) {
    return obj[path as string];
  }
  let parts = typeof path === 'string' ? path.split('.') : path;

  for (let i = 0; i < parts.length; i++) {
    if (obj === undefined || obj === null) {
      return undefined;
    }

    obj = obj[parts[i]];
  }

  return obj;
}
