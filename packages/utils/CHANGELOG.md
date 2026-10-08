# @radoslavirha/utils

## 0.9.6

### Patch Changes

- [#295](https://github.com/radoslavirha/toolkit-hub/pull/295) [`18615e6`](https://github.com/radoslavirha/toolkit-hub/commit/18615e60439f1a35b3b01fc6c9b3174d92a77d18) Thanks [@claude-agent-irha](https://github.com/apps/claude-agent-irha)! - `ObjectUtils.mergeDeep` now concatenates arrays passed as the root target and source instead of overwriting by index.

- [#304](https://github.com/radoslavirha/toolkit-hub/pull/304) [`126c4b7`](https://github.com/radoslavirha/toolkit-hub/commit/126c4b7fb387cd4e811c6a5581ec5a1e31461c71) Thanks [@claude-agent-irha](https://github.com/apps/claude-agent-irha)! - `ObjectUtils.mergeDeep` no longer mutates or aliases an `Error` nested in its inputs.

- [#315](https://github.com/radoslavirha/toolkit-hub/pull/315) [`f753994`](https://github.com/radoslavirha/toolkit-hub/commit/f753994504a9f402891b39622b8c93b398ed8f81) Thanks [@claude-agent-irha](https://github.com/apps/claude-agent-irha)! - Fix `ObjectUtils.cloneDeep` duplicating objects that are shared with, or form a cycle through, an `Error`; aliasing and cycles are now preserved.

- [#312](https://github.com/radoslavirha/toolkit-hub/pull/312) [`ce5183f`](https://github.com/radoslavirha/toolkit-hub/commit/ce5183faa81078f9ba324e4abffd74388c814d42) Thanks [@radoslavirha](https://github.com/radoslavirha)! - Agent skills only, no runtime code changed: name the Docker prerequisite for MongoDB testcontainers, add run-fix-rerun loops after linting, add an entity checklist to tsed-mongoose, inline the redaction selector syntax instead of pointing at the README, and stop stating section counts that had drifted.
- Updated dependencies []:
  - @radoslavirha/types@0.4.8

## 0.9.5

### Patch Changes

- [#272](https://github.com/radoslavirha/toolkit-hub/pull/272) [`2b5679a`](https://github.com/radoslavirha/toolkit-hub/commit/2b5679a3d30ee4dfa9db9d0ea4da73241a12ba46) Thanks [@claude-agent-irha](https://github.com/apps/claude-agent-irha)! - `ObjectUtils.mergeDeep` no longer shares array elements or nested values with `source`, so mutating the result cannot mutate the caller's input.

- [#273](https://github.com/radoslavirha/toolkit-hub/pull/273) [`c15879b`](https://github.com/radoslavirha/toolkit-hub/commit/c15879b40409decebf6ce44638151ef6ca3b8778) Thanks [@claude-agent-irha](https://github.com/apps/claude-agent-irha)! - `CommonUtils.buildModelCore` now drops `id`, `_id`, `createdAt` and `updatedAt` from the data at runtime, as documented, instead of only in the type.

- [#275](https://github.com/radoslavirha/toolkit-hub/pull/275) [`14f4409`](https://github.com/radoslavirha/toolkit-hub/commit/14f4409812be67337859b9389438a3b6c1c5493b) Thanks [@claude-agent-irha](https://github.com/apps/claude-agent-irha)! - `ObjectUtils.cloneDeep` now clones `Error` instances (including nested ones) instead of returning `{}` or a shared reference.

- [`c71ecb6`](https://github.com/radoslavirha/toolkit-hub/commit/c71ecb6c83130add1a2e41c8713cdd3e2639addb) Thanks [@radoslavirha](https://github.com/radoslavirha)! - Update packages
- Updated dependencies [[`c71ecb6`](https://github.com/radoslavirha/toolkit-hub/commit/c71ecb6c83130add1a2e41c8713cdd3e2639addb)]:
  - @radoslavirha/types@0.4.8

## 0.9.4

### Patch Changes

- [#265](https://github.com/radoslavirha/toolkit-hub/pull/265) [`eee3673`](https://github.com/radoslavirha/toolkit-hub/commit/eee3673b6486ce94e4d2e44a5c12f0c4c2321bb0) Thanks [@claude-agent-irha](https://github.com/apps/claude-agent-irha)! - `ObjectUtils.mergeDeep` now deep-merges class instances in the source into the target subtree instead of replacing it.

## 0.9.3

### Patch Changes

- [#235](https://github.com/radoslavirha/toolkit-hub/pull/235) [`13ca524`](https://github.com/radoslavirha/toolkit-hub/commit/13ca52450814163eb5f694f1cc9b7b4d98f4f6c8) Thanks [@radoslavirha](https://github.com/radoslavirha)! - `ObjectUtils.mergeDeep` no longer mutates class instances nested in `target`; the result now holds independent copies of them.

- [#237](https://github.com/radoslavirha/toolkit-hub/pull/237) [`ad3a682`](https://github.com/radoslavirha/toolkit-hub/commit/ad3a682a226c392fe7b649306971bf8185c07520) Thanks [@radoslavirha](https://github.com/radoslavirha)! - `GeoUtils.calculateKmBetweenCoordinates` now returns half the Earth's circumference for antipodal points instead of `NaN`.
- Updated dependencies [[`b8a2bbb`](https://github.com/radoslavirha/toolkit-hub/commit/b8a2bbb76c13b7467a49eb5055eb796e21111e08)]:
  - @radoslavirha/types@0.4.7

## 0.9.2

### Patch Changes

- [`58987a4`](https://github.com/radoslavirha/toolkit-hub/commit/58987a4aa81d3d4e706b5c7baca51c1ab31d91ad) Thanks [@radoslavirha](https://github.com/radoslavirha)! - Fix peer dependency, rollback pnpm
- Updated dependencies [[`58987a4`](https://github.com/radoslavirha/toolkit-hub/commit/58987a4aa81d3d4e706b5c7baca51c1ab31d91ad)]:
  - @radoslavirha/types@0.4.6

## 0.9.1

### Patch Changes

- [`87a3a08`](https://github.com/radoslavirha/toolkit-hub/commit/87a3a080b81aced77c2728df4681b39c6ea80686) Thanks [@radoslavirha](https://github.com/radoslavirha)! - Update packages
- Updated dependencies [[`87a3a08`](https://github.com/radoslavirha/toolkit-hub/commit/87a3a080b81aced77c2728df4681b39c6ea80686)]:
  - @radoslavirha/types@0.4.5

## 0.9.0

### Minor Changes

- [#169](https://github.com/radoslavirha/toolkit-hub/pull/169) [`5281353`](https://github.com/radoslavirha/toolkit-hub/commit/528135319ec3d81325cf8d28fca953a9f1fa058a) Thanks [@radoslavirha](https://github.com/radoslavirha)! - Add the type guards the toolkit was missing, so every basic `typeof`/`instanceof` check has a narrowing equivalent:
  
  - `NumberUtils.isNumber` — follows `typeof` semantics, so `NaN` passes
  - `NumberUtils.isFiniteNumber` — excludes `NaN`, `Infinity` and `-Infinity`, for values that must survive arithmetic
  - `CommonUtils.isFunction` — narrows to a callable
  - `ObjectUtils.isDate` — succeeds for Dates created in another realm, where `instanceof Date` fails
  - `StringUtils.isNotEmpty` — a string with at least one non-whitespace character, distinct from `isString` (accepts `''`) and `CommonUtils.isEmpty` (also covers arrays and objects)
  
  Also ships an opt-in ESLint flat config at `@radoslavirha/utils/eslint` that flags hand-rolled equivalents of these guards — raw null and undefined comparisons, `typeof` tests for string, boolean, number and function, `x instanceof Date`, `Array.isArray`, `JSON.parse(JSON.stringify(...))`, and lodash imports. It is exported as a plain flat-config array, so it adds no ESLint dependency, and it lives here rather than in `@radoslavirha/config-eslint` so a rule can never recommend a method the installed version lacks.

### Patch Changes

- Updated dependencies []:
  - @radoslavirha/types@0.4.4

## 0.8.6

### Patch Changes

- Updated dependencies [[`f8354e9`](https://github.com/radoslavirha/toolkit-hub/commit/f8354e9138ebc1debdfeb42b03a7ffd3282e871b)]:
  - @radoslavirha/types@0.4.4

## 0.8.5

### Patch Changes

- [#162](https://github.com/radoslavirha/toolkit-hub/pull/162) [`086e150`](https://github.com/radoslavirha/toolkit-hub/commit/086e150cb25fe2aa84cb097a212547014f36acc8) Thanks [@radoslavirha](https://github.com/radoslavirha)! - Ship agent guidance with the package as an APM skill (`using-utils`): which
  toolkit predicate replaces a raw null/undefined/type check, which `buildModel*`
  variant fits which situation (and why `buildModel` is deprecated), how
  `MappingUtils` preserves nullability, and a "do not reimplement" list for the
  semantic misses a linter cannot catch.
  
  The skill ships from git and is not part of the npm tarball, so this release
  carries no runtime change.

## 0.8.4

### Patch Changes

- [`b5b6441`](https://github.com/radoslavirha/toolkit-hub/commit/b5b64411b7f366c10ef0412ed4819784208b0316) Thanks [@radoslavirha](https://github.com/radoslavirha)! - Update packages

- Updated dependencies [[`b5b6441`](https://github.com/radoslavirha/toolkit-hub/commit/b5b64411b7f366c10ef0412ed4819784208b0316)]:
  - @radoslavirha/types@0.4.3

## 0.8.3

### Patch Changes

- [`57a17b4`](https://github.com/radoslavirha/toolkit-hub/commit/57a17b4381c427fd71b22a8aceaedc33568f8f1f) Thanks [@radoslavirha](https://github.com/radoslavirha)! - Improve Ts.ED logs

## 0.8.2

### Patch Changes

- [`58dd739`](https://github.com/radoslavirha/toolkit-hub/commit/58dd739ff2b17064148ccd82826d779957603dc7) Thanks [@radoslavirha](https://github.com/radoslavirha)! - Update pnpm to 11.8

- [`b4e3cfd`](https://github.com/radoslavirha/toolkit-hub/commit/b4e3cfd8476df7e8d0b6f6e8e6a60a9851485255) Thanks [@radoslavirha](https://github.com/radoslavirha)! - Update dependencies

- Updated dependencies [[`58dd739`](https://github.com/radoslavirha/toolkit-hub/commit/58dd739ff2b17064148ccd82826d779957603dc7), [`b4e3cfd`](https://github.com/radoslavirha/toolkit-hub/commit/b4e3cfd8476df7e8d0b6f6e8e6a60a9851485255)]:
  - @radoslavirha/types@0.4.2

## 0.8.1

### Patch Changes

- [`193bfc1`](https://github.com/radoslavirha/toolkit-hub/commit/193bfc1670ecc59cf7617d0b6603fe54a0d9529c) Thanks [@radoslavirha](https://github.com/radoslavirha)! - Update packages [#2](https://github.com/radoslavirha/toolkit-hub/issues/2)

- Updated dependencies [[`193bfc1`](https://github.com/radoslavirha/toolkit-hub/commit/193bfc1670ecc59cf7617d0b6603fe54a0d9529c)]:
  - @radoslavirha/types@0.4.1

## 0.8.0

### Minor Changes

- [`c3c8c2a`](https://github.com/radoslavirha/toolkit-hub/commit/c3c8c2a22065c352f2bead2cff09635bb1ad4677) Thanks [@radoslavirha](https://github.com/radoslavirha)! - pnpm update to v11

### Patch Changes

- Updated dependencies [[`c3c8c2a`](https://github.com/radoslavirha/toolkit-hub/commit/c3c8c2a22065c352f2bead2cff09635bb1ad4677)]:
  - @radoslavirha/types@0.4.0

## 0.7.7

### Patch Changes

- [`80e0748`](https://github.com/radoslavirha/toolkit-hub/commit/80e07488b956d95194f79567dcb80e804792ca2b) Thanks [@radoslavirha](https://github.com/radoslavirha)! - Typescript config

- Updated dependencies [[`80e0748`](https://github.com/radoslavirha/toolkit-hub/commit/80e07488b956d95194f79567dcb80e804792ca2b)]:
  - @radoslavirha/types@0.3.9

## 0.7.6

### Patch Changes

- [`b6c768d`](https://github.com/radoslavirha/toolkit-hub/commit/b6c768defea2cce2fcb6b0b9de11d5f17a5cc7c0) Thanks [@radoslavirha](https://github.com/radoslavirha)! - Update dependencies

- Updated dependencies [[`b6c768d`](https://github.com/radoslavirha/toolkit-hub/commit/b6c768defea2cce2fcb6b0b9de11d5f17a5cc7c0)]:
  - @radoslavirha/types@0.3.8

## 0.7.5

### Patch Changes

- [`6c97cf1`](https://github.com/radoslavirha/toolkit-hub/commit/6c97cf184920104cd9587a5a006ef30e3653292e) Thanks [@radoslavirha](https://github.com/radoslavirha)! - Improve logger

- Updated dependencies [[`6c97cf1`](https://github.com/radoslavirha/toolkit-hub/commit/6c97cf184920104cd9587a5a006ef30e3653292e)]:
  - @radoslavirha/types@0.3.7

## 0.7.4

### Patch Changes

- [`a4b7c85`](https://github.com/radoslavirha/toolkit-hub/commit/a4b7c8525fa3d877ef3b6b43703ce34a7eeff962) Thanks [@radoslavirha](https://github.com/radoslavirha)! - Update dependencies

- Updated dependencies [[`a4b7c85`](https://github.com/radoslavirha/toolkit-hub/commit/a4b7c8525fa3d877ef3b6b43703ce34a7eeff962)]:
  - @radoslavirha/types@0.3.6

## 0.7.3

### Patch Changes

- [`da99054`](https://github.com/radoslavirha/toolkit-hub/commit/da9905404fc64f0216d4de8c3042ececbddfa0c7) Thanks [@radoslavirha](https://github.com/radoslavirha)! - Update dependencies

- Updated dependencies [[`da99054`](https://github.com/radoslavirha/toolkit-hub/commit/da9905404fc64f0216d4de8c3042ececbddfa0c7)]:
  - @radoslavirha/types@0.3.5

## 0.7.2

### Patch Changes

- [`25c009f`](https://github.com/radoslavirha/toolkit-hub/commit/25c009f103ddb8b1745b52294e94704c45ae5aab) Thanks [@radoslavirha](https://github.com/radoslavirha)! - Fix vitest config

## 0.7.1

### Patch Changes

- [`e995c4d`](https://github.com/radoslavirha/toolkit-hub/commit/e995c4d30781c53a4cd98914082c2a2e60e4d4b0) Thanks [@radoslavirha](https://github.com/radoslavirha)! - Update dependencies

- [`bb3373a`](https://github.com/radoslavirha/toolkit-hub/commit/bb3373a6fd9fbeceb4fb44dd4a3dad3cc5d28f7e) Thanks [@radoslavirha](https://github.com/radoslavirha)! - Improve build

- Updated dependencies [[`e995c4d`](https://github.com/radoslavirha/toolkit-hub/commit/e995c4d30781c53a4cd98914082c2a2e60e4d4b0)]:
  - @radoslavirha/types@0.3.4

## 0.7.0

### Minor Changes

- [`0a541ba`](https://github.com/radoslavirha/toolkit-hub/commit/0a541ba997c106955e01146bf59cb37f5d06b0b7) Thanks [@radoslavirha](https://github.com/radoslavirha)! - New CommonUtils.buildModelCore

## 0.6.1

### Patch Changes

- [`ed0527e`](https://github.com/radoslavirha/toolkit-hub/commit/ed0527e4a838567136383da8be36d064c84cef5c) Thanks [@radoslavirha](https://github.com/radoslavirha)! - Update dependencies

- Updated dependencies [[`ed0527e`](https://github.com/radoslavirha/toolkit-hub/commit/ed0527e4a838567136383da8be36d064c84cef5c)]:
  - @radoslavirha/types@0.3.3

## 0.6.0

### Minor Changes

- [`fff3c81`](https://github.com/radoslavirha/toolkit-hub/commit/fff3c81c691014fdd2366f40be97e8cd5f9c695e) Thanks [@radoslavirha](https://github.com/radoslavirha)! - New CommonUtils.buildModelStrict

## 0.5.2

### Patch Changes

- [`cefab8c`](https://github.com/radoslavirha/toolkit-hub/commit/cefab8cb4dafc05e6a31618014ec8cfc0ea967a3) Thanks [@radoslavirha](https://github.com/radoslavirha)! - Update docs, dependencies

- Updated dependencies [[`cefab8c`](https://github.com/radoslavirha/toolkit-hub/commit/cefab8cb4dafc05e6a31618014ec8cfc0ea967a3)]:
  - @radoslavirha/types@0.3.2

## 0.5.1

### Patch Changes

- [`6951e80`](https://github.com/radoslavirha/toolkit-hub/commit/6951e80d87867b7843e5b79936dc92113a9a4932) Thanks [@radoslavirha](https://github.com/radoslavirha)! - Update dependencies

- Updated dependencies [[`6951e80`](https://github.com/radoslavirha/toolkit-hub/commit/6951e80d87867b7843e5b79936dc92113a9a4932)]:
  - @radoslavirha/types@0.3.1

## 0.5.0

### Minor Changes

- [`b9a6fe2`](https://github.com/radoslavirha/toolkit-hub/commit/b9a6fe200a0452ee6cffa1619f876dd95c3044ba) Thanks [@radoslavirha](https://github.com/radoslavirha)! - New ObjectUtils.isEnabled

## 0.4.0

### Minor Changes

- [`1e72ddf`](https://github.com/radoslavirha/toolkit-hub/commit/1e72ddf56b4d95d06d60519f1cfb52a6f1a9a898) Thanks [@radoslavirha](https://github.com/radoslavirha)! - New ObjectUtils.values() method

## 0.3.0

### Minor Changes

- [`f1b53cb`](https://github.com/radoslavirha/toolkit-hub/commit/f1b53cb89500d57b598a965eb78d1c69fe2851ef) Thanks [@radoslavirha](https://github.com/radoslavirha)! - Improvements, documentation

### Patch Changes

- Updated dependencies [[`f1b53cb`](https://github.com/radoslavirha/toolkit-hub/commit/f1b53cb89500d57b598a965eb78d1c69fe2851ef)]:
  - @radoslavirha/types@0.3.0

## 0.2.2

### Patch Changes

- [`6a55e71`](https://github.com/radoslavirha/toolkit-hub/commit/6a55e71471f663bc8c93e12b38fc2e0cd0bb20c4) Thanks [@radoslavirha](https://github.com/radoslavirha)! - CI fixes

- Updated dependencies [[`6a55e71`](https://github.com/radoslavirha/toolkit-hub/commit/6a55e71471f663bc8c93e12b38fc2e0cd0bb20c4)]:
  - @radoslavirha/types@0.2.2

## 0.2.1

### Patch Changes

- [`275402d`](https://github.com/radoslavirha/toolkit-hub/commit/275402dad769703b6d1114efd69e3c480a60f97b) Thanks [@radoslavirha](https://github.com/radoslavirha)! - Updated packages

- Updated dependencies [[`275402d`](https://github.com/radoslavirha/toolkit-hub/commit/275402dad769703b6d1114efd69e3c480a60f97b)]:
  - @radoslavirha/types@0.2.1

## 0.2.0

### Minor Changes

- [`84eec5a`](https://github.com/radoslavirha/toolkit-hub/commit/84eec5a427bf36486a170675d91113110685bb06) Thanks [@radoslavirha](https://github.com/radoslavirha)! - Updated packages

### Patch Changes

- Updated dependencies [[`84eec5a`](https://github.com/radoslavirha/toolkit-hub/commit/84eec5a427bf36486a170675d91113110685bb06)]:
  - @radoslavirha/types@0.2.0

## 0.1.4

### Patch Changes

- [`d3b072a`](https://github.com/radoslavirha/toolkit-hub/commit/d3b072a1268d066a0563acc279e7e68a238019bc) Thanks [@radoslavirha](https://github.com/radoslavirha)! - Updated vulnerable libraries

## 0.1.3

### Patch Changes

- [`ed4ce14`](https://github.com/radoslavirha/toolkit-hub/commit/ed4ce147d2a1241d587c9380726240cc3c93e4af) Thanks [@radoslavirha](https://github.com/radoslavirha)! - Fix peerDependencies

## 0.1.2

### Patch Changes

- [`06f0c3f`](https://github.com/radoslavirha/toolkit-hub/commit/06f0c3f56904fc7846865aeb849f269a350cc038) Thanks [@radoslavirha](https://github.com/radoslavirha)! - Update libraries

## 0.1.1

### Patch Changes

- [`a4dfc8e`](https://github.com/radoslavirha/toolkit-hub/commit/a4dfc8e4be98cbfe92d5c686cdd3fe250a9c806b) Thanks [@radoslavirha](https://github.com/radoslavirha)! - New @radoslavirha/tsed-common and @radoslavirha/tsed-mongoose

## 0.1.0

### Minor Changes

- [`90d1c89`](https://github.com/radoslavirha/toolkit-hub/commit/90d1c891af365e4b60d6ef6c50b0b96ba1296206) Thanks [@radoslavirha](https://github.com/radoslavirha)! - Update Node.js to 22.14.0

## 0.0.6

### Patch Changes

- [`3e3426e`](https://github.com/radoslavirha/toolkit-hub/commit/3e3426e9c1e24ce7c7434d3012b4f61ebd2a8562) Thanks [@radoslavirha](https://github.com/radoslavirha)! - Correctly export GeoUtils

## 0.0.5

### Patch Changes

- [`ae83c31`](https://github.com/radoslavirha/toolkit-hub/commit/ae83c315d49ea65e121841bc0a7e6b2bf3481c9c) Thanks [@radoslavirha](https://github.com/radoslavirha)! - New GeoUtils + extended NumberUtils

## 0.0.4

### Patch Changes

- [`225f006`](https://github.com/radoslavirha/toolkit-hub/commit/225f00601852ac6e4fedfef036ed12665352f0c2) Thanks [@radoslavirha](https://github.com/radoslavirha)! - New NumberUtils

## 0.0.3

### Patch Changes

- [`8512c23`](https://github.com/radoslavirha/toolkit-hub/commit/8512c23b8ac5a9aae902a7ab9e0bd2421fa8998d) Thanks [@radoslavirha](https://github.com/radoslavirha)! - New CommonUtils.buildModel() method

## 0.0.2

### Patch Changes

- [`a0f50e2`](https://github.com/radoslavirha/toolkit-hub/commit/a0f50e2a6505aabda26153b5e2f11d623fbb5952) Thanks [@radoslavirha](https://github.com/radoslavirha)! - new packages
