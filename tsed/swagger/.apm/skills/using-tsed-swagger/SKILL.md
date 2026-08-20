---
name: using-tsed-swagger
description: Use when adding OpenAPI documentation to a Ts.ED service, configuring one or more API versions, adding a security scheme, or wiring SwaggerProvider into the server configuration. Covers building the config models rather than passing object literals, and the document fields that are easy to guess wrong.
---

# Using @radoslavirha/tsed-swagger

Turns a small `SwaggerConfig` into Ts.ED's `SwaggerSettings[]`, with one entry per documented
API version.

## Build the models, do not pass literals

The config classes are decorated Ts.ED models, so their defaults and validation only apply
when you actually construct them. An object literal that looks right silently skips both:

```ts ignore
// wrong — literal with invented field names
documents: [{ path: '/v1', version: 'v1', securitySchemes: [...] }]

// right — a real model instance
documents: [
    CommonUtils.buildModelStrict(SwaggerDocumentConfig, {
        docs: 'v1',
        security: [SwaggerSecurityScheme.BEARER_JWT]
    })
]
```

Note the field names: **`docs`**, not `path` or `version`, and **`security`**, not
`securitySchemes`. `outFile` is optional and writes the generated spec to disk.

## Security schemes

`SwaggerSecurityScheme` is an enum with `BASIC` and `BEARER_JWT`. Reference the enum member
rather than a string — the provider maps it through `SWAGGER_SECURITY_SCHEMES` to a full
OpenAPI security definition, and an unknown string cannot be mapped.

## Wiring

`SwaggerProvider` extends `BaseConfigProvider`, so it is constructed with the validated
`SwaggerConfig` and produces the settings array the platform expects. Feed its output into
your `ServerConfiguration` alongside the rest; do not hand-write `SwaggerSettings` objects,
which is what this package exists to avoid.

Multiple documents are the normal case, not an edge case: one entry per API version keeps
`/v1` and `/v2` documented separately from a single service.
