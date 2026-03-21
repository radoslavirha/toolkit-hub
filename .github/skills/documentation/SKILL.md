---
name: documentation
description: Guide for creating and improving README files for humans and agents
---

This skill provides guidance for creating and maintaining high-quality documentation for the toolkit-hub monorepo. Use it when writing or updating README files for any package, as well as the comprehensive AGENTS.md guide for AI agents.

# Three-Level System

**1. README.md (Root)** - Monorepo-wide documentation
- Location: `/README.md`
- Purpose: Monorepo overview, installation, development guidelines, documentation structure, contact info
- Update when: Monorepo structure changes, new packages added, documentation guidelines updated

**2. AGENTS.md (Root)** - Cross-package integration guide
- Location: `/AGENTS.md`
- Purpose: Multi-package patterns, architecture, decision trees
- Update when: New integration patterns emerge, API changes affect multiple packages

**3. Package READMEs** - Individual package deep dives
- Location: `{package}/README.md` (e.g., `tsed/platform/README.md`)
- Purpose: Single-package usage, API reference, installation
- Update when: Package API changes, new features added, examples need updates

---

# Standard Package README Structure

Every package README MUST follow this exact structure:

1. ✅ `# Title + description`
2. ✅ `## 🤖 Quick Reference for AI Agents`
3. ✅ `## Installation`
4. ✅ `## What's Included`
5. ✅ `## Usage`
6. ✅ `## API Reference`
7. ✅ `## See Also` (with link to AGENTS.md)
8. ✅ `## Related Packages`
---

# When Source Code Changes

## Detecting What Needs Updates

**If `src/index.ts` exports change:**
1. Check package README "Quick Reference" → Update if exports added/removed
2. Check package README "What's Included" → Update component list
3. Check AGENTS.md "Utilities Quick Reference" → Update if @radoslavirha/utils changed
4. Check AGENTS.md integration patterns → Update if affects cross-package usage

**If JSDoc/method signatures change:**
1. Update package README "API Reference" section
2. Update code examples in "Quick Reference"
3. Check AGENTS.md for usage examples of that method

**If new integration pattern discovered:**
1. Add to AGENTS.md "Common Integration Patterns" section
2. Follow existing pattern format (Pattern N: Title, Packages, Code, Installation)

---

# Code Example Standards

## Naming Conventions
- ✅ **Generic names:** Handler, Controller, Service, Request, Response, Model, MongoModel, Mapper
- ❌ **Domain-specific:** User, Order, Product, Post, Stats, Customer

---

# Installation Command Standards

Always use pnpm with `--filter` for monorepo installs:

```bash
# ✅ CORRECT
pnpm --filter YOUR_SERVICE_NAME add @radoslavirha/package-name
```

---

# Validation Checklist

When reviewing documentation changes, verify:

- [ ] Quick Reference matches actual exports from `src/index.ts`
- [ ] API Reference matches actual method signatures
- [ ] Code examples use generic naming (Handler, Controller, not User, Order)
- [ ] Installation commands use `pnpm --filter` pattern
- [ ] No made-up methods (check source files)
- [ ] "See Also" section links to AGENTS.md
- [ ] No "When to Use" sections in package READMEs
- [ ] Section order matches standard structure

---

# AGENTS.md Maintenance

## Structure of AGENTS.md
1. Package Overview & Selection (table)
2. Architecture Patterns (Clean Architecture, DI flow)
3. Common Integration Patterns (Pattern 1, 2, 3...)
4. Anti-Patterns & Common Mistakes
5. Configuration Best Practices
6. Utilities Quick Reference
7. Decision Trees
8. Quick Links to Package Documentation
9. Maintenance (this section explains maintenance)

## When to Update AGENTS.md

**Add new pattern when:**
- Frequently seeing same package combination (e.g., platform + swagger + mongoose)
- New architectural pattern emerges from team usage
- Complex multi-step integration requires documentation

**Update Utilities Quick Reference when:**
- New method added to @radoslavirha/utils
- Method signature changes
- Method removed (mark as deprecated first)

---

# Utility Methods Reference

Always check if there is new/removed utility class. If so, update AGENTS.md "Utilities Quick Reference" section with new methods and description. Verify against actual exported source files in `packages/utils/src`.
Never document methods that don't exist in source files.

---

# Contact & Questions

This guide is living documentation. When you discover:
- New patterns that should be documented
- Documentation inconsistencies
- Better ways to structure information

update this guide READMEs and AGENTS.md accordingly. Documentation evolves with the codebase.
