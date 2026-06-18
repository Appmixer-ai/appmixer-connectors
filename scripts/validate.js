'use strict';

// Entry point for repository validation. Discovers and runs every validator
// in ./validators (any *.js file that does not start with an underscore).
//
// Thresholds (ratchet pattern)
// ----------------------------
// scripts/validators/.thresholds.json optionally caps the allowed number of
// failures per validator. A validator listed there fails CI only when its
// count exceeds the threshold (regression). When the count drops, the run
// prints a hint that the threshold can be lowered; pass --update-thresholds
// to write the new lower number back. Validators with no entry in the file
// are strict — any failure fails CI.
//
// Ignore-list (known false positives)
// -----------------------------------
// scripts/validators/_ignore-list.js lists specific (validator, path, message)
// reports that are intentionally suppressed, each with a recorded reason. A
// matching failure/warning is removed from the output and never fails CI. Run
// with --show-ignored to see what is suppressed and why; a full-repo run also
// notes any rule that matched nothing (likely stale).
//
// To add a new validator: create scripts/validators/<name>.js exporting
//   { name, description, run(context) }
// Context fields available to validators:
//   - repoRoot, connectorsRoot        absolute paths
//   - bundleFiles, componentFiles     pre-computed file lists
//   - addFailure(filePath, message)   record a hard failure (gated by threshold)
//   - addWarning(filePath, message)   record an informational warning (never fails CI)
//   - relativePath(filePath)          repo-relative path for messages
//   - walkFiles(dir, matcher)         walk helper for custom file discovery
//
// Flags
// -----
//   --update-thresholds        write lowered thresholds back when counts drop
//   --connector <name>         run all validators only for src/appmixer/<name>/,
//                              ignore thresholds, print every failure + warning
//   --changed                  validate only files changed on this branch (staged +
//                              unstaged + committed vs the base ref); strict, fails on
//                              any issue. Used by the pre-commit hook.
//   --show-suppressed          print failures that are normally hidden by a
//                              threshold (count ≤ threshold), so they can be
//                              fixed. Does not change CI exit status.
//   --show-ignored             list the reports suppressed by the ignore-list
//                              (scripts/validators/_ignore-list.js) and why.
//   --help, -h                 print usage and exit

const fs = require('fs');
const path = require('path');

const { walkFiles, makeRelativePath, getChangedFiles, isGitRepo } = require('./validators/_shared');
const ignoreRules = require('./validators/_ignore-list');

const DEFAULT_BASE_REF = 'dev';

const REPO_ROOT = path.resolve(__dirname, '..');
const CONNECTORS_ROOT = path.join(REPO_ROOT, 'src', 'appmixer');
const VALIDATORS_DIR = path.join(__dirname, 'validators');
const THRESHOLDS_PATH = path.join(VALIDATORS_DIR, '.thresholds.json');

function normalizeForMatch(relPath) {

    return relPath.split(path.sep).join('/');
}

// Returns the index of the first ignore-list rule matching this report, or -1.
// A rule matches when every constraint it declares holds (validator name,
// message substring, and — if given — one of its path substrings).
function findIgnoreRuleIndex(validatorName, relPath, message) {

    const normPath = normalizeForMatch(relPath);

    for (let i = 0; i < ignoreRules.length; i++) {
        const rule = ignoreRules[i];

        if (rule.validator && rule.validator !== validatorName) continue;
        if (rule.messageIncludes && !message.includes(rule.messageIncludes)) continue;

        if (Array.isArray(rule.paths) && rule.paths.length > 0) {
            const matchesPath = rule.paths.some((p) => normPath.includes(normalizeForMatch(p)));
            if (!matchesPath) continue;
        }

        return i;
    }

    return -1;
}

function printSuppressed(suppressed, showIgnored) {

    if (suppressed.length === 0) {
        return;
    }

    if (!showIgnored) {
        console.log(`\n${suppressed.length} report(s) suppressed by ignore-list (run with --show-ignored to see them).`);
        return;
    }

    console.log(`\nSuppressed by ignore-list (${suppressed.length}):`);
    for (const item of suppressed) {
        const tag = item.severity === 'warning' ? 'warn' : 'fail';
        console.log(`- (${tag}) ${item.text}`);
        console.log(`    reason: ${item.reason}`);
    }
}

