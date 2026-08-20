---
name: using-redaction
description: Use when logging anything that may contain secrets — request or response bodies, headers, query strings — or when adding a field to a redaction config. Covers building one RedactionProfile at construction, collecting values per call, and why redaction happens before the logger rather than inside it.
---

# Using @radoslavirha/redaction

Redaction is **compiled once and applied per call**. The cost is paid at construction so the
hot path stays cheap.

## Build the profile once

```ts
import { RedactionProfile } from '@radoslavirha/redaction';

const profile = new RedactionProfile({
    headers: { enabled: true, redactPaths: ['authorization'] },
    request: { enabled: true, redactPaths: ['password'] },
    response: { enabled: false, redactPaths: [] }
});
```

Construct it in your class constructor and keep it — never build one per request. Each
enabled field compiles a redactor, which is the expensive part.

## Use it per call

- `collect(values)` — the normal path: pass the fields you are about to log, get back only
  the enabled ones, redacted. Disabled fields are dropped rather than passed through.
- `redact(field, value)` — one field at a time
- `isEnabled(field)` — skip building an expensive value when nobody will log it

```ts
import { RedactionProfile } from '@radoslavirha/redaction';

const profile = new RedactionProfile({ request: { enabled: true, redactPaths: ['password'] } });
const meta = profile.collect({ request: { user: 'ada', password: 'hunter2' } });
// meta.request has password redacted; disabled fields are absent
```

## Redact before the logger, never inside it

`@radoslavirha/logger` is a pure transport: it does not inspect or sanitise what it is given.
If a payload reaches the logger unredacted, it is in the log. The order is always
`collect()` → `logger.info(...)`.

## Configuring fields

`RedactionConfig` is Zod-validated; `createRedactionSchema` builds a schema for a specific set
of field names so a service's configuration file is checked at startup rather than failing
when the first secret leaks. `redactPaths` uses the selector syntax documented in the package
README — read it before inventing a path expression.
