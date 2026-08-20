---
name: using-tsed-logger
description: Use when logging inside a Ts.ED service, injecting a logger into an injectable, or subclassing the toolkit logger to feed it configuration. Covers injecting Logger and calling child(), the exact decorator a subclass needs so DI resolves one singleton, and the mistake of decorating that subclass twice.
---

# Using @radoslavirha/tsed-logger

The DI-managed wrapper around `@radoslavirha/logger`. In a Ts.ED service, inject this; never
construct `new Logger()` from the framework-free package.

## Consuming it

Any injectable takes `Logger` and derives a scoped child:

```ts ignore
@Injectable()
export class ItemService {
    private log = this.logger.child('ITEM_SERVICE');

    constructor(@Inject(Logger) private logger: Logger) {}
}
```

Scope naming is `SUBSYSTEM` or `SUBSYSTEM:instance` — `HTTP_REQUEST` inbound,
`HTTP_CLIENT:miot-spec` for one configured outbound provider.

The re-exports `BaseLogger` and `LogLevel` are here so a service does not need a direct
dependency on `@radoslavirha/logger` just to name a level.

## Subclassing it to inject configuration

A service that wants log level or transports from `ConfigService` extends `Logger` and
registers the subclass **under the `Logger` token**:

```ts ignore
@Injectable({ token: Logger, scope: ProviderScope.SINGLETON })
export class LoggerService extends Logger {
    constructor(private config: ConfigService) {
        super(/* options from config */);
    }
}
```

The token is the whole point: every package that injects `Logger` — including shared toolkit
packages that know nothing about your service — resolves to this one instance.

**Do not also add a plain `@Injectable()` to that subclass.** The token form already
registers it; decorating twice registers two providers, and which one a given injection point
receives becomes order-dependent.

## What not to log

The logger is a transport. It does not redact. Anything carrying payloads, headers or query
strings must pass through a `RedactionProfile` from `@radoslavirha/redaction` first.
