---
"@radoslavirha/tsed-configuration": minor
---

`.env` files are no longer loaded. Environment variables come from `process.env` only, so `envs` and `config` (`NODE_ENV`, `custom-environment-variables.json`) always agree. Set variables in whatever starts the process instead of a `.env` file.
