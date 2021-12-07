export default function isUnchanged(a: any, b: any) {
  if ((a instanceof Date) && (b instanceof Date)) {
    return (a as Date).getTime() === (b as Date).getTime();
  }
  return a === b;
}

