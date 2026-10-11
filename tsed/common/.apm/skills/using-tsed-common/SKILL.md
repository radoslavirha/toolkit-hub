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

## Modelling null

Ts.ED 8.41 gets several obvious nullable declarations silently wrong. Use these:

| type | non-nullable | nullable |
|---|---|---|
| string / number / boolean | `@Property(T)` | `@Nullable(T)` |
| integer | `@Integer()` | `@Nullable(Number) @Integer()` |
| date-time | `@Property(Date) @DateTime()` | `@NullableDateTime()` |
| enum | `@Enum(E)` | `@NullableEnum(E)` |
| model | `@Property(Child)` | `@Nullable(Child)` |

- Always pass explicit types: `X | null` makes `design:type` `Object`, so a bare `@Property()` emits `{"type":"object"}`.
- `@Nullable(String) @Enum(E)`, `s.enums(E).nullable()` and `@Allow(null) @Enum(E)` reject `null`; use `@NullableEnum(E)`.
- `@Property(Date)` / `@Nullable(Date)` without `@DateTime()` accept any string; `@Allow(null)` silently makes the property required.
- A required string is non-empty (`@Required()` adds `minLength: 1`); use `@MinLength`/`@MaxLength` on optional strings. Do not use `@Required(true, '')`.
- Update semantics: absent = keep, `null` = clear, present = replace the whole value (objects, maps, arrays too). Per-key edits belong on dedicated sub-resource endpoints.
