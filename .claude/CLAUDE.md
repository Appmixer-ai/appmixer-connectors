# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**Connector rules live in one place:** the [`instructions/`](https://github.com/Appmixer-ai/appmixer-skills/tree/dev/instructions) directory of the public [appmixer-skills](https://github.com/Appmixer-ai/appmixer-skills) repository (`dev` branch), also installable as a Claude Code plugin. `.github/copilot-instructions.md` here is only a pointer to it.

This file does not restate those rules. A copy goes stale as soon as a rule changes: the "List = all items" row that used to be here outlived appmixer-skills#52 (no public List components, Find reads one page), and a review blocked a PR on it. When you need a rule, read the skills file it lives in (see "Where each rule lives" below). To change a rule, open a PR against appmixer-skills, not this file.

## Commands

```bash
# Install dependencies
node scripts/npm_install.js

# Run tests
npm run test-unit
npm run test-unit -- test/<connector_name>

# Linting
npm run lint

# Validation while developing a connector (strict: thresholds ignored,
# prints every failure and warning) — ALWAYS prefer this scoped form
node scripts/validate.js --connector <connector_name>

# Strict validation of files changed on the branch (used by pre-commit)
node scripts/validate.js --changed

# Repository-wide validation (threshold/ratchet mode — legacy debt is
# tolerated, so new issues in your connector can hide under a threshold)
npm run validate

# Validate outputType components
npm run validate-outputtype
```

When working on a single connector, always validate with `--connector <name>`; use `--changed` when changes span multiple connectors. Run repo-wide `npm run validate` after major refactors so bundle metadata, component schema/inspector pairs, and quota resource references stay in sync.

## Connector Structure

```
src/appmixer/<connector_name>/
├── service.json       # Service metadata
├── auth.js            # Authentication (OAuth2 or API key)
├── bundle.json        # Version and changelog
├── lib.js             # Shared utilities (copied per connector, not shared)
├── artifacts/         # test-flows/, test/, ai-artifacts/
└── core/
    └── <ComponentName>/
        ├── component.json
        └── <ComponentName>.js
```

## Testing Components

```bash
# Validate auth first
appmixer test auth validate ./src/appmixer/<connector>/auth.js

# Test component
appmixer test component ./src/appmixer/<connector>/core/<Component> -i '{"in":{...}}'

# E2E flows: local validator, then upload and run on the instance
appmixer e2e validate ./src/appmixer/<connector>/artifacts/test-flows
appmixer e2e import ./src/appmixer/<connector>/artifacts/test-flows
appmixer e2e run <flowId>
```

## Where each rule lives

All links point to [appmixer-skills `instructions/`](https://github.com/Appmixer-ai/appmixer-skills/tree/dev/instructions) on `dev`.

- **Connector structure, service.json, bundle.json:** [`01-connectors.md`](https://github.com/Appmixer-ai/appmixer-skills/blob/dev/instructions/01-connectors.md)
- **Authentication (OAuth 2.0, API key):** [`02-authentication.md`](https://github.com/Appmixer-ai/appmixer-skills/blob/dev/instructions/02-authentication.md)
- **Plugins, context API:** [`03-plugins.md`](https://github.com/Appmixer-ai/appmixer-skills/blob/dev/instructions/03-plugins.md), [`06-component-behavior.md`](https://github.com/Appmixer-ai/appmixer-skills/blob/dev/instructions/06-component-behavior.md)
- **component.json (attribute order, inputs, output port schema and examples):** [`05-component-config.md`](https://github.com/Appmixer-ai/appmixer-skills/blob/dev/instructions/05-component-config.md)
- **Component types (Find, private List sources, Get, Create, Update, Delete, triggers), outputType helpers and the canonical `lib.js`:** [`07-component-types.md`](https://github.com/Appmixer-ai/appmixer-skills/blob/dev/instructions/07-component-types.md)
- **Best practices, code style, input validation:** [`08-best-practices.md`](https://github.com/Appmixer-ai/appmixer-skills/blob/dev/instructions/08-best-practices.md)
- **Testing:** [`09-testing.md`](https://github.com/Appmixer-ai/appmixer-skills/blob/dev/instructions/09-testing.md), trigger `test()`: [`10-trigger-test-method.md`](https://github.com/Appmixer-ai/appmixer-skills/blob/dev/instructions/10-trigger-test-method.md)
- **E2E flows (generate, upload, run):** [`11-e2e-flow-generation.md`](https://github.com/Appmixer-ai/appmixer-skills/blob/dev/instructions/11-e2e-flow-generation.md), [`12-e2e-upload.md`](https://github.com/Appmixer-ai/appmixer-skills/blob/dev/instructions/12-e2e-upload.md), [`13-e2e-run.md`](https://github.com/Appmixer-ai/appmixer-skills/blob/dev/instructions/13-e2e-run.md)
- **Long-running / async components:** [`14-async-components.md`](https://github.com/Appmixer-ai/appmixer-skills/blob/dev/instructions/14-async-components.md)
- **Live verification, `ITEM_SCHEMA`, `verify.json`:** [`15-live-verification.md`](https://github.com/Appmixer-ai/appmixer-skills/blob/dev/instructions/15-live-verification.md)
- **AI-specific rules and restrictions:** [`16-agent-instructions.md`](https://github.com/Appmixer-ai/appmixer-skills/blob/dev/instructions/16-agent-instructions.md)
- **Demo flows:** [`17-demo-flows.md`](https://github.com/Appmixer-ai/appmixer-skills/blob/dev/instructions/17-demo-flows.md)
- **AI agent tools:** [`18-ai-agents.md`](https://github.com/Appmixer-ai/appmixer-skills/blob/dev/instructions/18-ai-agents.md)
- **Security dependency fixes:** [`19-security-dependency-fixes.md`](https://github.com/Appmixer-ai/appmixer-skills/blob/dev/instructions/19-security-dependency-fixes.md)
- **External docs:** https://docs.appmixer.com/getting-started/custom-connectors
