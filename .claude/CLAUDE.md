# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**Full development guide:** `.github/copilot-instructions.md` - Contains detailed patterns, examples, JSON schemas, and best practices.

## Quick Reference

### Commands

```bash
# Install dependencies
node scripts/npm_install.js

# Run tests
npm run test-unit
npm run test-unit -- test/<connector_name>

# Linting
npm run lint

# Repository validation
npm run validate

# Validate outputType components
npm run validate-outputtype
```

Run `npm run validate` after major refactors so bundle metadata, component schema/inspector pairs, and quota resource references stay in sync.

### Connector Structure

```
src/appmixer/<connector_name>/
├── service.json       # Service metadata
├── auth.js           # Authentication (OAuth2 or API key)
├── bundle.json       # Version and changelog
├── lib.js            # Shared utilities (REQUIRED for outputType components)
└── core/
    └── <ComponentName>/
        ├── component.json
        └── <ComponentName>.js
```

See: `.github/copilot-instructions.md` sections "Connector Structure", "Core Configuration Files"

### Authentication

- **OAuth 2.0**: For services with OAuth flow (Google, GitHub, etc.)
- **API Key**: For services using API keys or tokens

See: `.github/copilot-instructions.md` section "Authentication Types"

### Component Types

| Type | Purpose | Key Rule |
|------|---------|----------|
| **Get** | Single item by ID | Returns item data |
| **List** | All items, no filtering | Uses `outputType`, no limit/offset |
| **Find** | Search with filters | Uses `outputType`, has `notFound` port |
| **Create** | Create new item | Returns created item |
| **Update** | Modify by ID | Returns `{}` |
| **Delete** | Remove by ID | Returns `{}` |

See: `.github/copilot-instructions.md` sections "Find (Items) Components", "List (Items) Components", "Get (Item) Components", "Create (Item) Components", "Delete (Item) Components", "Update (Item) Components"

**Triggers**: Use `properties` (not `inPorts`), implement `tick()` or `start()/receive()/stop()`

See: `.github/copilot-instructions.md` sections "Trigger Components", "Trigger Behavior Requirements"

## Critical Rules

### outputType Components (REQUIRED)

Components with `outputType` **MUST** use lib.js helpers:
- `lib.sendArrayOutput({ context, outputType, records })`
- `lib.getOutputPortOptions(context, outputType, schema, { label })`
- Array output field: always `result` (not `records`)

**Canonical implementation:** `appmixer-cli/src/ai/src/templates/libs/lib.js`

See: `.github/copilot-instructions.md` section "outputType Helper Functions"

### Delete/Update Components

```javascript
// MUST return empty object
return context.sendJson({}, 'out');
```

### Required Input Validation

```javascript
if (!taskId) {
    throw new context.CancelError('Task ID is required!');
}
```

See: `.github/copilot-instructions.md` section "Component Behavior (JavaScript) Requirements"

### Output Port Schema

Use **either** `schema` or `options` in outPorts, **NOT both**.

See: `.github/copilot-instructions.md` section "Output Port Schema Definition"

## Testing Components

```bash
# Validate auth first
appmixer test auth validate ./src/appmixer/<connector>/auth.js

# Test component
appmixer test component ./src/appmixer/<connector>/core/<Component> -i '{"in":{...}}'
```

See: `.github/copilot-instructions.md` section "Testing Guidelines"

## E2E Test Flows

Required components in order:
1. `OnStart` → `BeforeAll` → `SetVariable` → Components under test → `Assert` → `AfterAll` → Cleanup → `ProcessE2EResults`

**BeforeAll is REQUIRED** — resets Assert/AfterAll state between runs.

**Critical:**
- Assertion types: `equal`, `notEmpty`, `regex` only
- Every component MUST be tested in at least one flow

See: `.github/copilot-instructions.md` section "End-to-End (E2E) Test Flows"

## Code Style

- 4 spaces indentation
- camelCase for JS variables
- Date fields: use `date-time` inspector type, not `text`
- Remove unused variables/imports

See: `.github/copilot-instructions.md` sections "Code Style Guidelines (For All)", "Development Guidelines (For All)"

## Reference

- **Full guide:** `.github/copilot-instructions.md`
- **External docs:** https://docs.appmixer.com/getting-started/custom-connectors

### Key Sections in Full Guide

| Topic | Section |
|-------|---------|
| Input/output types | "JSON Schema Reference", "Type Mapping for Input Ports" |
| Component.json structure | "Desired Attribute Order in component.json", "component.json Requirements" |
| Context methods | "Context API" |
| AI-specific rules | "Best Practices (AI Assistance)", "Critical Restrictions for AI Code Generation" |