function discoverValidators() {

    const entries = fs.readdirSync(VALIDATORS_DIR, { withFileTypes: true });
    const validators = [];

    for (const entry of entries) {
        if (!entry.isFile()) continue;
        if (!entry.name.endsWith('.js')) continue;
        if (entry.name.startsWith('_')) continue;

        const validatorPath = path.join(VALIDATORS_DIR, entry.name);
        const mod = require(validatorPath);

        if (!mod || typeof mod.run !== 'function' || typeof mod.name !== 'string') {
            throw new Error(`Invalid validator ${entry.name}: must export { name: string, run: function }`);
        }

        validators.push(mod);
    }

    validators.sort((left, right) => left.name.localeCompare(right.name));
    return validators;
}

function loadThresholds() {

    if (!fs.existsSync(THRESHOLDS_PATH)) {
        return {};
    }

    try {
        return JSON.parse(fs.readFileSync(THRESHOLDS_PATH, 'utf8'));
    } catch (error) {
        throw new Error(`Could not parse ${THRESHOLDS_PATH}: ${error.message}`);
    }
}

function writeThresholds(thresholds) {

    fs.writeFileSync(THRESHOLDS_PATH, JSON.stringify(thresholds, null, 4) + '\n');
}

function parseConnectorArg(argv) {

    const idx = argv.indexOf('--connector');
    if (idx === -1) return null;

    const value = argv[idx + 1];
    if (!value || value.startsWith('--')) {
        throw new Error('--connector requires a connector name (e.g. --connector bluesky)');
    }

    return value;
}

function printHelp() {

    console.log(`Usage: node scripts/validate.js [options]

Runs all validators in scripts/validators/ over bundle.json and component.json
files under src/appmixer/. Validators with an entry in
scripts/validators/.thresholds.json fail CI only when their failure count
exceeds the threshold (ratchet pattern); validators without an entry are strict.

Options:
  --changed              Strict mode scoped to a git diff: run every validator
                         only over bundle.json / component.json files that
                         changed vs the base ref (committed-on-branch + staged +
                         unstaged). Thresholds are IGNORED and ANY failure exits
                         1. This lets new/changed work be held to a clean bar
                         without having to first clear the repo-wide legacy debt.

  --base <ref>           Base ref for --changed (default "${DEFAULT_BASE_REF}").
                         The diff uses merge-base(<ref>, HEAD).

  --connector <name>     Run all validators only for src/appmixer/<name>/.
                         Thresholds are ignored and every failure + warning is
                         printed. Useful when developing a single connector.

  --changed              Validate only the files changed on this branch (staged +
                         unstaged + committed since the base branch). Strict —
                         exits non-zero on any issue. Used by the pre-commit hook.

  --show-suppressed      Print failures that are normally hidden because the
                         validator is at or under its threshold. Use this when
                         you want to fix the leftover issues. Does not change
                         the CI exit status.

  --show-ignored         List the reports suppressed by the ignore-list
                         (scripts/validators/_ignore-list.js), with the reason
                         each is treated as a known false positive.

  --update-thresholds    When a validator's failure count drops below its
                         current threshold, write the lower number back to
                         .thresholds.json so the ratchet tightens.

  --help, -h             Print this help and exit.

Examples:
  node scripts/validate.js
  node scripts/validate.js --changed
  node scripts/validate.js --changed --base origin/dev
  node scripts/validate.js --connector google/calendar
  node scripts/validate.js --changed
  node scripts/validate.js --show-suppressed
  node scripts/validate.js --update-thresholds
`);
}

function parseBaseArg(argv) {

    const idx = argv.indexOf('--base');
    if (idx === -1) return DEFAULT_BASE_REF;

    const value = argv[idx + 1];
    if (!value || value.startsWith('--')) {
        throw new Error('--base requires a git ref (e.g. --base origin/dev)');
    }

    return value;
}

