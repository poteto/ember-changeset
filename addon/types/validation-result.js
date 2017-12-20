// @flow

export type ValidationResult =
  | boolean
  | string
  | Array<string>
  | Promise<string>
  | Promise<Array<string>>;
