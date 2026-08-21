---
name: building-a-tsed-service
description: Use when starting a new Ts.ED service, deciding which @radoslavirha packages a service needs, or wiring configuration, server, database and OpenAPI together at bootstrap. Covers the three service shapes, the layer order requests flow through, and the bootstrap sequence. Per-package detail lives in each package's own skill.
---

# Building a Ts.ED service from the toolkit

This is the assembly view. What each package does in detail belongs to its own skill
(`using-tsed-platform`, `using-tsed-mongoose`, …) — install those for the packages you
actually depend on.

## Pick the shape first

| Service shape | Packages |
|---|---|
| REST API with MongoDB | `tsed-platform`, `tsed-configuration`, `tsed-swagger`, `tsed-mongoose`, `tsed-common`, `utils` |
| REST API, no database | `tsed-platform`, `tsed-configuration`, `tsed-swagger`, `utils` |
| Background worker with MongoDB | `tsed-platform`, `tsed-configuration`, `tsed-mongoose`, `tsed-common`, `utils` |

A worker needs no `tsed-swagger` and no controllers; an API without persistence needs no
mappers or repositories. Adding a package "in case" costs a dependency and a set of
conventions nobody is following.

```bash
pnpm --filter YOUR_SERVICE add @radoslavirha/tsed-platform @radoslavirha/tsed-configuration
```

## The layer order

```
Controller  →  Handler  →  Service  →  Mapper  →  Repository  →  Mongoose
```

Each layer knows only the one below it. Two consequences worth stating, because they are the
ones that get broken:

- **A Mongoose document type never reaches a controller.** The mapper is the only place the
  document and the API model meet.
- **Controllers do not contain logic.** They validate input and delegate to a handler's
  `execute()` — never to `performOperation()`, which is protected precisely so the timing,
  logging and error handling in `execute()` cannot be bypassed.

## Bootstrap sequence

The order is fixed, because each step consumes the previous one:

1. Resolve configuration through the injector — `injector().get<ConfigService>(ConfigService)`.
   Never construct it; a second instance has its own loaded state.
2. Build `ServerConfiguration` from `config.server` plus the required `api` metadata.
3. Add the pieces the shape needs: `mongoose: [...]` for persistence, the output of
   `SwaggerProvider` for OpenAPI.
4. `Platform.bootstrap(configuration)` — the server class travels in the configuration as
   `rootModule` — then `listen()`.

```ts ignore
const config = injector().get<ConfigService>(ConfigService);

const configuration: ServerConfiguration = {
    rootModule: Server,
    ...config.server,
    api: config.api,
    mongoose: [{ url: config.config.mongodb.url }]
};

const platform = await Platform.bootstrap(configuration);
await platform.listen();
```

## Conventions that span the whole service

- **Mount controllers by value**, never by glob — a glob resolves differently in `src` and
  `dist`, so it works in development and mounts nothing after a build.
- **Log through the injected `Logger`**, deriving a child per subsystem
  (`logger.child('HTTP_REQUEST')`). Scope naming is `SUBSYSTEM` or `SUBSYSTEM:instance`.
- **Redact before logging.** The logger is a transport and will not sanitise; anything
  carrying payloads or headers goes through a `RedactionProfile` first.
- **Reach for `@radoslavirha/utils` before hand-rolling** a null check, a type test, a deep
  clone or a distance calculation.
