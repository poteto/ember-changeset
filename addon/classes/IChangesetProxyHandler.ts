export default interface IChangesetProxyHandler<T extends { [index: string]: any }> {
  isChangeset: boolean;
  isDirty: boolean;
  isPristine: boolean;
  isValid: boolean;
  change: { [index: string]: any } | any[];
  changes: { key: string, value: any }[];
  pendingData: { [index: string]: any };
  execute(): void;
  save(): void;
  rollback(): void;
  validate(): Promise<void>;
  // backwards compatible with old ember-changeset
  get(target: T, key: string): any;
  set(target: T, key: string, value: any): any;
}
