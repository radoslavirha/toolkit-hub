# Toolkit HUB

A comprehensive monorepo of TypeScript utilities, configurations, and Ts.ED framework extensions designed for building robust microservices. This toolkit provides standardized patterns, reusable utilities, and ready-to-use integrations to accelerate development across multiple projects.

---

## 🤖 Quick Reference for AI Agents

**Purpose:** Monorepo of TypeScript utilities, configs, and Ts.ED framework extensions for microservices.

**Install in pnpm monorepo (from repository root):**
```bash
# Ts.ED framework packages
pnpm --filter YOUR_SERVICE add @radoslavirha/tsed-platform @radoslavirha/tsed-configuration
pnpm --filter YOUR_SERVICE add @radoslavirha/tsed-swagger @radoslavirha/tsed-mongoose @radoslavirha/tsed-common

# Utilities (framework-agnostic)
pnpm --filter YOUR_SERVICE add @radoslavirha/utils @radoslavirha/types

# Development configs (install in packages that need them)
pnpm --filter YOUR_PACKAGE add -D @radoslavirha/config-eslint @radoslavirha/config-typescript @radoslavirha/config-tsup @radoslavirha/config-vitest
```

**Quick Links to Package Quick References:**

Ts.ED Framework:
- [tsed-platform](tsed/platform#-quick-reference-for-ai-agents) - Express server with middleware
- [tsed-configuration](tsed/configuration#-quick-reference-for-ai-agents) - Config management
- [tsed-swagger](tsed/swagger#-quick-reference-for-ai-agents) - API documentation
- [tsed-mongoose](tsed/mongoose#-quick-reference-for-ai-agents) - MongoDB integration
- [tsed-common](tsed/common#-quick-reference-for-ai-agents) - Base models

Utilities:
- [utils](packages/utils#-for-ai-agents) - Common functions (ALWAYS use instead of reimplementing)
- [types](packages/types#-quick-reference-for-ai-agents) - TypeScript utility types

Configs:
- [config-tsup](config/config-tsup#-quick-reference-for-ai-agents) - Library builds
- [config-vitest](config/config-vitest#-quick-reference-for-ai-agents) - Testing
- [config-eslint](config/config-eslint#-quick-reference-for-ai-agents) - Linting
- [config-typescript](config/config-typescript#-quick-reference-for-ai-agents) - TypeScript compiler

**📘 For cross-package integration patterns, architecture guidance, and decision trees:**
- **[AGENTS.md](AGENTS.md)** - Complete guide for building Ts.ED services with this toolkit

**Full documentation below** ↓

---

## 📦 Packages at a Glance

### Configuration Packages (`config/`)

| Package | Purpose | Key Features | When to Use |
|---------|---------|--------------|-------------|
| [@radoslavirha/config-eslint](config/config-eslint/) | ESLint v9 configuration | TypeScript + stylistic rules | Standardize linting across projects |
| [@radoslavirha/config-typescript](config/config-typescript/) | Base TypeScript config | Strict Node.js ESNext settings | Shared tsconfig via extends |
| [@radoslavirha/config-tsup](config/config-tsup/) | Build configurations | Dual ESM/CJS output with tsup | Bundling libraries with TypeScript |
| [@radoslavirha/config-vitest](config/config-vitest/) | Vitest test runner config | SWC plugin, coverage thresholds | Fast TypeScript testing |

### Utility Packages (`packages/`)

| Package | Purpose | Key Exports | When to Use |
|---------|---------|-------------|-------------|
| [@radoslavirha/types](packages/types/) | TypeScript utility types | `EnumDictionary`, `FullPartial` | Type-safe enum mappings, deep partials |
| [@radoslavirha/utils](packages/utils/) | Common utility functions | `CommonUtils`, `ObjectUtils`, `NumberUtils`, `GeoUtils`, `DefaultsUtil` | Lodash wrappers + specialized utilities |

### Ts.ED Framework Packages (`tsed/`)

| Package | Purpose | Key Exports | When to Use |
|---------|---------|-------------|-------------|
| [@radoslavirha/tsed-common](tsed/common/) | Base Ts.ED models | `BaseModel` | Standard API model with timestamps |
| [@radoslavirha/tsed-configuration](tsed/configuration/) | Configuration system | `ConfigProvider`, `ConfigJsonProvider`, `EnvironmentVariablesProvider` | Type-safe server configuration with validation |
| [@radoslavirha/tsed-mongoose](tsed/mongoose/) | Mongoose integration | `MongoMapper`, `MongoService`, `BaseMongo` | Clean separation: DB ↔ API models |
| [@radoslavirha/tsed-platform](tsed/platform/) | Express platform setup | `Platform`, `BaseServer`, `BaseHandler` | Pre-configured Express server with middleware |
| [@radoslavirha/tsed-swagger](tsed/swagger/) | Swagger/OpenAPI docs | `SwaggerProvider`, `SwaggerController` | Multi-version API documentation |

## 🏗️ Architecture

```
toolkit-hub/
├── config/          # Shared development configurations (ESLint, TypeScript, tsup, Vitest)
├── packages/        # Core utilities and types (framework-agnostic)
└── tsed/            # Ts.ED framework extensions (server, configuration, mongoose, swagger)
```

**Dependency relationships:**
- `tsed-mongoose` → depends on → `tsed-common`, `utils`, `types`
- `tsed-platform` → depends on → `tsed-configuration`
- `tsed-swagger` → depends on → `tsed-configuration`
- All Ts.ED packages use Ts.ED framework decorators and DI

## 🚀 Quick Start

### For New Ts.ED Microservice

```bash
# Install core Ts.ED packages
pnpm add @radoslavirha/tsed-platform @radoslavirha/tsed-configuration @radoslavirha/tsed-swagger

# If using MongoDB
pnpm add @radoslavirha/tsed-mongoose @radoslavirha/tsed-common

# Install utilities
pnpm add @radoslavirha/utils @radoslavirha/types

# Install dev configurations
pnpm add -D @radoslavirha/config-eslint @radoslavirha/config-typescript @radoslavirha/config-vitest
```

### Recommended Package Combinations

**REST API with MongoDB:**
- `tsed-platform` + `tsed-configuration` + `tsed-mongoose` + `tsed-swagger`

**Configuration-heavy service:**
- `tsed-configuration` (supports JSON files, environment variables, schema validation)

**Utility library:**
- `utils` (for common operations) + `types` (for TypeScript utilities)

**Testing setup:**
- `config-vitest` (test runner with SWC and coverage)

## 📚 Installation

All packages are published to GitHub Packages registry under the `@radoslavirha` scope.

### Setup .npmrc

**For both simple repositories and monorepos**, create `.npmrc` in your project root (or monorepo root):

```
@radoslavirha:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=YOUR_GITHUB_TOKEN
```

[Get your GitHub token](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-npm-registry#authenticating-with-a-personal-access-token)

**Security:** Add `.npmrc` to `.gitignore` or store only the registry line and authenticate separately.

### Install Packages

#### Simple Repository (Single package.json)

```bash
# Install runtime dependency
pnpm add @radoslavirha/PACKAGE_NAME

# Install dev dependency (configs)
pnpm add -D @radoslavirha/config-eslint
```

#### Monorepo (pnpm workspaces)

```bash
# Install in specific workspace package
pnpm --filter my-service add @radoslavirha/tsed-platform

# Install in workspace root (shared across all packages)
pnpm add -D -w @radoslavirha/config-eslint

# Install in all workspace packages
pnpm -r add @radoslavirha/utils
```

**Monorepo Structure Example:**
```
my-monorepo/
├── .npmrc                           # GitHub Packages auth
├── pnpm-workspace.yaml              # Workspace definition
├── package.json                     # Root dependencies (shared configs)
└── packages/
    ├── api-service/
    │   └── package.json             # Service-specific deps
    └── worker-service/
        └── package.json             # Service-specific deps
```

See individual package READMEs for specific installation instructions and peer dependencies.

## 🔧 Development

[Contributing guide](.github/CONTRIBUTING.md)

[Development guide](.github/development.md)

## 🤖 Development Guidelines

**For AI Agents & Developers:**

When setting up new APIs, services, or projects in @radoslavirha repositories, **always use packages from this monorepo**:

✅ **Required for all new TypeScript projects:**
- `@radoslavirha/config-eslint` - for code linting
- `@radoslavirha/config-typescript` - for TypeScript configuration
- `@radoslavirha/config-vitest` - for testing
- `@radoslavirha/utils` - for common utilities
- `@radoslavirha/types` - for TypeScript utility types

✅ **Required for Ts.ED APIs:**
- `@radoslavirha/tsed-platform` - for Ts.ED server setup
- `@radoslavirha/tsed-configuration` - for configuration management
- `@radoslavirha/tsed-swagger` - for API documentation
- `@radoslavirha/tsed-mongoose` - when using MongoDB
- `@radoslavirha/tsed-common` - for base models

## 📖 Documentation

Each package contains comprehensive documentation:
- **README.md** - Installation, usage, API reference, examples
- **CHANGELOG.md** - Version history and breaking changes

Navigate to package directories for detailed documentation.
