---
"@radoslavirha/logger": patch
---

Fix a child logger dropping the whole line (or losing the field) when parsed meta carries an own `__proto__` key. The child now adds `scope` itself instead of going through Winston's `child()`.
