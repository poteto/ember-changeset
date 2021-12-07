export default function requiresProxying(value: any): boolean {
  if (value === null) {
    return false;
  }
  return (typeof value === 'object')
    && !((value as any) instanceof Date); // we don't need to proxy a Date
}
