---
name: using-tsed-common
description: Use when defining an API model, serializing or deserializing between plain objects and model classes, or validating arbitrary input against a Ts.ED model or a Zod schema. Covers BaseModel, the Serializer wrapper that makes the target type mandatory, and choosing between JSONSchemaValidator and ZodValidator.
---

# Using @radoslavirha/tsed-common

Four pieces: `BaseModel` for API models, `Serializer` for converting between plain data and
model instances, and two validators for untrusted input.

## BaseModel

Every model that leaves the service extends `BaseModel`, which contributes `id`, `createdAt`
and `updatedAt` with the right `@Property` / `@Format('date-time')` decorators. Declare only
your own fields on top — redeclaring the base fields breaks the schema Ts.ED generates for
OpenAPI.

## Serializer

A thin wrapper over `@tsed/json-mapper` whose point is that **the model type is a required
parameter**, not an inferred one:

- `Serializer.serialize(input, Type, options?)` → plain object
- `Serializer.deserialize(input, Type, options?)` → typed instance
- `Serializer.deserializeArray(input, Type, options?)` → typed instances

Passing the type explicitly is what makes decorator-driven conversion happen. A plain object
that merely has the right keys is not a model: dates stay strings and `@Property` mapping is
skipped.

## Validators

Both are static, both take the shape descriptor first and the untrusted input second:

| Input described by | Use | Signature |
|---|---|---|
| A Ts.ED model's decorators | `JSONSchemaValidator` | `validate(Model, input, debug?)` |
| A Zod schema | `ZodValidator` | `validate(schema, input, debug?)` |

Use `JSONSchemaValidator` when the shape already exists as a decorated model — it validates
against the same schema that produces your OpenAPI documentation, so the API contract and the
runtime check cannot disagree. Use `ZodValidator` for shapes that are not models, such as
configuration or third-party payloads.

Both throw on failure and return the typed value on success, so there is no separate "is it
valid" step to forget.
