---
'@radoslavirha/redaction': patch
---

A terminal-wildcard selector (`meta.*`) no longer throws a `TypeError` on JSON text where it lands on a number that a double cannot round-trip (`10.50`, `1e3`, large integers); such numbers are now held outside the traversed tree and written back unchanged.
