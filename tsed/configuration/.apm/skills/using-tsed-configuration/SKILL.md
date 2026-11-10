---
name: using-tsed-configuration
description: Use when defining a service's configuration schema, adding a config value, reading configuration inside a service or controller, or wiring configuration into the server bootstrap. Covers extending the BaseConfig Zod schema, the ConfigProvider subclass, and why configuration is resolved through the injector rather than constructed.
---

# Using @radoslavirha/tsed-configuration

Configuration is a **validated, injected singleton**. Its shape is a Zod schema extending the
toolkit's base schema, and every service reads it the same way.

## Define the schema, derive the type

```ts ignore
import { z } from 'zod';
import { BaseConfig } from '@radoslavirha/tsed-configuration';

export const AppConfigSchema = BaseConfig.extend({
    databaseUrl: z.string()
});

export type AppConfig = z.infer<typeof AppConfigSchema>;
```

Never hand-write the config interface alongside the schema — derive it with `z.infer`, or the
two drift and validation stops matching the type.

`BaseConfig` is exported as both the Zod object and the type inferred from it, so
`BaseConfig.extend({...})` and `BaseConfig` as a type both work. It already carries `server`,
`serviceName` and `publicURL` — extend it, do not restate those fields. `version` and
`description` are not config fields: they always come from `package.json` (into `config.api`),
and a `version`/`description` key in a config file is silently stripped.

## Wrap it in a provider

```ts ignore
@Injectable()
export class ConfigService extends ConfigProvider<AppConfig> {
    public static readonly options: ConfigProviderOptions<AppConfig> = {
        schema: AppConfigSchema
    };

    constructor() {
        super(ConfigService.options);
    }
}
```

`ConfigProvider` exposes typed accessors that a service should prefer over reaching into raw
values: `config` (your validated object), `api`, `server`, `envs`, `packageJson`, and
`isTest`. Sources — JSON files, environment variables, `package.json` — are merged and
validated before any of them are readable, so an invalid configuration fails at startup
rather than at first use.

## Where values come from

Sources are layered, later overriding earlier:

```
config/
  default.json         # base
  development.json     # NODE_ENV overrides
  production.json
  test.json
```

**`default.json` → `{NODE_ENV}.json` → environment variables.** Everything is merged and then
validated against the schema, so a missing or malformed value fails at startup rather than at
first read. `isTest` exists so code can branch on the test environment without re-reading
`NODE_ENV` itself.

Put a value in `default.json` when it is a sensible baseline, in an environment file when it
genuinely differs per environment, and in an environment variable when it is a secret or
provided by the deployment.

## Read it the same way everywhere

Resolve once at bootstrap, inject everywhere else:

```ts ignore
// bootstrap
const config = injector().get<ConfigService>(ConfigService);
const configuration: ServerConfiguration = { ...config.server, api: config.api };

// anywhere else
constructor(private config: ConfigService) {}
```

Constructing `new ConfigService()` in a service creates a second instance with its own loaded
state — the values may differ from the one the server booted with, and nothing will report it.

## Document it for people without the source

Every field gets a `.describe()` — that text, not JSDoc, is what reaches the generated
reference. Then render the schema to a `CONFIGURATION.md` beside the service README and pin it
with a file snapshot, so a schema change without a regenerated page fails the test run:

```ts ignore
it('CONFIGURATION.md matches the schema', async () => {
    await expect(ConfigDocs.render(AppConfigSchema, { title: 'my-api' }))
        .toMatchFileSnapshot('../../../CONFIGURATION.md');
});
```

Each variant of a union is printed as a closed `<details>` block under a visible `one of N`
heading, so a page with alternative shapes (auth methods, key sources) stays short on GitHub.
At every depth, an object, or the items of an array or map, whose table would hold more than
`collapseThreshold` rows (default 5) gets its own collapsed block, with its unions and its own big
children inside; smaller ones stay inline. A section's own table stays open. Pass
`collapseThreshold: Infinity` to keep everything inline except union variants.
Pass `collapseSections: true` to fold every top-level section's tables the same way.

`vitest -u` rewrites the page. The page describes the **input** shape: a key with a default is
optional, a transform's output is not shown, and a default that only a `z.preprocess` step
fills in is invisible unless the field's `.describe()` states it.
