# @radoslavirha/redaction

Configuration-driven redaction of sensitive fields, **compiled once** and reused. Framework-free
and logger-free — it sanitises values *before* they reach a logger, so the logger stays a pure
transport.

Backed by [`fast-redact`](https://github.com/davidmarkclements/fast-redact).

---

## 🤖 Quick Reference for AI Agents

```typescript
import { RedactionProfile } from '@radoslavirha/redaction';

// ONCE — at construction. Compiles a redactor per enabled field.
const profile = new RedactionProfile({
  headers:  { enabled: true,  redactPaths: ['authorization'] },
  request:  { enabled: true,  redactPaths: ['password'] },
  response: { enabled: false, redactPaths: [] }
});

// PER CALL — invokes the compiled functions only, no recompilation.
logger.info('Request completed', {
  method, url, status,
  ...profile.collect({ headers, request, response })
});
// → headers: '{"authorization":"***"}', request: '{"user":"me","password":"***"}'
//   response omitted entirely (disabled)
```

## Why a profile

`fast-redact` builds its redactor with `new Function`. That is expensive and **must not happen
per call**. `RedactionProfile` compiles every enabled field once at construction; `collect()`
and `redact()` only invoke the already-compiled functions.

Build one profile per long-lived thing — a logger, an HTTP provider entry, a repository — and
reuse it for the lifetime of the process.

## API

| Export | Purpose |
|---|---|
| `RedactionProfile` | Pre-compiled, named redactors built from configuration. |
| `RedactionUtils.compileRedactor(paths)` | Low-level: compile one redactor. **Cache the result.** |
| `RedactionUtils.stringifyForLog(value)` | Serialisation used by redactors, with safe fallbacks. |
| `RedactionUtils.REDACTED_VALUE` | The censor string (`***`). |
| `RedactionFieldOptionsSchema` | Zod `{ enabled, redactPaths }` — the shared config vocabulary. |
| `createRedactionSchema(fields)` | Build a Zod schema for a fixed field set with per-field default selectors. |

### `RedactionProfile`

- `collect(values)` — redacts every enabled field present in `values`, returning an object safe
  to spread into a log payload. Disabled, unconfigured and absent fields are **omitted**, so a
  disabled field is never emitted unredacted.
- `redact(field, value)` — one field; `undefined` when disabled or unconfigured.
- `isEnabled(field)` — whether a redactor was compiled for the field.

### Selector syntax

| Selector | Matches |
|---|---|
| `authorization` | a root-level property |
| `user.password` | an exact nested path |
| `items.*.token` | wildcard paths |
| `["set-cookie"]` | **required** bracket form for names that are not valid identifiers (e.g. containing a hyphen) |

`fast-redact` throws on `set-cookie` written bare — use the bracket form.

### Serialisation fallbacks

`stringifyForLog` returns strings unchanged, `undefined` as `'undefined'`, and otherwise
JSON-stringifies — falling back to `String(value)` when that yields `undefined` (e.g. symbols)
and to `[[ UNSERIALIZABLE ]]` on circular references.

## Configuration

```typescript
import { createRedactionSchema } from '@radoslavirha/redaction';

// per-field default selectors; callers may override or disable any field
export const HttpRedactionSchema = createRedactionSchema({
  headers: ['authorization', '["set-cookie"]'],
  query: [],
  request: [],
  response: []
});
```

Parsed output feeds straight into `new RedactionProfile(...)`.

## Notes

- Redaction is **caller-side and opt-in** — this package cannot stop someone logging a raw
  object. Packages that handle credentials should ship safe defaults (e.g. auth headers
  redacted unless explicitly disabled).
- Deciding whether a payload is safe to serialise at all (binary bodies, huge blobs) is domain
  logic and belongs to the caller, not here.
