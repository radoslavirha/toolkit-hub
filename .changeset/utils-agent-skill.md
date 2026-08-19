---
"@radoslavirha/utils": patch
---

Ship agent guidance with the package as an APM skill (`using-utils`): which
toolkit predicate replaces a raw null/undefined/type check, which `buildModel*`
variant fits which situation (and why `buildModel` is deprecated), how
`MappingUtils` preserves nullability, and a "do not reimplement" list for the
semantic misses a linter cannot catch.

The skill ships from git and is not part of the npm tarball, so this release
carries no runtime change.
