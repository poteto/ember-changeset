import { action, get } from '@ember/object';
import ObjectProxy from '@ember/object/proxy';
import handlerFor from 'ember-changeset/utils/handler-for';
import isUnchanged from 'ember-changeset/utils/is-unchanged';
import requiresProxying from 'ember-changeset/utils/requires-proxying';
import splitKey from 'ember-changeset/utils/split-key';
import { DeleteOnUndo, ObjectReplaced } from 'ember-changeset/utils/symbols';
import { createStorage, getValue as getTrackedValue, setValue as setTrackedValue, TrackedStorage } from 'ember-tracked-storage-polyfill';
import { TrackedMap } from 'tracked-maps-and-sets';
import IChangesetProxyHandler from './IChangesetProxyHandler';
import ProxyOptions from './ProxyOptions';

type Object = { [index: string]: any };
type Input = Object | ObjectProxy;

export default class ChangesetObjectProxyHandler<T extends Input> implements IChangesetProxyHandler<T> {
  constructor(source: T, options?: ProxyOptions) {
    if (source?.constructor?.name === 'ObjectProxy') {
      this.__sourceProxy = source as ObjectProxy;
      this.__source = source.content;
    } else {
      this.__source = source;
    }
    this.__changesetKeyFilters = options?.changesetKeys ?? [];
  }

  public get(_target: T, key: string): any {
    // extra stuff
    switch (key) {
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
    var locallyDirty = this.__changes.size > 0;
    if (locallyDirty) {
      return true;
    }
    for (var proxy of this.__nestedProxies.values()) {
      if (proxy.isDirty) {
        return true;
      }
    }
    return false;
  }

  public get isPristine(): boolean {
    if (this.__changes.size > 0) {
      // we have changes and we only store them if they're 
      // different from the original
      return false;
    }
    // now look at all the nested proxies
    for (var proxy of this.__nestedProxies.values()) {
      if (!proxy.isPristine) {
        return false;
      }
    }
    return true;
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
    var result = Object.assign({}, this.__source, this.localChange);
    return result;
  }

  @action
  public getValue(key: string) {
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
      case 'pendingData': return this.pendingData;
    }
    // nested keys are separated by dots
    var [localKey, subkey] = splitKey(key as string);

    // is it an existing proxy?
    if (this.__nestedProxies.has(localKey)) {
      var proxy = this.__nestedProxies.get(localKey);
      if (subkey) {
        return proxy[subkey];
      }
      return proxy;
    } else {
      let changes = this.__changes;
      if (changes.has(localKey)) {
        // we have a pending change
        // return it
        // we know it's not undefined so we can safely cast it
        var change = changes.get(localKey);
        var value = getTrackedValue(change as TrackedStorage<any>);
        if (value !== ObjectReplaced) {
          return value
        }
      }
    }
    // drop back to the internal object property
    // or a proxy of it if it's an object

    // @ts-ignore
    var value = this.__source[localKey];
    if (requiresProxying(value)) {
      // we know that this key has not already been proxied
      var proxy = this.addProxy(localKey);
      if (subkey) {
        return proxy[subkey];
      }
      return proxy;
    }
    return value;
  }

  private addProxy(key: string, value?: {}): any {
    // get sends just the key
    // set sends the key and the new value
    if (value === undefined) {
      // use the original
      value = this.__source[key];
    }
    if (value === undefined) {
      // missing on original but added in the changeset
      value = {};
    }
    var proxy = new Proxy(value, handlerFor(value));
    this.__nestedProxies.set(key, proxy);
    return proxy;
  }

  @action
  public setValue(key: string, value: any): boolean {
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
    // nested keys are separated by dots
    var [localKey, subkey] = splitKey(key as string);

    if (subkey) {
      // pass the change down to a nested level
      var proxy = this.__nestedProxies.get(localKey);
      if (!proxy) {
        // no existing proxy
        // so they're trying to set deep into an object that isn't yet proxied
        // wrap the existing object or create an empty one
        proxy = this.addProxy(localKey);
      }
      return proxy.set(subkey, value);
    } else {
      // this is a change at our level
      // check the changeset key filter
      if (this.isKeyFilteredOut(localKey)) {
        return false;
      }
      if (requiresProxying(value)) {
        var proxy = this.addProxy(localKey, value);
        // remove a tracked value if there was one with the same key
        this.markChange(localKey, ObjectReplaced);
      } else {
        // the value is a local property
        this.markChange(localKey, value);
        // remove a proxy if there was one with the same key
        if (this.__nestedProxies.has(key)) {
          this.__nestedProxies.delete(key);
        }
      }
      return true;
    }
  }

