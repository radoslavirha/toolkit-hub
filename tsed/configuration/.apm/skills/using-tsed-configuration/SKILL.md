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
`serviceName`, `version`, `description` and `publicURL` — extend it, do not restate those
fields.

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
