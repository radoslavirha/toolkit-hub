---
"@radoslavirha/tsed-common": patch
---

`JSONSchemaValidator.validate` now validates a discriminator base model against its subtypes' schemas instead of returning an unvalidated subtype instance.