// Strict, git-diff-scoped run. Returns true when the run failed (caller sets
// the exit code). Validators run over only the changed files; thresholds are
// ignored and any failure is a hard fail.
async function runChangedMode({ validators, bundleFiles, componentFiles, relativePath, baseRef, showIgnored }) {

    if (!isGitRepo(REPO_ROOT)) {
        console.error('--changed requires a git repository, but none was found.');
        return true;
    }

    const { files: changed, baseResolved, baseCommit } = getChangedFiles(REPO_ROOT, baseRef);

    if (!baseResolved) {
        console.warn(`Warning: could not resolve base ref "${baseRef}" — comparing staged + unstaged changes only.`);
    }

    const changedBundles = bundleFiles.filter((filePath) => changed.has(filePath));
    const changedComponents = componentFiles.filter((filePath) => changed.has(filePath));

    if (changedBundles.length === 0 && changedComponents.length === 0) {
        console.log('No changed bundle.json / component.json files to validate.');
        return false;
    }

    console.log(`Validating changed files (strict, thresholds ignored, ignore-list applied): ${changedBundles.length} bundle.json, ${changedComponents.length} component.json.\n`);

    let totalFailures = 0;
    // Reports matched by scripts/validators/_ignore-list.js are suppressed (known
    // false positives / intentional deviations) rather than failing the run.
    const suppressed = [];
    const ruleHits = new Array(ignoreRules.length).fill(0);

    for (const validator of validators) {
        const failures = [];
        const warnings = [];

        const context = {
            repoRoot: REPO_ROOT,
            connectorsRoot: CONNECTORS_ROOT,
            bundleFiles: changedBundles,
            componentFiles: changedComponents,
            // Resolved base commit for diff-aware validators (null if unresolved).
            baseRef: baseCommit,
            walkFiles,
            relativePath,
            addFailure(filePath, message) {
                const rel = relativePath(filePath);
                const ruleIndex = findIgnoreRuleIndex(validator.name, rel, message);
                if (ruleIndex !== -1) {
                    ruleHits[ruleIndex] += 1;
                    suppressed.push({ severity: 'failure', text: `[${validator.name}] ${rel}: ${message}`, reason: ignoreRules[ruleIndex].reason });
                    return;
                }
                failures.push(`[${validator.name}] ${rel}: ${message}`);
            },
            addWarning(filePath, message) {
                const rel = relativePath(filePath);
                const ruleIndex = findIgnoreRuleIndex(validator.name, rel, message);
                if (ruleIndex !== -1) {
                    ruleHits[ruleIndex] += 1;
                    suppressed.push({ severity: 'warning', text: `[${validator.name}] ${rel}: ${message}`, reason: ignoreRules[ruleIndex].reason });
                    return;
                }
                warnings.push(`[${validator.name}] ${rel}: ${message}`);
            }
        };

        await validator.run(context);

        const warnSuffix = warnings.length > 0 ? ` (+${warnings.length} warning(s))` : '';
        console.log(`- ${validator.name}: ${failures.length === 0 ? 'OK' : `${failures.length} issue(s)`}${warnSuffix}`);

        for (const failure of failures) {
            console.error(`  - ${failure}`);
        }
        for (const warning of warnings) {
            console.warn(`  - (warn) ${warning}`);
        }

        totalFailures += failures.length;
    }

    printSuppressed(suppressed, showIgnored);

    if (totalFailures > 0) {
        console.error(`\nValidation failed: ${totalFailures} issue(s) in changed files.`);
        return true;
    }

    console.log('\nValidation passed for changed files.');
    return false;
}

