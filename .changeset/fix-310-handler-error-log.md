---
"@radoslavirha/tsed-platform": patch
---

`BaseHandler.execute()` now logs the thrown value as structured metadata, so `Error` stacks and the fields of non-Error rejections are no longer lost.