  private markChange(localKey: string, value: any) {
    // have to use get() here because source might be an EmberProxy
    const oldValue = get(this.__source, localKey);
    const unchanged = isUnchanged(value, oldValue);
    let changes = this.__changes;
    if (changes.has(localKey)) {
      // we have a pending change
      // modify it or delete 
      if (unchanged) {
        // we're back to the original value
        // so delete the change
        changes.delete(localKey);
      } else {
        // we know the key exists so the cast is safe
        setTrackedValue(changes.get(localKey) as TrackedStorage<any>, value);
      }
    } else if (!unchanged) {
      // create a new pending change
      changes.set(localKey, createStorage(value));
    }
  }

  private isKeyFilteredOut(key: string) {
    return this.__changesetKeyFilters.length > 0
      && !this.__changesetKeyFilters.includes(key);
  }

  @action
  public execute(): void {
    if (!this.__undoState) {
      this.__undoState = new Map<string, any>();
    }
    // apply the changes to the source
    // but keep the changes for undo later
    if (this.isDirty && this.isValid) {
      var changes = [...this.__changes.entries()];
      for (var [key, storage] of changes) {
        // grab the old value for undo
        var oldValue = this.__source[key];
        if (oldValue === undefined) {
          oldValue = DeleteOnUndo;
        }
        this.__undoState.set(key, oldValue);
        // apply the new value
        // @ts-ignore        
        var newValue = getTrackedValue(storage);
        if (newValue === ObjectReplaced) {
          // apply the entire proxy now
          // and changes in the next phase below
          this.__source[key] = this.__nestedProxies.get(key).data;
        } else {
          this.__source[key] = newValue;
        }
      }
    }
    // now apply the data from the nested proxies
    for (var [key, proxy] of this.__nestedProxies.entries()) {
      if (this.__source[key] == undefined) {
        this.__source[key] = proxy.data;
        this.__undoState.set(key, DeleteOnUndo);
      }
      proxy.execute();
    }
  }

  @action
  public save(): void {
    this.execute();
    this.clearPending();
  }

  private clearPending() {
    this.__nestedProxies.clear();
    this.__changes.clear();
    this.__undoState = undefined;
  }

  @action
  public rollback(): void {
    // rollback from the bottom up

    // roll back the proxies
    for (var proxy of this.__nestedProxies.values()) {
      proxy.rollback();
    }

    // apply the undo state
    if (this.__undoState) {
      var oldStates = [...this.__undoState.entries()];
      for (var [key, value] of oldStates) {
        if (value === DeleteOnUndo) {
          delete (this.__source[key]);
        } else {
          // @ts-ignore        
          this.__source[key] = value;
        }
      }
    }

    this.clearPending();
  }

  @action
  public async validate(): Promise<void> {
  }

  public get change(): { [index: string]: any; } {
    // property changes first
    var result: { [index: string]: any } = {};
    var changes = [...this.__changes.entries()];
    for (var [key, change] of changes) {
      var value = getTrackedValue(change);
      if (value === ObjectReplaced) {
        result[key] = Object.assign({}, this.__nestedProxies.get(key));
      } else {
        result[key as string] = value;
      }
    }
    // now apply the __nestedProxies
    for (var [key, proxy] of this.__nestedProxies.entries()) {
      var thisChange = proxy.change;
      if (Object.keys(thisChange).length > 0) {
        result[key] = Object.assign(result[key] || {}, thisChange);
      }
    }
    return result;
  }

  private get localChange(): { [index: string]: any; } {
    // only the changes at this level and not the nested content
    var changes = [...this.__changes.entries()];
    var result: { [index: string]: any } = {};
    for (var [key, change] of changes) {
      if (this.__nestedProxies.has(key)) {
        continue;
      }
      if (!(change instanceof Symbol)) {
        result[key as string] = getTrackedValue(change);
      }
    }
    return result;
  }

  public get changes(): { key: string, value: any }[] {
    var allChanges = [...this.__changes.entries()]
      .map(([key, change]) => {
        var value = getTrackedValue(change as TrackedStorage<any>);

        if (value === ObjectReplaced) {
          value = this.__nestedProxies.get(key).data
        };
        return {
          key,
          value
        };
      });
    // now add the proxy changes with the nested key
    for (var [key, proxy] of this.__nestedProxies.entries()) {
      var proxyChanges = proxy.changes;
      for (var change of proxyChanges) {
        allChanges.push({
          key: `${key}.${change.key}`,
          value: change.value
        })
      }
    }
    return allChanges;
  }

  private __changesetKeyFilters: string[];
  //@ts-ignore
  private __sourceProxy?: ObjectProxy<any>;
  private __source: Object;
  private __undoState: Map<string, any> | undefined;
  private __nestedProxies: TrackedMap<string, any> = new TrackedMap<string, any>();
  private __changes: TrackedMap<string, TrackedStorage<any>> = new TrackedMap<string, TrackedStorage<any>>();
}
