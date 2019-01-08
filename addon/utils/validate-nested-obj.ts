import { assert } from '@ember/debug';

const { keys } = Object;

export default function validateNestedObj(label: string, obj: object): void {
  keys(obj).forEach(key => {
    key.split('.').forEach((_, i, allParts) => {
      if (i < allParts.length - 1) {
        let path = allParts.slice(0, i+1).join('.');
        let msg = `Object "${label}" may not have keys that override each other.`;
        assert(msg, !(path in obj));
      }
    });
  })
}
