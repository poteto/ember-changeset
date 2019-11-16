export default function setDeep(target: any, path: string, value: unknown) {
  const keys = split(path).filter(isValidKey);

  if (keys.length === 1) {
    result(target, keys[0], value);
    return target;
  }

  for (let i = 0; i < keys.length; i++) {
    let prop = keys[i];

    if (!isObject(target[prop])) {
      target[prop] = {};
    }

    if (i === keys.length - 1) {
      result(target, prop, value);
      break;
    }

    target = target[prop];
  }

  return target;
}

function result(target: any, path: string, value: unknown) {
  if (isPlain(target[path]) && isPlain(value)) {
    target[path] = Object.assign({}, target[path], value);
  } else {
    target[path] = value;
  }
}

function split(path: string): string[] {
  const keys = path.split('.');

  return keys;
}

function isValidKey(key: unknown) {
  return key !== '__proto__' && key !== 'constructor' && key !== 'prototype';
}

function isObject(val: unknown) {
  return val !== null && (typeof val === 'object' || typeof val === 'function');
}

function isPlain(o: unknown) {
  return Object.prototype.toString.call(o) === '[object Object]';
}
