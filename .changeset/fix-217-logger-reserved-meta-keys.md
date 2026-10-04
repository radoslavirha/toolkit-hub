---
"@radoslavirha/logger": patch
---

Metadata keys named `timestamp`, `level`, `message` or `scope` no longer corrupt the log line: the logger's own value always wins and the caller's value is kept as `meta_<key>` (a `message` key used to be appended to the body, and a `scope` key overwrote a child's pinned scope).
