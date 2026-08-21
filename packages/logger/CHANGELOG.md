# @radoslavirha/logger

## 0.4.3

### Patch Changes

- [#169](https://github.com/radoslavirha/toolkit-hub/pull/169) [`5281353`](https://github.com/radoslavirha/toolkit-hub/commit/528135319ec3d81325cf8d28fca953a9f1fa058a) Thanks [@radoslavirha](https://github.com/radoslavirha)! - Use the toolkit type guards instead of hand-rolled `typeof`/`undefined` checks. `StringUtils.isString`, `CommonUtils.isUndefined` and `CommonUtils.notUndefined` replace four raw checks in `redaction` and six in `logger`.
  
  Both packages gain `@radoslavirha/utils` as a dependency. They remain framework-agnostic — that has always meant no Ts.ED coupling, not no dependencies. Measured cost: 4.9 MB on disk and a 33 ms one-time import, with per-call overhead around 4 ns, which is immaterial next to the serialisation and transport work these packages do. Consumers that already depend on `@radoslavirha/utils` — every Ts.ED service, via `tsed-logger` — pay nothing.
  
  `RedactionProfile`'s enablement check keeps its own semantics rather than moving to `ObjectUtils.isEnabled`: absent options count as enabled here, while `isEnabled` requires an explicit `true`.
- Updated dependencies [[`5281353`](https://github.com/radoslavirha/toolkit-hub/commit/528135319ec3d81325cf8d28fca953a9f1fa058a)]:
  - @radoslavirha/utils@0.9.0

## 0.4.2

### Patch Changes

- [#166](https://github.com/radoslavirha/toolkit-hub/pull/166) [`4f38c21`](https://github.com/radoslavirha/toolkit-hub/commit/4f38c21f5849de053391774441ba0e7cdcbae451) Thanks [@radoslavirha](https://github.com/radoslavirha)! - Ship agent guidance as APM skills.
  
  `using-logger` covers the child-scope convention and the rule that the logger is a pure transport that neither redacts nor understands HTTP, plus the structural-port pattern for framework-free packages.
  
  `using-redaction` covers compiling one `RedactionProfile` at construction, `collect()` per call, and redacting before the logger rather than expecting it to sanitise.
  
  `using-tsed-logger` covers injecting `Logger`, deriving scoped children, and registering a subclass under the `Logger` token — including the double-decoration mistake that registers two providers.
  
  `using-tsed-swagger` covers building `SwaggerDocumentConfig` instead of passing object literals, and the field names (`docs`, `security`) that are easy to guess wrong.

## 0.4.1

### Patch Changes

- [`b5b6441`](https://github.com/radoslavirha/toolkit-hub/commit/b5b64411b7f366c10ef0412ed4819784208b0316) Thanks [@radoslavirha](https://github.com/radoslavirha)! - Update packages

## 0.4.0

### Minor Changes

- [`9b1d46d`](https://github.com/radoslavirha/toolkit-hub/commit/9b1d46d4ef780917a346ac5d55aa8b59c685c083) Thanks [@radoslavirha](https://github.com/radoslavirha)! - Flat metadata, redaction

## 0.3.2

### Patch Changes

- [`58dd739`](https://github.com/radoslavirha/toolkit-hub/commit/58dd739ff2b17064148ccd82826d779957603dc7) Thanks [@radoslavirha](https://github.com/radoslavirha)! - Update pnpm to 11.8

- [`b4e3cfd`](https://github.com/radoslavirha/toolkit-hub/commit/b4e3cfd8476df7e8d0b6f6e8e6a60a9851485255) Thanks [@radoslavirha](https://github.com/radoslavirha)! - Update dependencies

## 0.3.1

### Patch Changes

- [`193bfc1`](https://github.com/radoslavirha/toolkit-hub/commit/193bfc1670ecc59cf7617d0b6603fe54a0d9529c) Thanks [@radoslavirha](https://github.com/radoslavirha)! - Update packages [#2](https://github.com/radoslavirha/toolkit-hub/issues/2)

## 0.3.0

### Minor Changes

- [`c3c8c2a`](https://github.com/radoslavirha/toolkit-hub/commit/c3c8c2a22065c352f2bead2cff09635bb1ad4677) Thanks [@radoslavirha](https://github.com/radoslavirha)! - pnpm update to v11

## 0.2.5

### Patch Changes

- [`80e0748`](https://github.com/radoslavirha/toolkit-hub/commit/80e07488b956d95194f79567dcb80e804792ca2b) Thanks [@radoslavirha](https://github.com/radoslavirha)! - Typescript config

## 0.2.4

### Patch Changes

- [`b6c768d`](https://github.com/radoslavirha/toolkit-hub/commit/b6c768defea2cce2fcb6b0b9de11d5f17a5cc7c0) Thanks [@radoslavirha](https://github.com/radoslavirha)! - Update dependencies

## 0.2.3

### Patch Changes

- [`6c97cf1`](https://github.com/radoslavirha/toolkit-hub/commit/6c97cf184920104cd9587a5a006ef30e3653292e) Thanks [@radoslavirha](https://github.com/radoslavirha)! - Improve logger

## 0.2.2

### Patch Changes

- [`a4b7c85`](https://github.com/radoslavirha/toolkit-hub/commit/a4b7c8525fa3d877ef3b6b43703ce34a7eeff962) Thanks [@radoslavirha](https://github.com/radoslavirha)! - Update dependencies

- [`6cc8552`](https://github.com/radoslavirha/toolkit-hub/commit/6cc85522c56030ceb55c03bb29e378143e0f836c) Thanks [@radoslavirha](https://github.com/radoslavirha)! - Logger improvements

## 0.2.1

### Patch Changes

- [`245878e`](https://github.com/radoslavirha/toolkit-hub/commit/245878e2265ae8d186bc5d341e430884ebcf4e43) Thanks [@radoslavirha](https://github.com/radoslavirha)! - Rename logLevel to level

## 0.2.0

### Minor Changes

- [`8d9b7b5`](https://github.com/radoslavirha/toolkit-hub/commit/8d9b7b5f39ec183afa10a734b6d7d27e3deb9b40) Thanks [@radoslavirha](https://github.com/radoslavirha)! - Logger implementation

## 0.1.2

### Patch Changes

- [`0f32705`](https://github.com/radoslavirha/toolkit-hub/commit/0f32705a03f539d5fd7345a35cff868b9e4ac2ad) Thanks [@radoslavirha](https://github.com/radoslavirha)! - Log properties order

- [`da99054`](https://github.com/radoslavirha/toolkit-hub/commit/da9905404fc64f0216d4de8c3042ececbddfa0c7) Thanks [@radoslavirha](https://github.com/radoslavirha)! - Update dependencies

## 0.1.1

### Patch Changes

- [`42a27fb`](https://github.com/radoslavirha/toolkit-hub/commit/42a27fb39408a87bc6c3489a2c386c177f19a6dc) Thanks [@radoslavirha](https://github.com/radoslavirha)! - New logger (winston wrapper)