async function main() {

    if (process.argv.includes('--help') || process.argv.includes('-h')) {
        printHelp();
        return;
    }

    const relativePath = makeRelativePath(REPO_ROOT);
    const updateThresholds = process.argv.includes('--update-thresholds');
    const showSuppressed = process.argv.includes('--show-suppressed');
    const changedMode = process.argv.includes('--changed');
    const baseRef = parseBaseArg(process.argv);
    const showIgnored = process.argv.includes('--show-ignored');
    const connectorFilter = parseConnectorArg(process.argv);

    let bundleFiles = walkFiles(CONNECTORS_ROOT, (filePath) => path.basename(filePath) === 'bundle.json');
    let componentFiles = walkFiles(CONNECTORS_ROOT, (filePath) => path.basename(filePath) === 'component.json');

    if (connectorFilter) {
        const prefix = path.join(CONNECTORS_ROOT, connectorFilter) + path.sep;
        bundleFiles = bundleFiles.filter((filePath) => filePath.startsWith(prefix));
        componentFiles = componentFiles.filter((filePath) => filePath.startsWith(prefix));

        if (bundleFiles.length === 0 && componentFiles.length === 0) {
            console.error(`No files found for connector "${connectorFilter}". Expected path: src/appmixer/${connectorFilter}/`);
            process.exitCode = 1;
            return;
        }

        console.log(`Running all validators for connector "${connectorFilter}" (thresholds ignored, ${bundleFiles.length} bundle.json, ${componentFiles.length} component.json).\n`);
    }

    const validators = discoverValidators();

    // --changed mode: strict, scoped to a git diff. Mutually exclusive with the
    // repo-wide threshold run below.
    if (changedMode) {
        const failed = await runChangedMode({
            validators,
            bundleFiles,
            componentFiles,
            relativePath,
            baseRef,
            showIgnored
        });
        if (failed) {
            process.exitCode = 1;
        }
        return;
    }

    // --connector mode is a debugging view: skip thresholds, print everything.
    const thresholds = connectorFilter ? {} : loadThresholds();
    const nextThresholds = { ...thresholds };

    const results = [];
    // Reports matched by scripts/validators/_ignore-list.js are collected here instead
    // of being failed/warned — known false positives / intentional deviations, with reasons.
    const suppressed = [];
    const ruleHits = new Array(ignoreRules.length).fill(0);

    for (const validator of validators) {
        const failures = [];
        const warnings = [];

        const context = {
            repoRoot: REPO_ROOT,
            connectorsRoot: CONNECTORS_ROOT,
            bundleFiles,
            componentFiles,
            walkFiles,
            relativePath,
            addFailure(filePath, message) {
                const rel = relativePath(filePath);
                const ruleIndex = findIgnoreRuleIndex(validator.name, rel, message);
                if (ruleIndex !== -1) {
                    ruleHits[ruleIndex] += 1;
                    suppressed.push({ severity: 'failure', text: `[${validator.name}] ${rel}: ${message}`, reason: ignoreRules[ruleIndex].reason });
                    return;
                }
                failures.push(`[${validator.name}] ${rel}: ${message}`);
            },
            addWarning(filePath, message) {
                const rel = relativePath(filePath);
                const ruleIndex = findIgnoreRuleIndex(validator.name, rel, message);
                if (ruleIndex !== -1) {
                    ruleHits[ruleIndex] += 1;
                    suppressed.push({ severity: 'warning', text: `[${validator.name}] ${rel}: ${message}`, reason: ignoreRules[ruleIndex].reason });
                    return;
                }
                warnings.push(`[${validator.name}] ${rel}: ${message}`);
            }
        };

        await validator.run(context);

        const found = failures.length;
        const threshold = Object.prototype.hasOwnProperty.call(thresholds, validator.name)
            ? thresholds[validator.name]
            : null;

        let status;
        let regressed = false;

        if (connectorFilter) {
            // raw count, no threshold gating
            const warnSuffix = warnings.length > 0 ? ` + ${warnings.length} warning(s)` : '';
            status = `${found} issue(s)${warnSuffix}`;
        } else if (threshold === null) {
            // strict: any failure fails CI
            regressed = found > 0;
            status = found === 0 ? 'OK' : `${found} issue(s)`;
        } else if (found > threshold) {
            regressed = true;
            status = `${found} issue(s) — REGRESSION (threshold ${threshold}, +${found - threshold})`;
        } else if (found < threshold) {
            nextThresholds[validator.name] = found;
            status = `${found} issue(s) (under threshold ${threshold} — can be lowered)`;
        } else {
            status = `${found} issue(s) (at threshold ${threshold})`;
        }

        const warnSuffix = !connectorFilter && warnings.length > 0 ? ` (+${warnings.length} warning(s))` : '';
        console.log(`- ${validator.name}: ${status}${warnSuffix}`);
        results.push({ validator, failures, warnings, threshold, regressed });
    }

    // --connector is a read-only debugging view: print every failure + warning,
    // never fails CI (the --changed gate handles that, returning early above).
    if (connectorFilter) {
        for (const result of results) {
            for (const failure of result.failures) {
                console.error(`- ${failure}`);
            }
            for (const warning of result.warnings) {
                console.warn(`- (warn) ${warning}`);
            }
        }

        const totalFailures = results.reduce((sum, r) => sum + r.failures.length, 0);
        const totalWarnings = results.reduce((sum, r) => sum + r.warnings.length, 0);
        const suppressedSuffix = suppressed.length > 0 ? ` (${suppressed.length} suppressed by ignore-list)` : '';
        console.log(`\nConnector "${connectorFilter}": ${totalFailures} failure(s), ${totalWarnings} warning(s).${suppressedSuffix}`);
        printSuppressed(suppressed, showIgnored);
        return;
    }

    // Print full failure list only when there are real CI-failing regressions,
    // or when a threshold-bound validator regressed (so the diff is visible).
    const regressions = results.filter((r) => r.regressed);

    if (regressions.length > 0) {
        console.error('\nValidation failed:');

        for (const result of regressions) {
            for (const failure of result.failures) {
                console.error(`- ${failure}`);
            }
        }

        process.exitCode = 1;
        return;
    }

    // Warnings — informational only, never fail CI.
    const totalWarnings = results.reduce((sum, r) => sum + r.warnings.length, 0);

    if (totalWarnings > 0) {
        console.log(`\nWarnings (${totalWarnings}):`);

        for (const result of results) {
            for (const warning of result.warnings) {
                console.warn(`- ${warning}`);
            }
        }
    }

    // Reports suppressed by the ignore-list (known false positives), with reasons.
    printSuppressed(suppressed, showIgnored);

    // Flag ignore-list rules that matched nothing this run — likely stale. Only on full-repo
    // runs, since --connector deliberately processes a subset and would make most rules "miss".
    if (!connectorFilter) {
        const staleRules = ignoreRules.filter((rule, index) => ruleHits[index] === 0);
        if (staleRules.length > 0) {
            console.log(`\nNote: ${staleRules.length} ignore-list rule(s) matched nothing (possibly stale):`);
            for (const rule of staleRules) {
                const where = Array.isArray(rule.paths) && rule.paths.length > 0 ? ` @ ${rule.paths.join(', ')}` : '';
                console.log(`  - [${rule.validator || 'any'}] "${rule.messageIncludes || '(any message)'}"${where}`);
            }
        }
    }

    // --show-suppressed: print failures hidden by the threshold so they can be fixed.
    if (showSuppressed) {
        const suppressed = results.filter((r) => r.threshold !== null && r.failures.length > 0 && !r.regressed);
        const totalSuppressed = suppressed.reduce((sum, r) => sum + r.failures.length, 0);

        if (totalSuppressed > 0) {
            console.log(`\nSuppressed failures (${totalSuppressed}) — under threshold, not failing CI:`);

            for (const result of suppressed) {
                console.log(`\n  ${result.validator.name} (${result.failures.length} of ${result.threshold} allowed):`);
                for (const failure of result.failures) {
                    console.log(`  - ${failure}`);
                }
            }
        } else {
            console.log('\nNo suppressed failures — all thresholded validators are clean.');
        }
    }

    // No regressions. Offer / apply threshold lowering.
    const loweredThresholds = Object.keys(nextThresholds)
        .filter((name) => nextThresholds[name] !== thresholds[name]);

    if (loweredThresholds.length > 0) {
        if (updateThresholds) {
            writeThresholds(nextThresholds);
            console.log(`\nThresholds updated in ${path.relative(REPO_ROOT, THRESHOLDS_PATH)}:`);

            for (const name of loweredThresholds) {
                console.log(`  ${name}: ${thresholds[name]} -> ${nextThresholds[name]}`);
            }
        } else {
            console.log('\nThresholds can be lowered (re-run with --update-thresholds to apply):');

            for (const name of loweredThresholds) {
                console.log(`  ${name}: ${thresholds[name]} -> ${nextThresholds[name]}`);
            }
        }
    }

    console.log(`\nValidation passed (${validators.length} validators, ${bundleFiles.length} bundle.json, ${componentFiles.length} component.json).`);
}

main().catch((error) => {
    console.error('Validation crashed:', error);
    process.exitCode = 1;
});
