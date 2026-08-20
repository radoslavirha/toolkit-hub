# AI Agent Development Guide - toolkit-hub

> **For AI Agents:** This document provides cross-package integration patterns, architectural decisions, and common scenarios for building Ts.ED services with this toolkit. Each package has detailed documentation in its README - this guide shows how they work together.

---

## 📦 Package Overview & Selection

### Core Framework Packages (Ts.ED)

| Package | Purpose | When to use |
|---------|---------|-------------|
| [@radoslavirha/tsed-platform](tsed/platform/) | Express server bootstrap & base classes | **Always** - Required for any Ts.ED service |
| [@radoslavirha/tsed-configuration](tsed/configuration/) | Config management (JSON/ENV) | **Always** - Required for Ts.ED service configuration |
| [@radoslavirha/tsed-swagger](tsed/swagger/) | Multi-version Swagger/OpenAPI docs | When building Ts.ED REST APIs that need documentation |
| [@radoslavirha/tsed-mongoose](tsed/mongoose/) | Clean architecture MongoDB integration | When using MongoDB with mapper pattern in Ts.ED  service |
| [@radoslavirha/tsed-common](tsed/common/) | Base models, typed serialization, and AJV/Zod schema validation | When using Ts.ED models, tsed-mongoose, or validating arbitrary input |
| [@radoslavirha/tsed-logger](tsed/logger/) | Ts.ED injectable logger (DI wrapper around `@radoslavirha/logger`) | When you need structured logging in a Ts.ED service via dependency injection |

### Utility Packages

