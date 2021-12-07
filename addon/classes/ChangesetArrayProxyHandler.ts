import ArrayProxy from '@ember/array/proxy';
import { action } from '@ember/object';
import { A } from '@ember/array';
import { TrackedMap } from 'tracked-maps-and-sets';
import IChangesetProxyHandler from './IChangesetProxyHandler';
import ProxyOptions from './ProxyOptions';
import { ProxyArrayValueKey } from 'ember-changeset/utils/symbols';

type Input = any[] | ArrayProxy<any>;

export default class ChangesetArrayProxyHandler<T extends Input> implements IChangesetProxyHandler<T> {
  constructor(source: T, _options?: ProxyOptions) {
    if (source?.constructor?.name === 'ArrayProxy') {
      this.__sourceProxy = source as ArrayProxy<any>;
      this.__source = (source as ArrayProxy<any>).toArray();
    } else {
      // wrap the array so it's tracked
      this.__source = A(source as []);
    }
  }

  public get(_target: T, key: string): any {
    // extra stuff
    switch (key) {
      case 'at': return this.at;
      case 'concat': return this.readArray.concat;
      case 'length': return this.readArray.length;
      case 'copyWithin': return this.writeArray.copyWithin;
      case 'entries': return this.readArray.entries;
      case 'every': return this.readArray.every;
      case 'fill': return this.writeArray.fill;
      case 'filter': return this.readArray.filter;
      case 'find': return this.readArray.find;
      case 'findIndex': return this.readArray.findIndex;
      case 'flat': return this.readArray.flat;
      case 'flatMap': return this.readArray.flatMap;
      case 'forEach': return this.readArray.forEach;
      case 'includes': return this.readArray.includes;
      case 'indexOf': return this.readArray.indexOf;
      case 'join': return this.readArray.join;
      case 'keys': return this.readArray.keys;
      case 'lastIndexOf': return this.readArray.lastIndexOf;
      case 'map': return this.readArray.map;
      case 'pop': return this.writeArray.pop;
      case 'push': return this.writeArray.push;
      case 'reduce': return this.readArray.reduce;
      case 'reduceRight': return this.readArray.reduceRight;
      case 'reverse': return this.writeArray.reverse;
      case 'shift': return this.writeArray.shift;
      case 'slice': return this.readArray.slice;
      case 'some': return this.readArray.some;
      case 'sort': return this.writeArray.sort;
      case 'splice': return this.writeArray.splice;
      case 'toLocaleString': return this.readArray.toLocaleString;
      case 'toString': return this.readArray.toString;
      case 'unshift': return this.writeArray.unshift;
      case 'values': return this.readArray.values;

      case 'change': return this.change;
      case 'changes': return this.changes;
      case 'data': return this.__source;
      case 'execute': return this.execute;
      case 'get': return this.getValue;
      case 'isChangeset': return true;
      case 'isDirty': return this.isDirty;
      case 'isPristine': return this.isPristine;
      case 'isValid': return this.isValid;
      case 'pendingData': return this.pendingData;
      case 'rollback': return this.rollback;
      case 'save': return this.save;
      case 'set': return this.setValue;
      case 'validate': return this.validate;
      default: return this.getValue(key);
    }
  }

  public set(_target: T, key: string, value: any): any {
    return this.setValue(key, value);
  }

  public readonly isChangeset = true;

  public get isDirty(): boolean {
    // we're dirty if either we have top level changes
    // or if a nested proxy is dirty
    return (this.__proxyArray !== undefined);
  }

  public get isPristine(): boolean {
    return (this.__proxyArray === undefined);
  }

  public get isValid(): boolean {
    // TODO: validate this level

    // now look at all the nested proxies
    for (var proxy of this.__nestedProxies.values()) {
      if (!proxy.isValid) {
        return false;
      }
    }
    return true;
  }

  public get pendingData(): { [index: string]: any } {
    var result = {
      ProxyArrayValueKey: this.readArray
    }
    return result;
  }

  @action
  public at(index: number) {
    // is it an existing proxy?
    if (this.__nestedProxies.has(index)) {
      // todo deal with the length of the array changing
      return this.__nestedProxies.get(index);
    } else {
      return this.readArray[index];
    }
  }

  @action
  public getValue(key: string | symbol) {
    switch (key) {
      // backwards compatible
      // changeset.get('isValid');
      case 'change': return this.change;
      case 'changes': return this.changes;
      case 'data': return this.__source;
      case 'isChangeset': return true;
      case 'isDirty': return this.isDirty;
      case 'isPristine': return this.isPristine;
      case 'isValid': return this.isValid;
      case 'length': return this.readArray.length;
      case 'pendingData': return this.pendingData;
    }
    if (typeof key === 'symbol') {
      return undefined;
    }
    return this.readArray[parseInt(key)];
  }

