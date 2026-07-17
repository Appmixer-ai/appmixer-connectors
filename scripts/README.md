# scripts/

Repository tooling. Most commands have a matching `npm run` alias in `package.json`.

## Validation

Two ways to run the static validators in `scripts/validators/`:

| Command | Scope | Thresholds | Use when |
|---------|-------|------------|----------|
| `npm run validate` | Whole repo | Ratcheted via `.thresholds.json` | CI baseline, after big refactors |
| `npm run validate:changed` | Only your git diff | Ignored (strict) | Before every commit / PR |

### `npm run validate` — whole repo, ratcheted

Runs every validator over all `bundle.json` / `component.json` under `src/appmixer/`.
A validator listed in `scripts/validators/.thresholds.json` fails CI only when its
failure count **exceeds** the threshold (regression). Validators with no entry are
strict. When a count drops below its threshold, re-run with `--update-thresholds`
to tighten the ratchet. Use `--show-suppressed` to see failures currently hidden
under a threshold, and `--connector <name>` to debug a single connector.

### `npm run validate:changed` — strict, scoped to your diff

```bash
npm run validate:changed                       # diff vs base ref (default: dev)
node scripts/validate.js --changed --base origin/dev
```

Runs every validator over **only** the `bundle.json` / `component.json` files in
your diff — committed-on-branch (`merge-base(<base>, HEAD)`) plus staged and
unstaged changes. Thresholds are **ignored** and **any** failure exits 1. This is
the gate for new work: it holds your changes to a clean bar without forcing you to
first clear the repo-wide legacy debt. If the base ref can't be resolved (e.g. CI
without `dev` fetched), it falls back to staged + unstaged only and warns.

Full options: `node scripts/validate.js --help`.

## Pre-commit hook

`scripts/hooks/pre-commit` runs `validate.js --changed` and blocks the commit on
any failure.

```bash
npm run hooks:install     # sets core.hooksPath=scripts/hooks, makes hooks executable
git commit --no-verify    # bypass once (use sparingly)
```

CI tip: also run `node scripts/validate.js --changed --base origin/dev` on PRs into
`dev`, so the gate still applies when someone bypasses the hook.

## Adding a validator

Create `scripts/validators/<name>.js` exporting `{ name, description, run(context) }`.
It's auto-discovered (files starting with `_` are skipped). The `context` provides
`repoRoot`, `connectorsRoot`, `bundleFiles`, `componentFiles`, `walkFiles`,
`relativePath`, and `addFailure(filePath, message)` / `addWarning(filePath, message)`.

## Other scripts

| Script | Purpose |
|--------|---------|
| `npm run test-unit` | Unit tests (`run_test_unit.js`) |
| `npm run lint` | ESLint |
| `build-instructions.js` | Build `.github` instruction docs |
| `npm_install.js` | Install connector dependencies |
