---
"@radoslavirha/tsed-common": patch
---

`JSONSchemaValidator` now validates a property typed as a discriminator base model (`@Property(Base)`, `@ArrayOf(Base)`) against its subtypes, instead of returning unvalidated subtype instances.