  private get readArray(): any[] {
    return this.__proxyArray === undefined ?
      this.__source
      : this.__proxyArray;
  }

  private get writeArray(): any[] {
    if (this.__proxyArray === undefined) {
      this.__proxyArray = A(this.__source);
    }
    return this.__proxyArray;
  }

  @action
  public setValue(key: string, _value: any): boolean {
    switch (key) {
      case 'change':
      case 'changes':
      case 'data':
      case 'isChangeset':
      case 'isDirty':
      case 'isPristine':
      case 'isValid':
      case 'pendingData':
        throw `changeset.${key} is readonly`;
    }
    debugger;
    return true;
    // // nested keys are separated by dots
    // var [localKey, subkey] = splitKey(key as string);

    // if (subkey) {
    //   // pass the change down to a nested level
    //   var proxy = this.__nestedProxies.get(localKey);
    //   if (!proxy) {
    //     // no existing proxy
    //     // so they're trying to set deep into an object that isn't yet proxied
    //     // wrap the existing object or create an empty one
    //     proxy = this.addProxy(localKey);
    //   }
    //   return proxy.set(subkey, value);
    // } else {
    //   // this is a change at our level
    //   // check the changeset key filter
    //   if (requiresProxying(value)) {
    //     var proxy = this.addProxy(localKey, value);
    //     // remove a tracked value if there was one with the same key
    //     this.markChange(localKey, ObjectReplaced);
    //   } else {
    //     // the value is a local property
    //     this.markChange(localKey, value);
    //     // remove a proxy if there was one with the same key
    //     if (this.__nestedProxies.has(key)) {
    //       this.__nestedProxies.delete(key);
    //     }
    //   }
    //   return true;
  }

  // markChange(localKey: string, value: any) {
  //   // have to use get() here because source might be an EmberProxy
  //   const oldValue = get(this.__source, localKey);
  //   const unchanged = this.isUnchanged(value, oldValue);
  //   let changes = this.__changes;
  //   if (changes.has(localKey)) {
  //     // we have a pending change
  //     // modify it or delete 
  //     if (unchanged) {
  //       // we're back to the original value
  //       // so delete the change
  //       changes.delete(localKey);
  //     } else {
  //       // we know the key exists so the cast is safe
  //       setTrackedValue(changes.get(localKey) as TrackedStorage<any>, value);
  //     }
  //   } else if (!unchanged) {
  //     // create a new pending change
  //     changes.set(localKey, createStorage(value));
  //   }
  // }

  @action
  public execute(): void {
    // apply the changes to the source
    // but keep the changes for undo later
    if (this.isDirty) {
      this.__undoState = A(this.__source);
      if (this.__proxyArray && this.isValid) {
        this.replaceSourceWith(this.__proxyArray);
      }
    }
  }

  @action
  public save(): void {
    this.execute();
    this.clearPending();
  }

  private clearPending() {
    this.__nestedProxies.clear();
    this.__proxyArray = undefined;
    this.__undoState = undefined;
  }

  @action
  public rollback(): void {
    // apply the undo state
    if (this.__undoState) {
      this.replaceSourceWith(this.__undoState);
    }
    this.clearPending();
  }

  replaceSourceWith(newArray: any[]) {
    this.__source.splice(0, this.__source.length, newArray);
  }

  @action
  public async validate(): Promise<void> {
  }

  public get change(): { [index: string]: any; } | any[] {
    if (this.__proxyArray !== undefined) {
      return this.__proxyArray;
    }
    return {};
  }

  // private get localChange(): { [index: string]: any; } | any[]  {
  //   // only the changes at this level and not the nested content
  //   if (this.__proxyArray !== undefined) {
  //     return this.__proxyArray;
  //   }
  //   return {};
  // }

  public get changes(): { key: string, value: any }[] {
    if (this.__proxyArray !== undefined) {
      return [{
        key: ProxyArrayValueKey,
        value: this.__proxyArray
      }];
    }
    return [];
  }

  //@ts-ignore
  private __sourceProxy?: ArrayProxy<any>;
  private __source: any[];
  private __proxyArray?: any[];
  private __undoState?: any[];
  private __nestedProxies: TrackedMap<number, any> = new TrackedMap<number, any>();
  //  private __changes: TrackedMap<string, TrackedStorage<any>> = new TrackedMap<string, TrackedStorage<any>>();
}
