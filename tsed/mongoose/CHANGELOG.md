# @radoslavirha/tsed-mongoose

## 5.0.15

### Patch Changes

- [#305](https://github.com/radoslavirha/toolkit-hub/pull/305) [`9a86828`](https://github.com/radoslavirha/toolkit-hub/commit/9a868282e1d46e60eddeb21374ce6e9773476b9a) Thanks [@claude-agent-irha](https://github.com/apps/claude-agent-irha)! - `MongoMapper.getModelValue` now applies `@Default` to properties renamed with `@Name`.

- [#312](https://github.com/radoslavirha/toolkit-hub/pull/312) [`ce5183f`](https://github.com/radoslavirha/toolkit-hub/commit/ce5183faa81078f9ba324e4abffd74388c814d42) Thanks [@radoslavirha](https://github.com/radoslavirha)! - Agent skills only, no runtime code changed: name the Docker prerequisite for MongoDB testcontainers, add run-fix-rerun loops after linting, add an entity checklist to tsed-mongoose, inline the redaction selector syntax instead of pointing at the README, and stop stating section counts that had drifted.
- Updated dependencies [[`18615e6`](https://github.com/radoslavirha/toolkit-hub/commit/18615e60439f1a35b3b01fc6c9b3174d92a77d18), [`126c4b7`](https://github.com/radoslavirha/toolkit-hub/commit/126c4b7fb387cd4e811c6a5581ec5a1e31461c71), [`f753994`](https://github.com/radoslavirha/toolkit-hub/commit/f753994504a9f402891b39622b8c93b398ed8f81), [`ce5183f`](https://github.com/radoslavirha/toolkit-hub/commit/ce5183faa81078f9ba324e4abffd74388c814d42)]:
  - @radoslavirha/utils@0.9.6
  - @radoslavirha/tsed-common@0.6.2

## 5.0.14

### Patch Changes

- [`c71ecb6`](https://github.com/radoslavirha/toolkit-hub/commit/c71ecb6c83130add1a2e41c8713cdd3e2639addb) Thanks [@radoslavirha](https://github.com/radoslavirha)! - Update packages
- Updated dependencies [[`2b5679a`](https://github.com/radoslavirha/toolkit-hub/commit/2b5679a3d30ee4dfa9db9d0ea4da73241a12ba46), [`c15879b`](https://github.com/radoslavirha/toolkit-hub/commit/c15879b40409decebf6ce44638151ef6ca3b8778), [`14f4409`](https://github.com/radoslavirha/toolkit-hub/commit/14f4409812be67337859b9389438a3b6c1c5493b), [`5d8ff50`](https://github.com/radoslavirha/toolkit-hub/commit/5d8ff5039f3fd492a2be2f931f96d4789970e16c), [`c71ecb6`](https://github.com/radoslavirha/toolkit-hub/commit/c71ecb6c83130add1a2e41c8713cdd3e2639addb)]:
  - @radoslavirha/utils@0.9.5
  - @radoslavirha/tsed-common@0.6.1

## 5.0.13

### Patch Changes

- Updated dependencies [[`eee3673`](https://github.com/radoslavirha/toolkit-hub/commit/eee3673b6486ce94e4d2e44a5c12f0c4c2321bb0), [`c5b57c6`](https://github.com/radoslavirha/toolkit-hub/commit/c5b57c627321ba0b10c11a5004a405f91c6a4d99), [`83d64e2`](https://github.com/radoslavirha/toolkit-hub/commit/83d64e2b42a14c34146dab90b686c11f92dc9aeb)]:
  - @radoslavirha/utils@0.9.4
  - @radoslavirha/tsed-common@0.6.0

## 5.0.12

### Patch Changes

- [#241](https://github.com/radoslavirha/toolkit-hub/pull/241) [`8ad4685`](https://github.com/radoslavirha/toolkit-hub/commit/8ad4685655019c5ae3a0fcdf411227300d2d8d86) Thanks [@radoslavirha](https://github.com/radoslavirha)! - `MongoMapper` now recognises refs populated through `.lean()` + `deserialize()`: `canBePopulated` returns `true`, `getPopulated` returns the document instead of throwing, and `getIdFromPotentiallyPopulated` returns the referenced id instead of `"[object Object]"`.

- [#242](https://github.com/radoslavirha/toolkit-hub/pull/242) [`178382b`](https://github.com/radoslavirha/toolkit-hub/commit/178382b592ae4c866214d9b594e841b527e0836e) Thanks [@radoslavirha](https://github.com/radoslavirha)! - `MongoMapper.getIdFromPotentiallyPopulated` returns `undefined` for an unset optional ref (`null`/`undefined`) instead of the string `"undefined"`/`"null"`.

- [#243](https://github.com/radoslavirha/toolkit-hub/pull/243) [`7b5d4fc`](https://github.com/radoslavirha/toolkit-hub/commit/7b5d4fc16deaa962a1ded5559e148edbe5dbb5b5) Thanks [@radoslavirha](https://github.com/radoslavirha)! - `MongoMapper.getModelValue` now resolves a field's `@Default` from the mapper's declared `model` class, so it no longer throws a `TypeError` when given a plain-object model (e.g. a spread copy).

- [#258](https://github.com/radoslavirha/toolkit-hub/pull/258) [`fe4c682`](https://github.com/radoslavirha/toolkit-hub/commit/fe4c682a33645ba4347ce1efc3a20240112a5bde) Thanks [@radoslavirha](https://github.com/radoslavirha)! - Add a protected `MongoRepository.isValidId()` guard so by-id queries can resolve `null` for a malformed id instead of throwing a Mongoose `CastError`.
- Updated dependencies [[`13ca524`](https://github.com/radoslavirha/toolkit-hub/commit/13ca52450814163eb5f694f1cc9b7b4d98f4f6c8), [`ad3a682`](https://github.com/radoslavirha/toolkit-hub/commit/ad3a682a226c392fe7b649306971bf8185c07520), [`c033bdb`](https://github.com/radoslavirha/toolkit-hub/commit/c033bdbc0664285f0a9b578787727625e616744b)]:
  - @radoslavirha/utils@0.9.3
  - @radoslavirha/tsed-common@0.5.11

## 5.0.11

### Patch Changes

- [`b15b9e0`](https://github.com/radoslavirha/toolkit-hub/commit/b15b9e0a6e59a499c3732c44f6ae22dbb0dc3f4b) Thanks [@radoslavirha](https://github.com/radoslavirha)! - Skill update

## 5.0.10

### Patch Changes

- [`58987a4`](https://github.com/radoslavirha/toolkit-hub/commit/58987a4aa81d3d4e706b5c7baca51c1ab31d91ad) Thanks [@radoslavirha](https://github.com/radoslavirha)! - Fix peer dependency, rollback pnpm
- Updated dependencies [[`58987a4`](https://github.com/radoslavirha/toolkit-hub/commit/58987a4aa81d3d4e706b5c7baca51c1ab31d91ad)]:
  - @radoslavirha/tsed-common@0.5.10
  - @radoslavirha/utils@0.9.2

## 5.0.9

### Patch Changes

- [`87a3a08`](https://github.com/radoslavirha/toolkit-hub/commit/87a3a080b81aced77c2728df4681b39c6ea80686) Thanks [@radoslavirha](https://github.com/radoslavirha)! - Update packages
- Updated dependencies [[`87a3a08`](https://github.com/radoslavirha/toolkit-hub/commit/87a3a080b81aced77c2728df4681b39c6ea80686)]:
  - @radoslavirha/tsed-common@0.5.9
  - @radoslavirha/utils@0.9.1

## 5.0.8

### Patch Changes

- [#178](https://github.com/radoslavirha/toolkit-hub/pull/178) [`9be3b74`](https://github.com/radoslavirha/toolkit-hub/commit/9be3b74e90b7124a0812e0191b0b0f084dbbe6cc) Thanks [@radoslavirha](https://github.com/radoslavirha)! - Move the Ts.ED catalog to 8.38.2 and stop routing `Platform.bootstrap` through `PlatformExpress.bootstrap(settings)`.
  
  Ts.ED 8.38.2 funnels both `bootstrap()` overloads through `PlatformBuilder.options()`, which tells a root module from a settings object with `isClass()`. That helper returns `true` for plain objects — it only rejects `Object` itself — so a settings-only call is read as a root module and every key, `rootModule` included, is discarded. `Platform.bootstrap` now builds the `PlatformBuilder` directly, which is what the adapter did up to 8.38.0.
- Updated dependencies [[`9be3b74`](https://github.com/radoslavirha/toolkit-hub/commit/9be3b74e90b7124a0812e0191b0b0f084dbbe6cc)]:
  - @radoslavirha/tsed-common@0.5.8
  - @radoslavirha/utils@0.9.0

## 5.0.7

### Patch Changes

- [#169](https://github.com/radoslavirha/toolkit-hub/pull/169) [`5281353`](https://github.com/radoslavirha/toolkit-hub/commit/528135319ec3d81325cf8d28fca953a9f1fa058a) Thanks [@radoslavirha](https://github.com/radoslavirha)! - Use `CommonUtils.notNull` in the test repository helper instead of a raw null comparison, and enable the toolkit reuse lint rules for the package.
- Updated dependencies [[`5281353`](https://github.com/radoslavirha/toolkit-hub/commit/528135319ec3d81325cf8d28fca953a9f1fa058a)]:
  - @radoslavirha/utils@0.9.0
  - @radoslavirha/tsed-common@0.5.7

## 5.0.6

### Patch Changes

- [#166](https://github.com/radoslavirha/toolkit-hub/pull/166) [`de995c1`](https://github.com/radoslavirha/toolkit-hub/commit/de995c1dcf15f226a6358658b693a5357563a3db) Thanks [@radoslavirha](https://github.com/radoslavirha)! - Ship agent guidance as an APM skill (`using-tsed-mongoose`): the document/model/mapper/repository contract, the members each base class requires, `mongoToModelBase` returning a value to spread rather than mutating, `getModelValue`'s PATCH flag, the `MongoCreate`/`MongoUpdate`/`MongoFilter` payload types, the `Ref` helpers, and the traps left by the renamed mapper and repository APIs.
  
  Also corrects the package's own JSDoc, which taught two things the code no longer does: `MongoRepository`'s example declared `protected type: Type<Item> = Item` (renamed to `mongo`), and `MongoMapper` claimed three abstract methods when it declares two abstract properties, with an example that omitted both.
- Updated dependencies [[`92ff78d`](https://github.com/radoslavirha/toolkit-hub/commit/92ff78d0b6f78d17a172871f2353f523040b51aa)]:
  - @radoslavirha/tsed-common@0.5.6
  - @radoslavirha/utils@0.8.6

## 5.0.5

### Patch Changes

- Updated dependencies [[`086e150`](https://github.com/radoslavirha/toolkit-hub/commit/086e150cb25fe2aa84cb097a212547014f36acc8)]:
  - @radoslavirha/utils@0.8.5
  - @radoslavirha/tsed-common@0.5.5

## 5.0.4

### Patch Changes

- [`b5b6441`](https://github.com/radoslavirha/toolkit-hub/commit/b5b64411b7f366c10ef0412ed4819784208b0316) Thanks [@radoslavirha](https://github.com/radoslavirha)! - Update packages

- Updated dependencies [[`b5b6441`](https://github.com/radoslavirha/toolkit-hub/commit/b5b64411b7f366c10ef0412ed4819784208b0316)]:
  - @radoslavirha/utils@0.8.4
  - @radoslavirha/tsed-common@0.5.4

## 5.0.3

### Patch Changes

- Updated dependencies [[`57a17b4`](https://github.com/radoslavirha/toolkit-hub/commit/57a17b4381c427fd71b22a8aceaedc33568f8f1f)]:
  - @radoslavirha/utils@0.8.3
  - @radoslavirha/tsed-common@0.5.3

## 5.0.2

### Patch Changes

- [`58dd739`](https://github.com/radoslavirha/toolkit-hub/commit/58dd739ff2b17064148ccd82826d779957603dc7) Thanks [@radoslavirha](https://github.com/radoslavirha)! - Update pnpm to 11.8

- [`b4e3cfd`](https://github.com/radoslavirha/toolkit-hub/commit/b4e3cfd8476df7e8d0b6f6e8e6a60a9851485255) Thanks [@radoslavirha](https://github.com/radoslavirha)! - Update dependencies

- Updated dependencies [[`58dd739`](https://github.com/radoslavirha/toolkit-hub/commit/58dd739ff2b17064148ccd82826d779957603dc7), [`b4e3cfd`](https://github.com/radoslavirha/toolkit-hub/commit/b4e3cfd8476df7e8d0b6f6e8e6a60a9851485255)]:
  - @radoslavirha/utils@0.8.2
  - @radoslavirha/tsed-common@0.5.2

## 5.0.1

### Patch Changes

- [`193bfc1`](https://github.com/radoslavirha/toolkit-hub/commit/193bfc1670ecc59cf7617d0b6603fe54a0d9529c) Thanks [@radoslavirha](https://github.com/radoslavirha)! - Update packages [#2](https://github.com/radoslavirha/toolkit-hub/issues/2)

- Updated dependencies [[`193bfc1`](https://github.com/radoslavirha/toolkit-hub/commit/193bfc1670ecc59cf7617d0b6603fe54a0d9529c)]:
  - @radoslavirha/utils@0.8.1
  - @radoslavirha/tsed-common@0.5.1

## 5.0.0

### Minor Changes

- [`c3c8c2a`](https://github.com/radoslavirha/toolkit-hub/commit/c3c8c2a22065c352f2bead2cff09635bb1ad4677) Thanks [@radoslavirha](https://github.com/radoslavirha)! - pnpm update to v11

### Patch Changes

- Updated dependencies [[`c3c8c2a`](https://github.com/radoslavirha/toolkit-hub/commit/c3c8c2a22065c352f2bead2cff09635bb1ad4677)]:
  - @radoslavirha/utils@0.8.0
  - @radoslavirha/tsed-common@0.5.0

## 4.0.9

### Patch Changes

- Updated dependencies [[`f28bff1`](https://github.com/radoslavirha/toolkit-hub/commit/f28bff1f0d07877dde6cef04ef115f1dfe0f6599)]:
  - @radoslavirha/tsed-common@0.4.15
  - @radoslavirha/utils@0.7.7

## 4.0.8

### Patch Changes

- [`80e0748`](https://github.com/radoslavirha/toolkit-hub/commit/80e07488b956d95194f79567dcb80e804792ca2b) Thanks [@radoslavirha](https://github.com/radoslavirha)! - Typescript config

- Updated dependencies [[`80e0748`](https://github.com/radoslavirha/toolkit-hub/commit/80e07488b956d95194f79567dcb80e804792ca2b)]:
  - @radoslavirha/utils@0.7.7
  - @radoslavirha/tsed-common@0.4.14

## 4.0.7

### Patch Changes

- [`b6c768d`](https://github.com/radoslavirha/toolkit-hub/commit/b6c768defea2cce2fcb6b0b9de11d5f17a5cc7c0) Thanks [@radoslavirha](https://github.com/radoslavirha)! - Update dependencies

- Updated dependencies [[`b6c768d`](https://github.com/radoslavirha/toolkit-hub/commit/b6c768defea2cce2fcb6b0b9de11d5f17a5cc7c0)]:
  - @radoslavirha/utils@0.7.6
  - @radoslavirha/tsed-common@0.4.13

## 4.0.6

### Patch Changes

- [`6c97cf1`](https://github.com/radoslavirha/toolkit-hub/commit/6c97cf184920104cd9587a5a006ef30e3653292e) Thanks [@radoslavirha](https://github.com/radoslavirha)! - Improve logger

- Updated dependencies [[`6c97cf1`](https://github.com/radoslavirha/toolkit-hub/commit/6c97cf184920104cd9587a5a006ef30e3653292e)]:
  - @radoslavirha/utils@0.7.5
  - @radoslavirha/tsed-common@0.4.12

## 4.0.5

### Patch Changes

- [`a4b7c85`](https://github.com/radoslavirha/toolkit-hub/commit/a4b7c8525fa3d877ef3b6b43703ce34a7eeff962) Thanks [@radoslavirha](https://github.com/radoslavirha)! - Update dependencies

- Updated dependencies [[`a4b7c85`](https://github.com/radoslavirha/toolkit-hub/commit/a4b7c8525fa3d877ef3b6b43703ce34a7eeff962)]:
  - @radoslavirha/utils@0.7.4
  - @radoslavirha/tsed-common@0.4.11

## 4.0.4

### Patch Changes

- [`da99054`](https://github.com/radoslavirha/toolkit-hub/commit/da9905404fc64f0216d4de8c3042ececbddfa0c7) Thanks [@radoslavirha](https://github.com/radoslavirha)! - Update dependencies

- Updated dependencies [[`da99054`](https://github.com/radoslavirha/toolkit-hub/commit/da9905404fc64f0216d4de8c3042ececbddfa0c7)]:
  - @radoslavirha/utils@0.7.3
  - @radoslavirha/tsed-common@0.4.10

## 4.0.3

### Patch Changes

- [`25c009f`](https://github.com/radoslavirha/toolkit-hub/commit/25c009f103ddb8b1745b52294e94704c45ae5aab) Thanks [@radoslavirha](https://github.com/radoslavirha)! - Fix vitest config

- Updated dependencies [[`25c009f`](https://github.com/radoslavirha/toolkit-hub/commit/25c009f103ddb8b1745b52294e94704c45ae5aab)]:
  - @radoslavirha/utils@0.7.2
  - @radoslavirha/tsed-common@0.4.9

## 4.0.2

### Patch Changes

- [`e995c4d`](https://github.com/radoslavirha/toolkit-hub/commit/e995c4d30781c53a4cd98914082c2a2e60e4d4b0) Thanks [@radoslavirha](https://github.com/radoslavirha)! - Update dependencies

- [`bb3373a`](https://github.com/radoslavirha/toolkit-hub/commit/bb3373a6fd9fbeceb4fb44dd4a3dad3cc5d28f7e) Thanks [@radoslavirha](https://github.com/radoslavirha)! - Improve build

- Updated dependencies [[`e995c4d`](https://github.com/radoslavirha/toolkit-hub/commit/e995c4d30781c53a4cd98914082c2a2e60e4d4b0), [`bb3373a`](https://github.com/radoslavirha/toolkit-hub/commit/bb3373a6fd9fbeceb4fb44dd4a3dad3cc5d28f7e)]:
  - @radoslavirha/utils@0.7.1
  - @radoslavirha/tsed-common@0.4.8

## 4.0.1

### Patch Changes

- Updated dependencies [[`0a541ba`](https://github.com/radoslavirha/toolkit-hub/commit/0a541ba997c106955e01146bf59cb37f5d06b0b7)]:
  - @radoslavirha/utils@0.7.0
  - @radoslavirha/tsed-common@0.4.7

## 4.0.0

### Major Changes

- [`9611eb2`](https://github.com/radoslavirha/toolkit-hub/commit/9611eb229ef9b71712c73f5d5cd438744e2739bc) Thanks [@radoslavirha](https://github.com/radoslavirha)! - Refactor mongoose package

### Patch Changes

- [`ed0527e`](https://github.com/radoslavirha/toolkit-hub/commit/ed0527e4a838567136383da8be36d064c84cef5c) Thanks [@radoslavirha](https://github.com/radoslavirha)! - Update dependencies

- Updated dependencies [[`ed0527e`](https://github.com/radoslavirha/toolkit-hub/commit/ed0527e4a838567136383da8be36d064c84cef5c)]:
  - @radoslavirha/utils@0.6.1
  - @radoslavirha/tsed-common@0.4.6

## 3.1.3

### Patch Changes

- Updated dependencies [[`fff3c81`](https://github.com/radoslavirha/toolkit-hub/commit/fff3c81c691014fdd2366f40be97e8cd5f9c695e)]:
  - @radoslavirha/utils@0.6.0
  - @radoslavirha/tsed-common@0.4.5

## 3.1.2

### Patch Changes

- [`2180452`](https://github.com/radoslavirha/toolkit-hub/commit/2180452c22b31454dc44e17661352c174d628a0f) Thanks [@radoslavirha](https://github.com/radoslavirha)! - Fix deserialization

- [`6d50aa4`](https://github.com/radoslavirha/toolkit-hub/commit/6d50aa4ecb08afac7d8a2e3bedc3928f0c9a7c22) Thanks [@radoslavirha](https://github.com/radoslavirha)! - Fix MongooseModel import

## 3.1.1

### Patch Changes

- [`cefab8c`](https://github.com/radoslavirha/toolkit-hub/commit/cefab8cb4dafc05e6a31618014ec8cfc0ea967a3) Thanks [@radoslavirha](https://github.com/radoslavirha)! - Update docs, dependencies

- Updated dependencies [[`cefab8c`](https://github.com/radoslavirha/toolkit-hub/commit/cefab8cb4dafc05e6a31618014ec8cfc0ea967a3)]:
  - @radoslavirha/utils@0.5.2
  - @radoslavirha/tsed-common@0.4.4

## 3.1.0

### Minor Changes

- [`ee57533`](https://github.com/radoslavirha/toolkit-hub/commit/ee575331526d61391abb26e3dcb48d8165ed94da) Thanks [@radoslavirha](https://github.com/radoslavirha)! - Create repository

### Patch Changes

- [`6951e80`](https://github.com/radoslavirha/toolkit-hub/commit/6951e80d87867b7843e5b79936dc92113a9a4932) Thanks [@radoslavirha](https://github.com/radoslavirha)! - Update dependencies

- Updated dependencies [[`6951e80`](https://github.com/radoslavirha/toolkit-hub/commit/6951e80d87867b7843e5b79936dc92113a9a4932)]:
  - @radoslavirha/utils@0.5.1
  - @radoslavirha/tsed-common@0.4.3

## 3.0.2

### Patch Changes

- Updated dependencies [[`b97d4d8`](https://github.com/radoslavirha/toolkit-hub/commit/b97d4d847c06dfbdff38aea739a224c36ebc7ff5)]:
  - @radoslavirha/tsed-common@0.4.2

## 3.0.1

### Patch Changes

- Updated dependencies [[`b9a6fe2`](https://github.com/radoslavirha/toolkit-hub/commit/b9a6fe200a0452ee6cffa1619f876dd95c3044ba)]:
  - @radoslavirha/utils@0.5.0
  - @radoslavirha/tsed-common@0.4.1

## 3.0.0

### Patch Changes

- Updated dependencies [[`1e72ddf`](https://github.com/radoslavirha/toolkit-hub/commit/1e72ddf56b4d95d06d60519f1cfb52a6f1a9a898), [`5253d54`](https://github.com/radoslavirha/toolkit-hub/commit/5253d547d88584bab2565121cefd407cdcf0cac1)]:
  - @radoslavirha/utils@0.4.0
  - @radoslavirha/tsed-common@0.4.0

## 2.0.0

### Minor Changes

- [`f1b53cb`](https://github.com/radoslavirha/toolkit-hub/commit/f1b53cb89500d57b598a965eb78d1c69fe2851ef) Thanks [@radoslavirha](https://github.com/radoslavirha)! - Improvements, documentation

### Patch Changes

- Updated dependencies [[`f1b53cb`](https://github.com/radoslavirha/toolkit-hub/commit/f1b53cb89500d57b598a965eb78d1c69fe2851ef)]:
  - @radoslavirha/utils@0.3.0
  - @radoslavirha/tsed-common@0.3.0

## 1.0.2

### Patch Changes

- [`6a55e71`](https://github.com/radoslavirha/toolkit-hub/commit/6a55e71471f663bc8c93e12b38fc2e0cd0bb20c4) Thanks [@radoslavirha](https://github.com/radoslavirha)! - CI fixes

- Updated dependencies [[`6a55e71`](https://github.com/radoslavirha/toolkit-hub/commit/6a55e71471f663bc8c93e12b38fc2e0cd0bb20c4)]:
  - @radoslavirha/utils@0.2.2
  - @radoslavirha/tsed-common@0.2.2

## 1.0.1

### Patch Changes

- [`275402d`](https://github.com/radoslavirha/toolkit-hub/commit/275402dad769703b6d1114efd69e3c480a60f97b) Thanks [@radoslavirha](https://github.com/radoslavirha)! - Updated packages

- Updated dependencies [[`275402d`](https://github.com/radoslavirha/toolkit-hub/commit/275402dad769703b6d1114efd69e3c480a60f97b)]:
  - @radoslavirha/utils@0.2.1
  - @radoslavirha/tsed-common@0.2.1

## 1.0.0

### Minor Changes

- [`84eec5a`](https://github.com/radoslavirha/toolkit-hub/commit/84eec5a427bf36486a170675d91113110685bb06) Thanks [@radoslavirha](https://github.com/radoslavirha)! - Updated packages

### Patch Changes

- Updated dependencies [[`84eec5a`](https://github.com/radoslavirha/toolkit-hub/commit/84eec5a427bf36486a170675d91113110685bb06)]:
  - @radoslavirha/utils@0.2.0
  - @radoslavirha/tsed-common@0.2.0

## 0.1.6

### Patch Changes

- [`64895df`](https://github.com/radoslavirha/toolkit-hub/commit/64895dfde44d470cc82604a5a60d29e61d8e297e) Thanks [@radoslavirha](https://github.com/radoslavirha)! - Improvements

- Updated dependencies [[`64895df`](https://github.com/radoslavirha/toolkit-hub/commit/64895dfde44d470cc82604a5a60d29e61d8e297e)]:
  - @radoslavirha/tsed-common@0.1.6

## 0.1.5

### Patch Changes

- [`d3b072a`](https://github.com/radoslavirha/toolkit-hub/commit/d3b072a1268d066a0563acc279e7e68a238019bc) Thanks [@radoslavirha](https://github.com/radoslavirha)! - Updated vulnerable libraries

- Updated dependencies [[`d3b072a`](https://github.com/radoslavirha/toolkit-hub/commit/d3b072a1268d066a0563acc279e7e68a238019bc)]:
  - @radoslavirha/utils@0.1.4
  - @radoslavirha/tsed-common@0.1.5

## 0.1.4

### Patch Changes

- [`ed4ce14`](https://github.com/radoslavirha/toolkit-hub/commit/ed4ce147d2a1241d587c9380726240cc3c93e4af) Thanks [@radoslavirha](https://github.com/radoslavirha)! - Fix peerDependencies

- Updated dependencies [[`ed4ce14`](https://github.com/radoslavirha/toolkit-hub/commit/ed4ce147d2a1241d587c9380726240cc3c93e4af)]:
  - @radoslavirha/utils@0.1.3
  - @radoslavirha/tsed-common@0.1.4

## 0.1.3

### Patch Changes

- [`06f0c3f`](https://github.com/radoslavirha/toolkit-hub/commit/06f0c3f56904fc7846865aeb849f269a350cc038) Thanks [@radoslavirha](https://github.com/radoslavirha)! - Update libraries

- Updated dependencies [[`06f0c3f`](https://github.com/radoslavirha/toolkit-hub/commit/06f0c3f56904fc7846865aeb849f269a350cc038)]:
  - @radoslavirha/utils@0.1.2
  - @radoslavirha/tsed-common@0.1.3

## 0.1.2

### Patch Changes

- [`72c38aa`](https://github.com/radoslavirha/toolkit-hub/commit/72c38aaa16e0d47f8d307b9b36bf07f56395507d) Thanks [@radoslavirha](https://github.com/radoslavirha)! - Make ConfigProvider injectable

- Updated dependencies [[`72c38aa`](https://github.com/radoslavirha/toolkit-hub/commit/72c38aaa16e0d47f8d307b9b36bf07f56395507d)]:
  - @radoslavirha/tsed-common@0.1.2

## 0.1.1

### Patch Changes

- Updated dependencies [[`a4dfc8e`](https://github.com/radoslavirha/toolkit-hub/commit/a4dfc8e4be98cbfe92d5c686cdd3fe250a9c806b)]:
  - @radoslavirha/utils@0.1.1
  - @radoslavirha/tsed-common@0.1.1
