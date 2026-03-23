# @radoslavirha/logger

OTEL-compliant structured logger for Node.js backed by Winston. Produces one JSON line per call with OTEL-aligned field names.

---

## 🤖 Quick Reference for AI Agents

```typescript
import { Logger, LogLevel } from '@radoslavirha/logger';

// Root logger — plain JSON to stdout/stderr
const logger = new Logger();

// Scoped child logger — pins `scope` on every line
const log = logger.child('UserService');
log.info('User created', { userId: 'abc' });
// → { "timestamp":"...","level":"info","message":"User created","scope":"UserService","attributes":{"userId":"abc"} }

// With metaProvider — base attributes on every call
const appLogger = new Logger({
    metaProvider: () => ({ requestId: getRequestId() })
});
appLogger.info('Request received');
// → { ..., "attributes": { "requestId": "req-xyz" } }
```

**Key exports:** `Logger`, `LoggerOptions`, `LogLevel`

**Output format:** `{ timestamp, level, message, scope?, attributes? }`

---

## Installation

```bash
pnpm --filter YOUR_SERVICE_NAME add @radoslavirha/logger
```

---

## What's Included

| Export | Type | Description |
|--------|------|-------------|
| `Logger<T>` | Class | Structured Winston logger with OTEL-aligned output |
| `LoggerOptions<T>` | Interface | Constructor options (enabled, logLevel, metaProvider) |
| `LogLevel` | Enum | OTEL-aligned severity levels (FATAL → TRACE) |

---

## Usage

### Basic logging

```typescript
import { Logger } from '@radoslavirha/logger';

const logger = new Logger();

logger.info('Server started');
logger.warn('Deprecated endpoint used');
logger.error('Unhandled rejection', { code: 500, path: '/api/users' });
```

### Scoped child logger

Use `child()` to pin a `scope` field on every log line. All children share the parent's Winston transport.

```typescript
const logger = new Logger();
const log = logger.child('Service');

log.info('Order placed', { id: '1' });
// → { ..., "scope": "Service", "attributes": { "id": "1" } }
```

### metaProvider — base attributes callback

Pass `metaProvider` to inject base attributes on every log call without repeating them. Useful for request-id / trace-id propagation. Per-call `meta` is merged on top and takes precedence.

```typescript
import { Logger } from '@radoslavirha/logger';

const logger = new Logger({
    metaProvider: () => ({
        requestId: getRequestId()   // called fresh on every log call
    })
});

const log = logger.child('PaymentService');

log.info('Payment initiated', { amount: 100 });
// → { ..., "scope": "PaymentService", "attributes": { "requestId": "req-abc", "amount": 100 } }
```

`metaProvider` is inherited by all children created from the parent.

### Log level filtering

```typescript
import { Logger, LogLevel } from '@radoslavirha/logger';

const logger = new Logger({ logLevel: LogLevel.WARN });

logger.info('ignored');  // below WARN threshold
logger.warn('emitted');  // emitted
logger.error('emitted'); // emitted
```

### Disabling logging

```typescript
const logger = new Logger({ enabled: false });
logger.info('this is never written');
```

---

## API Reference

### `Logger<T extends object = object>`

```typescript
class Logger<T extends object = object> {
    constructor(options?: LoggerOptions<T>)

    child<K extends object>(scope: string): Logger<K>

    fatal(body: string, meta?: T): void
    error(body: string, meta?: T): void
    warn(body: string, meta?: T): void
    info(body: string, meta?: T): void
    debug(body: string, meta?: T): void
    trace(body: string, meta?: T): void
}
```

| Method | Description |
|--------|-------------|
| `child(scope)` | Creates a child logger with `scope` pinned on every line. Inherits `enabled`, `logLevel`, and `metaProvider` from parent. |
| `fatal(body, meta?)` | Log at FATAL level. Writes to **stderr**. |
| `error(body, meta?)` | Log at ERROR level. Writes to **stderr**. |
| `warn(body, meta?)` | Log at WARN level. Writes to **stdout**. |
| `info(body, meta?)` | Log at INFO level. Writes to **stdout**. |
| `debug(body, meta?)` | Log at DEBUG level. Writes to **stdout**. |
| `trace(body, meta?)` | Log at TRACE level. Writes to **stdout**. |

---

### `LoggerOptions<T extends object = object>`

```typescript
interface LoggerOptions<T extends object = object> {
    readonly enabled?: boolean;
    readonly logLevel?: LogLevel;
    readonly metaProvider?: () => Partial<T>;
}
```

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `enabled` | `boolean` | `true` | Set to `false` to suppress all output. `metaProvider` is not called when disabled. |
| `logLevel` | `LogLevel` | `LogLevel.INFO` | Minimum severity to emit. Messages below this level are silently dropped. |
| `metaProvider` | `() => Partial<T>` | `undefined` | Called on every log call. Return value is merged with per-call `meta` (per-call wins on key conflicts). |

---

### `LogLevel`

```typescript
enum LogLevel {
    FATAL = 'fatal',
    ERROR = 'error',
    WARN  = 'warn',
    INFO  = 'info',
    DEBUG = 'debug',
    TRACE = 'trace'
}
```

---

### JSON Output Shape

Every log line is a single JSON object:

```json
{
    "timestamp": "2026-03-20T10:00:00.000Z",
    "level": "info",
    "message": "User created",
    "scope": "UserService",
    "attributes": {
        "requestId": "req-abc",
        "userId": "usr-123"
    }
}
```

| Field | Present when | Description |
|-------|-------------|-------------|
| `timestamp` | Always | ISO 8601 timestamp |
| `level` | Always | Severity as lowercase string |
| `message` | Always | Log body string |
| `scope` | Child loggers only | Instrumentation scope (class/module name) |
| `attributes` | `metaProvider` or per-call `meta` provided | Merged attributes object |

`fatal` and `error` levels write to **stderr**; all other levels write to **stdout**.

---

## See Also

- [AGENTS.md](../../AGENTS.md) — cross-package integration patterns and architecture guide

---

## Related Packages

| Package | Description |
|---------|-------------|
| [`@radoslavirha/tsed-logger`](../../tsed/logger/README.md) | Ts.ED injectable wrapper for this logger with HTTP request/response logging |
