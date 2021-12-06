import { action } from '@ember/object';
import { createStorage, getValue as getTrackedValue, setValue as setTrackedValue, TrackedStorage } from 'ember-tracked-storage-polyfill';
import { TrackedMap } from 'tracked-maps-and-sets';

interface IChangesetProxyHandler<T extends {[index: string]: any}> {
  isChangeset: boolean;
  isDirty: boolean;
  isValid: boolean;
  changes: { [index: string]: any };
  execute(): void;
  rollback(): void;
  validate(): Promise<void>;
  // backwards compatible with old ember-changeset
  get(target: T, key: keyof T): any;
  set(target: T, key: keyof T, value: any): any;
}

export default class ChangesetObjectProxyHandler<T extends {[index: string]: any}> implements IChangesetProxyHandler<T> {
  
  constructor(source: T) {
    this.__source = source;
  }

  public readonly isChangeset = true;

  public get isDirty(): boolean {
    return this.__changes.size > 0;
  }

  public get isValid(): boolean {
    return true;
  }

  public get(_target: T, key: keyof T | 'set'): any {
    // extra stuff
    switch (key) {
      case 'changes': return this.changes;
      case 'execute': return this.execute;
      case 'get': return this.getValue;
      case 'isDirty': return this.isDirty;
      case 'isValid': return this.isValid;
      case 'rollback': return this.rollback;
      case 'set': return this.setValue;
      case 'validate': return this.validate;
      default: return this.getValue(key);
    }
  }

  public set(_target: T, key: keyof T, value: any): any{
    return this.setValue(key, value);
  }

  @action
  public getValue(key: keyof T) {
    let changes = this.__changes;
    if (changes.has(key)) {
      // we have a pending change
      // return it
      // we know it's not undefined so we can safely cast it
      return getTrackedValue(changes.get(key) as TrackedStorage<any>);
    } else {
      // drop back to the proxied object
      // @ts-ignore
      return this.__source[key];
    }
  }

  @action
  public setValue(key: keyof T, value: any): boolean {
    let changes = this.__changes;
    if (changes.has(key)) {
      // we have a pending change
      // modify it
      // we know the key exists so the cast is safe
      setTrackedValue(changes.get(key) as TrackedStorage<any>, value);
    } else {
      // create a new pending change
      changes.set(key, createStorage(value));
    }
    return true;
  }

  @action
  public execute(): void {
    // apply the changes to the source
    // but keep the changes for undo later
    if (this.isDirty && this.isValid) {
      if (!this.__undoState) {
        this.__undoState = new Map<string, any>();
      }
      var changes = [...this.__changes.entries()];
      for (var [key, storage] of changes) {
        // grab the old value for undo
        this.__undoState.set(key, this.__source[key]);
        // apply the new value
        // @ts-ignore        
        this.__source[key] = getTrackedValue(storage);
      }
    }
  }

  @action
  public rollback(): void {
    // clear the changes
    this.__changes.clear();

    // apply the undo state
    if (this.__undoState) {
      var oldStates = [...this.__undoState.entries()];
      for (var [key, value] of oldStates) {
        // @ts-ignore        
        this.__source[key] = value;
      }
      this.__undoState.clear();
      this.__undoState = undefined;
    }
  }

  @action
  public async validate(): Promise<void> {
  }

  public get changes(): { [index: string]: any; } {
    return [...this.__changes.entries()]
      .map(([key, storage]) => (
        {
          key, 
          value: getTrackedValue(storage)
        }
      )
    );
  }

  private __source: T;
  private __undoState: Map<keyof T, any> | undefined;
  private __changes: TrackedMap<keyof T, TrackedStorage<any>> = new TrackedMap<keyof T, TrackedStorage<any>>();

}
