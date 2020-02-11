# Change Log

## [3.0.3](https://github.com/poteto/ember-changeset/tree/v3.0.3) (2020-02-11)
[Full Changelog](https://github.com/poteto/ember-changeset/compare/v3.0.0...v3.0.3)

- enhancement (🚀 Enhancement) declare typings [#427](https://github.com/poteto/ember-changeset/pull/427)
- enhancement (🚀 Enhancement) Moar types [#425](https://github.com/poteto/ember-changeset/pull/425)
- enhancement (🚀 Enhancement) Reexport validated-changeset types[#423](https://github.com/poteto/ember-changeset/pull/423)

## [3.0.0](https://github.com/poteto/ember-changeset/tree/v3.0.0) (2020-02-02)
[Full Changelog](https://github.com/poteto/ember-changeset/compare/v3.0.0-beta.3...v3.0.0)

- validated-changeset - exit beta [#391](https://github.com/poteto/ember-changeset/pull/391)
- add fallback for getOwnPropertyDescriptors [#421](https://github.com/poteto/ember-changeset/pull/421)
- Extend test coverage to sync relationships [#409](https://github.com/poteto/ember-changeset/pull/409)
- Export Changeset class to allow overriding [#418](https://github.com/poteto/ember-changeset/pull/418)
- Add failing test for nested properties with booleans [#415](https://github.com/poteto/ember-changeset/pull/415)
- Ensure key in obj works with dot separated [#416](https://github.com/poteto/ember-changeset/pull/416)
- Bring back changeset-get for nested getter [#414](https://github.com/poteto/ember-changeset/pull/414)
- Fix a bug with unsafe properties [#408](https://github.com/poteto/ember-changeset/pull/408)
- Fix changeset get for nested properties with changes [#404](https://github.com/poteto/ember-changeset/pull/404)
- Failing test for ember data model [#406](https://github.com/poteto/ember-changeset/pull/406)
- Properly manage error keys [#402](https://github.com/poteto/ember-changeset/pull/402)
- Collect errors correctly [#399](https://github.com/poteto/ember-changeset/pull/399)
- Add safeSet for Ember tracking context [#395](https://github.com/poteto/ember-changeset/pull/395)

## [3.0.0-beta.3](https://github.com/poteto/ember-changeset/tree/v3.0.0-beta.3) (2019-12-13)
[Full Changelog](https://github.com/poteto/ember-changeset/compare/v3.0.0-beta.2...v3.0.0-beta.3)

- Upgrade @glimmer/tracking to v1.0.0 [#387](https://github.com/poteto/ember-changeset/pull/387)
- [TEST] #get nested error with key path [#385](https://github.com/poteto/ember-changeset/pull/385)

## [3.0.0-beta.2](https://github.com/poteto/ember-changeset/tree/v3.0.0-beta.2) (2019-12-04)
[Full Changelog](https://github.com/poteto/ember-changeset/compare/v3.0.0-beta.1...v3.0.0-beta.2)

- allow multiple keys for .validate [#384](https://github.com/poteto/ember-changeset/pull/384)

## [3.0.0-beta.1](https://github.com/poteto/ember-changeset/tree/v3.0.0-beta.1) (2019-11-29)
[Full Changelog](https://github.com/poteto/ember-changeset/compare/v3.0.0-beta.0...v3.0.0-beta.1)

- Remove changeset-get helper [#382](https://github.com/poteto/ember-changeset/pull/382)

## [3.0.0-beta.0](https://github.com/poteto/ember-changeset/tree/v3.0.0-beta.0) (2019-11-27)
[Full Changelog](https://github.com/poteto/ember-changeset/compare/v2.2.4...v3.0.0-beta.0)

- [MAJOR]: rewrite for v3 [#379](https://github.com/poteto/ember-changeset/pull/379)
    - This rewrite involved removing Ember.Object and implementing Proxies for get and set traps to the underlying Changeset object.
    - `@tracked` is relied on heavily to ensure the UI reflects the most recent updates to internal changeset properties.
    - Moreover, instead of storing paths to values (e.g. `person.firstName`), we instead rely on plain JavaScript access, simplifying nested operations on your changesets.
    - Tests were added and previously failing tests were brought back.
    - See this blog [post](https://www.pzuraq.com/do-you-need-ember-object/) for the "why".

## [2.2.4](https://github.com/poteto/ember-changeset/tree/v2.2.4) (2019-11-14)
[Full Changelog](https://github.com/poteto/ember-changeset/compare/v2.2.3...v2.2.4)

- No async needed [24e5bb4](https://github.com/poteto/ember-changeset/commit/24e5bb410d2e838c4be0886b03caeec8fc0d1886)

## [2.2.3](https://github.com/poteto/ember-changeset/tree/v2.2.3) (2019-11-04)
[Full Changelog](https://github.com/poteto/ember-changeset/compare/v2.2.2...v2.2.3)

- [BUGFIX]: handling multiple validations [#378](https://github.com/poteto/ember-changeset/pull/378)

## [2.2.2](https://github.com/poteto/ember-changeset/tree/v2.2.2) (2019-11-04)
[Full Changelog](https://github.com/poteto/ember-changeset/compare/v2.2.1...v2.2.2)

- Minor cleanup to native JS [#374](https://github.com/poteto/ember-changeset/pull/374)
- Ensure can add array of strings to addError [#377](https://github.com/poteto/ember-changeset/pull/377)

## [2.2.1](https://github.com/poteto/ember-changeset/tree/v2.2.1) (2019-11-04)
[Full Changelog](https://github.com/poteto/ember-changeset/compare/v2.2.0...v2.2.1)

- Ensure closure over validation map accepts objects first [#373](https://github.com/poteto/ember-changeset/pull/373)

## [2.2.0](https://github.com/poteto/ember-changeset/tree/v2.2.0) (2019-11-04)
[Full Changelog](https://github.com/poteto/ember-changeset/compare/v2.1.3...v2.2.0)

- Cleanup ts build [#368](https://github.com/poteto/ember-changeset/pull/368)
- array set test [#370](https://github.com/poteto/ember-changeset/pull/370)
- Allow changeset to accept validation map [#372](https://github.com/poteto/ember-changeset/pull/372)

## [2.1.3](https://github.com/poteto/ember-changeset/tree/v2.1.2) (2019-10-20)
[Full Changelog](https://github.com/poteto/ember-changeset/compare/v2.1.2...v2.1.3)

- Fix null/falsey results [#365](https://github.com/poteto/ember-changeset/pull/365)
- Keep property descriptors on assign [#366](https://github.com/poteto/ember-changeset/pull/366)
- Update Ember CLI to 3.8 [#367](https://github.com/poteto/ember-changeset/pull/367)

## [2.1.2](https://github.com/poteto/ember-changeset/tree/v2.1.2) (2019-06-04)
[Full Changelog](https://github.com/poteto/ember-changeset/compare/v2.1.1...v2.1.2)

- Fix push errors to update error property pr [#355](https://github.com/poteto/ember-changeset/pull/355)

## [2.1.1](https://github.com/poteto/ember-changeset/tree/v2.1.1) (2019-05-24)
[Full Changelog](https://github.com/poteto/ember-changeset/compare/v2.1.0...v2.1.1)

- Fix validationMap type signature [#352](https://github.com/poteto/ember-changeset/pull/352)

## [2.1.0](https://github.com/poteto/ember-changeset/tree/v2.1.0) (2019-04-27)
[Full Changelog](https://github.com/poteto/ember-changeset/compare/v2.0.1...v2.1.0)

- Add changeset-get helper [#351](https://github.com/poteto/ember-changeset/pull/351)

## [2.0.1](https://github.com/poteto/ember-changeset/tree/v2.0.1) (2019-04-08)
[Full Changelog](https://github.com/poteto/ember-changeset/compare/v2.0.0...v2.0.1)

- Optional key [#348](https://github.com/poteto/ember-changeset/pull/348)
- Minor updates [#343](https://github.com/poteto/ember-changeset/pull/343)
- Change app helper to ts [#341](https://github.com/poteto/ember-changeset/pull/341)

## [2.0.0](https://github.com/poteto/ember-changeset/tree/v2.0.0) (2019-02-03)
[Full Changelog](https://github.com/poteto/ember-changeset/compare/v1.6.0...v2.0.0)

- Nested setters and getters improvement [#335](https://github.com/poteto/ember-changeset/pull/335)
- Belongs-To set to null or undefined [#333](https://github.com/poteto/ember-changeset/pull/333)
- Convert addon to typescript [#327](https://github.com/poteto/ember-changeset/pull/327)
- Remove Relay Implementation [#326](https://github.com/poteto/ember-changeset/pull/326)

## [1.6.0](https://github.com/poteto/ember-changeset/tree/v1.6.0) (2018-12-12)
[Full Changelog](https://github.com/poteto/ember-changeset/compare/v1.5.0...v1.6.0)

**Important Merged pull requests:**

- Use deepSet when updating RUNNING_VALIDATIONS for nested key [#328](https://github.com/poteto/ember-changeset/pull/328)
- update ember-deep-set dependency [#320](https://github.com/poteto/ember-changeset/pull/320)
- fix when value is relation, but set as null [#318](https://github.com/poteto/ember-changeset/pull/318)
- Change to use native typeof instead [#313](https://github.com/poteto/ember-changeset/pull/313)

## [1.5.0](https://github.com/poteto/ember-changeset/tree/v1.5.0) (2018-08-28)
[Full Changelog](https://github.com/poteto/ember-changeset/compare/v1.4.2-beta.0...v1.5.0)

**Important Merged pull requests:**

- Do not clear changes after pushErrors [#311](https://github.com/poteto/ember-changeset/pull/311)
- Verify object value getter [#309](https://github.com/poteto/ember-changeset/pull/309)
- rollback invalid key addition [#307](https://github.com/poteto/ember-changeset/pull/307)
- Update to 3.2 [#306](https://github.com/poteto/ember-changeset/pull/306)
- Ensure error changes are added to changes block [#303](https://github.com/poteto/ember-changeset/pull/303)
- Bugfix: BelongsTo and hasMany relationship setter and getter [#300](https://github.com/poteto/ember-changeset/pull/300)
- add an afterRollback event [#292](https://github.com/poteto/ember-changeset/pull/292)
- Expose changeset content [#287](https://github.com/poteto/ember-changeset/pull/292)

**Closed issues:**

## [1.4.1](https://github.com/poteto/ember-changeset/tree/v1.4.1) (2018-01-03)
[Full Changelog](https://github.com/poteto/ember-changeset/compare/v1.4.0...v1.4.2-beta.0)

**Important Merged pull requests:**

**Closed issues:**

