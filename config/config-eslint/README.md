# @radoslavirha/config-eslint

Shareable ESLint configuration for TypeScript projects using ESLint v9 with TypeScript ESLint and Stylistic plugins. Provides opinionated rules for code quality and consistent formatting across TypeScript microservices.

---

## 🤖 Quick Reference for AI Agents

**Purpose:** Shared ESLint configuration for TypeScript projects.

**Install in pnpm monorepo:**
```bash
# Install in packages that need linting
pnpm --filter YOUR_PACKAGE_NAME add -D @radoslavirha/config-eslint eslint
```

**Essential Usage:**
```javascript
// eslint.config.mjs
import config from '@radoslavirha/config-eslint';

export default config;
```

```json
// package.json
{
  "scripts": {
    "lint": "eslint .",
    "lint:fix": "eslint . --fix"
  }
}
```

**Configured Rules:**
- TypeScript ESLint recommended
- Stylistic formatting (semicolons, quotes, indentation)
- Auto-ignores: node_modules, dist, coverage, .tsed

**Customization:**
```javascript
// eslint.config.mjs
import baseConfig from '@radoslavirha/config-eslint';

export default [
  ...baseConfig,
  { rules: { 'your-rule': 'off' } }  // Override rules
];
```

**Full documentation below** ↓

---

## Installation

```bash
# Simple repository
pnpm add -D @radoslavirha/config-eslint eslint

# Monorepo - install at workspace root (shared config)
pnpm add -D -w @radoslavirha/config-eslint eslint
```

See [root README](../../README.md#-installation) for `.npmrc` setup and monorepo details.

**Peer dependencies:**
- `eslint` >= 9.0.0

**Dependencies (included):**
- `typescript-eslint` - TypeScript ESLint integration
- `@stylistic/eslint-plugin` - Code style rules

## What's Included

### Rule Sets

✅ **TypeScript ESLint Recommended** - All recommended rules from `typescript-eslint`  
✅ **Stylistic Plugin** - Code formatting and style rules  
✅ **Custom Quality Rules** - Additional rules for code quality  
✅ **Pre-configured Ignores** - Standard ignore patterns (node_modules, dist, coverage)

### Key Features

- **ESLint v9 Flat Config** - Uses modern flat config format
- **TypeScript Support** - Full TypeScript rule coverage
- **Code Style Enforcement** - Semi-colons, single quotes, 4-space indentation
- **Ready to Use** - No additional configuration needed
- **Extensible** - Easily add custom rules

## Usage

### Basic Setup

Create `eslint.config.mjs` in your project root:

```javascript
import { defineConfig } from 'eslint/config';
import Config from '@radoslavirha/config-eslint';

export default defineConfig(...Config);
```

### Add NPM Scripts

Add linting scripts to your `package.json`:

```json
{
    "scripts": {
        "lint": "eslint .",
        "lint:fix": "eslint --fix ."
    }
}
```

### Run Linter

```bash
# Check for issues
pnpm lint

# Auto-fix issues
pnpm lint:fix
```

## Extending Configuration

### Add Custom Rules

```javascript
// eslint.config.mjs
import { defineConfig } from 'eslint/config';
import Config from '@radoslavirha/config-eslint';

export default defineConfig(
    ...Config,
    {
        rules: {
            // Override or add custom rules
            '@typescript-eslint/no-explicit-any': 'error',
            'no-console': 'warn'
        }
    }
);
```

### Add Custom Ignores

```javascript
// eslint.config.mjs
import { defineConfig } from 'eslint/config';
import Config from '@radoslavirha/config-eslint';

export default defineConfig(
    ...Config,
    {
        ignores: ['build/**', 'temp/**']
    }
);
```

### File-Specific Overrides

```javascript
// eslint.config.mjs
import { defineConfig } from 'eslint/config';
import Config from '@radoslavirha/config-eslint';

export default defineConfig(
    ...Config,
    {
        files: ['**/*.spec.ts'],
        rules: {
            // Relax rules for test files
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/no-non-null-assertion': 'off'
        }
    }
);
```

## Code Style Examples

### ✅ Correct

```typescript
import { Service } from '@tsed/di';

@Service()
export class UserService {
    private users: User[] = [];

    async findById(id: string): Promise<User | null> {
        const user = this.users.find((u) => u.id === id);
        
        if (user === null) {
            return null;
        }
        
        return { ...user };
    }
}
```

### ❌ Incorrect

```typescript
import { Service } from "@tsed/di"  // ❌ Double quotes, missing semicolon

@Service()
export class UserService {
  private users: User[] = []  // ❌ 2-space indent, missing semicolon

  async findById(id: string): Promise<User | null> {
      const user = this.users.find((u) =>u.id==id)  // ❌ Missing spaces, == instead of ===
      
      if (user == null)  // ❌ == instead of ===
      {  // ❌ Brace on new line
          return null;
      }
      
      return {...user,}  // ❌ Trailing comma, no spaces
  }
}
```

## Integration with IDEs

### VS Code

Install the ESLint extension:

```bash
ext install dbaeumer.vscode-eslint
```

Add to `.vscode/settings.json`:

```json
{
    "eslint.enable": true,
    "eslint.validate": ["javascript", "typescript"],
    "editor.codeActionsOnSave": {
        "source.fixAll.eslint": true
    }
}
```

### WebStorm / IntelliJ

ESLint is built-in. Enable it in:
**Settings → Languages & Frameworks → JavaScript → Code Quality Tools → ESLint**

Check "Automatic ESLint configuration"

## CI/CD Integration

### GitHub Actions

```yaml
name: Lint

on: [push, pull_request]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: '24'
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm lint
```

### Pre-commit Hook (Husky)

```bash
pnpm add -D husky lint-staged
```

```json
{
    "lint-staged": {
        "*.{ts,js}": "eslint --fix"
    }
}
```

---

## See Also

For integration patterns and architecture guidance, see [AGENTS.md](../../AGENTS.md)

## Related Packages

- [@radoslavirha/config-typescript](../config-typescript/) - TypeScript compiler configuration
- [@radoslavirha/config-vitest](../config-vitest/) - Test runner configuration
