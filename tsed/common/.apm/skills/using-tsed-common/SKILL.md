---
name: using-tsed-common
description: Use when defining an API model, serializing or deserializing between plain objects and model classes, or validating arbitrary input against a Ts.ED model or a Zod schema. Covers BaseModel, the Serializer wrapper that makes the target type mandatory, and choosing between JSONSchemaValidator and ZodValidator.
---

# Using @radoslavirha/tsed-common

`BaseModel` for API models, `Serializer` for converting between plain data and model
instances, validators for untrusted input, and `@ResourceId` for id parameters.

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
runtime check cannot disagree. It checks the raw input before deserializing, with standard
formats such as `date-time` registered and discriminated unions (`@DiscriminatorKey`) supported, and does not coerce: send `30`, not `"30"`, for a
`number`. Use `ZodValidator` for shapes that are not models, such as
configuration or third-party payloads.

Both throw on failure and return the typed value on success, so there is no separate "is it
valid" step to forget.

## ResourceId

Put `@ResourceId(pattern)` on `:id` path params, query params and body properties
(`@PathParams('id') @ResourceId(ResourceIdPattern.UUID) id: string`). Use a `ResourceIdPattern`
preset (`HEX_24`, `UUID`) or supply your own, so it suits any id format or storage. A malformed id is rejected with 400 at the API edge; a well-formed id
that matches nothing is still a 404 from the service. The pattern must have no regex flags —
encode case handling inside it. The schema it emits is the `pattern` plus a neutral description.

## ArrayOf, MapOf, EnumMapOf

Use these instead of `@CollectionOf` whenever a collection is nullable, a map, or enum-keyed.
SWC emits `design:type = Object` for `X | null`, so `@CollectionOf(Child)` on `Child[] | null`
stops being a collection and real arrays are rejected; these decorators set the collection type
explicitly.

- `@ArrayOf(Child, { nullable? })` → `Child[]` / `Child[] | null`
- `@MapOf(V, { nullable?, nullableValues?, mongoSafeKeys? })` → `Map<string, V>`; `mongoSafeKeys` rejects keys with `.` or a leading `$` (Mongoose fails with a 500 on them)
- `@EnumMapOf(Enum, V, { nullable?, nullableValues?, exhaustive? })` → keys limited to enum values; `exhaustive` requires every one

`nullableValues` works for scalar value types only (`String`, `Number`, `Boolean`, `Date`);
with a model class it throws when the decorator is applied. Models in a collection
deserialize to class instances, maps to `Map`. Pair with `@Required()` when the property must
be present.
