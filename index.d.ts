import { BufferedChangeset } from "validated-changeset";

type BufferedChangesetConstructorParameters = ConstructorParameters<
  typeof BufferedChangeset
>;

interface Config extends BufferedChangesetConstructorParameters[3] {
  changeset: typeof EmberChangeset;
}

type changesetFunctionsParameters = [
  BufferedChangesetConstructorParameters[0],
  BufferedChangesetConstructorParameters[1]?,
  BufferedChangesetConstructorParameters[2]?,
  Config?
];

declare module "ember-changeset" {
  export class EmberChangeset extends BufferedChangeset {}
  export function changeset(...args: changesetFunctionsParameters);
  export function Changeset(...args: changesetFunctionsParameters);
}
