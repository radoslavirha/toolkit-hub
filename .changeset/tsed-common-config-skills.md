---
"@radoslavirha/tsed-configuration": patch
"@radoslavirha/tsed-common": patch
---

Ship agent guidance as APM skills.

`using-tsed-configuration` covers extending the `BaseConfig` Zod schema, deriving the type with `z.infer` rather than hand-writing it, the `ConfigProvider` subclass and its typed accessors, and why configuration is resolved through the injector instead of constructed.

`using-tsed-common` covers `BaseModel`, the `Serializer` wrapper that makes the target type a required argument, and choosing between `JSONSchemaValidator` and `ZodValidator`.

Also corrects `ConfigProvider`'s JSDoc example, which imported and extended a `BaseConfigSchema` export that does not exist — the schema is exported as `BaseConfig`.