| Package | Purpose | When to use |
|---------|---------|-------------|
| [@radoslavirha/utils](packages/utils/) | Common utility methods | **Always** - When you need common operations (don't reinvent the wheel) for e.g. numeric, string, object operations and more |
| [@radoslavirha/types](packages/types/) | TypeScript utility types (`Dictionary`, `EnumDictionary`, `NullableProperty`, `FullPartial`) | When you need common reusable types or to avoid lodash type imports |
| [@radoslavirha/logger](packages/logger/) | OTEL-compliant Winston logger (zero dependencies on Ts.ED) | When you need structured JSON logging outside of Ts.ED, or as the core logger in any Node.js package |
| [@radoslavirha/redaction](packages/redaction/) | Pre-compiled, config-driven redaction of sensitive fields | When a package logs payloads, headers or query strings — redact **before** calling the logger |

### Logging conventions

The logger is a **pure transport**: it does not redact and does not know about HTTP. Callers
build the log structure and sanitise it first.

| Package kind | Pattern |
|---|---|
| Ts.ED packages | `@Inject(Logger)` then `logger.child('<SCOPE>')` |
| Framework-free packages | Accept a structural `{ child, info, error }` port — never import a logger |
| Anything logging payloads | Build one `RedactionProfile` at construction, `collect()` per call |

Scope naming is `SUBSYSTEM` or `SUBSYSTEM:instance` — e.g. `HTTP_REQUEST` (inbound),
`HTTP_CLIENT:miot-spec` (outbound, per configured provider).

### Configuration Packages

| Package | Purpose | When to use |
|---------|---------|-------------|
| [@radoslavirha/config-typescript](config/config-typescript/) | Shared TypeScript config | **Always** - Base tsconfig for all packages |
| [@radoslavirha/config-eslint](config/config-eslint/) | Shared ESLint config | **Always** - Consistent linting rules |
| [@radoslavirha/config-tsdown](config/config-tsdown/) | Build configuration with tsdown | When building library packages (not apps) |
| [@radoslavirha/config-vitest](config/config-vitest/) | Test configuration with Vitest | When writing unit/integration tests |

---

## 🏗️ Architecture Patterns

### Layer Separation (Clean Architecture)

```
Controllers (API Layer)
    ↓ depends on
Handlers (API Layer)
    ↓ depends on
Services (Business Logic)
    ↓ depends on
Mappers (Transformation Layer)
    ↓ depends on
Mongoose Models (Data Layer)
```

**Key Principle:** Each layer only knows about the layer below it, not above.

### Dependency Injection Flow

```typescript
// 1. Register models and services
@Configuration({
})
export class Server extends BaseServer {}

// 2. Inject via constructor (no base class — plain @Injectable)
@Injectable()
export class Service {
  @Inject(Repository)
  private repository!: Repository;

  @Inject(Mapper)
  private mapper!: Mapper;

  async findById(id: string): Promise<Model | null> {
    const mongo = await this.repository.findById(id);
    return mongo ? this.mapper.mongoToModel(mongo) : null;
  }

  async create(model: Model): Promise<Model> {
    const mongo = await this.repository.create(this.mapper.buildMongoCreate(model));
    return this.mapper.mongoToModel(mongo);
  }
}

// 3. Controllers inject services
@Controller('/')
export class Controller {
  constructor(private service: Service) {}
}
```

---

## 🎯 Common Integration Patterns

The end-to-end recipes — REST API with MongoDB, REST API without a database, background
worker — live in the `building-a-tsed-service` skill, published from `agents/tsed-service/`.

They are not here because they are task-triggered rather than always needed, and because
consuming repos never receive this file: they install skills through APM, so assembly
guidance is only reachable to them as a skill. Per-package detail lives in each package's own
skill (`using-tsed-platform`, `using-tsed-mongoose`, `using-tsed-swagger`, …).

Working in this repo, read `agents/tsed-service/.apm/skills/building-a-tsed-service/SKILL.md`
directly.

---

## 🚫 Anti-Patterns & Common Mistakes

Each of these now lives in the skill for the package it concerns, where the correct form sits
next to the API it applies to — and where consuming repos actually receive it:

| Mistake | Correct form is in |
|---|---|
| `super()` in a `BaseHandler` subclass implying constructor arguments | `using-tsed-platform` |
| Mounting controllers with a glob instead of by value | `using-tsed-platform` |
| Calling a handler's `performOperation` instead of `execute` | `using-tsed-platform` |
| Constructing `ConfigService` instead of resolving it from the injector | `using-tsed-configuration` |
| Mapper still using the mutating `mongoToModelBase(model, mongo)`, or the removed `modelToMongo*` methods | `using-tsed-mongoose` |
| Repository declaring `protected type` instead of `protected mongo` | `using-tsed-mongoose` |
| Swagger documents passed as object literals instead of built models | `using-tsed-swagger` |
| Installing toolkit packages without `pnpm --filter` | `adopting-toolkit-hub` |
| Logging payloads without redacting first | `using-redaction` |
| Hand-rolling null checks, type tests, deep clone or haversine | `using-utils` |

---

## 🔧 Configuration Best Practices

Config file layout, the `default.json` → `{NODE_ENV}.json` → environment variable load order,
and the schema/provider pattern live in the `using-tsed-configuration` skill
(`tsed/configuration/.apm/skills/`).

---

## 🛠️ Utilities Quick Reference

`@radoslavirha/utils` covers the operations services keep reinventing. Reach for it before
writing a raw `=== null`, a `typeof` test, `Array.isArray`, a deep clone, or a distance
calculation.

| Class | Use it for |
|---|---|
| `CommonUtils` | null/undefined/empty guards, and the `buildModel*` family for constructing models |
| `ObjectUtils` | object guards, typed keys/values, deep clone, deep merge, `enabled` guard |
| `ArrayUtils` | array guard, normalising a value to an array |
| `StringUtils` / `BooleanUtils` | string and boolean type guards |
| `MappingUtils` | null-safe mapping of models, arrays, maps, enums (instance methods) |
| `NumberUtils` | percentages, mean, min/max, rounding with precision |
| `GeoUtils` | haversine distance, degree conversion |
| `DefaultsUtil` | fallbacks for nullable strings and numbers |

Method lists and signatures deliberately live outside this file — in the type declarations,
[the package README](packages/utils/README.md), and the `using-utils` skill that consuming
repos install. Restating them here is how this section came to claim 36 methods in one place
and 39 in another while the real number was 41.

---

## 📋 Decision Trees

### "Should I use tsed-mongoose?"

```
Do you need database persistence?
├─ No → Skip tsed-mongoose
└─ Yes
   └─ Are you using MongoDB?
      ├─ No → Use different ORM (@tsed/prisma, @tsed/typeorm)
      └─ Yes → ✅ Use @radoslavirha/tsed-mongoose
```

### "How many packages do I need?"

```
What are you building?
├─ REST API with MongoDB
│  └─ ✅ platform + configuration + swagger + mongoose + common + utils
├─ REST API without database
│  └─ ✅ platform + configuration + swagger + utils
├─ Background worker with MongoDB
│  └─ ✅ platform + configuration + mongoose + common + utils
└─ Simple microservice (no DB, no docs)
   └─ ✅ platform + configuration + utils
```

---

## 🔗 Quick Links to Package Documentation

### Framework Packages
- [tsed-platform README](tsed/platform/README.md#-quick-reference-for-ai-agents) - Server bootstrap
- [tsed-configuration README](tsed/configuration/README.md#-quick-reference-for-ai-agents) - Config management
- [tsed-swagger README](tsed/swagger/README.md#-quick-reference-for-ai-agents) - API documentation
- [tsed-mongoose README](tsed/mongoose/README.md#-quick-reference-for-ai-agents) - MongoDB integration
- [tsed-common README](tsed/common/README.md#-quick-reference-for-ai-agents) - Base models, serialization & validation

### Utility Packages
- [utils README](packages/utils/README.md#-quick-reference-for-ai-agents) - guards, model building, mapping
- [types README](packages/types/README.md#-quick-reference-for-ai-agents) - TypeScript types

### Config Packages
- [config-eslint README](config/config-eslint/README.md#-quick-reference-for-ai-agents) - ESLint rules
- [config-typescript README](config/config-typescript/README.md#-quick-reference-for-ai-agents) - TypeScript config
- [config-tsdown README](config/config-tsdown/README.md#-quick-reference-for-ai-agents) - Build config
- [config-vitest README](config/config-vitest/README.md#-quick-reference-for-ai-agents) - Test config

---

## 📚 Maintenance

This document is maintained alongside package READMEs:

1. **Package-specific details** → Stay in package READMEs
2. **Cross-package patterns** → Documented here in AGENTS.md
3. **API changes** → Update both README and relevant pattern here
4. **New integration patterns** → Add to this document

**Review Checklist:**
- [ ] When adding new package → Add to Package Overview table
- [ ] When changing API → Update anti-patterns section if relevant
- [ ] When discovering common pattern → Add to Common Integration Patterns
- [ ] Monthly review for accuracy

---
