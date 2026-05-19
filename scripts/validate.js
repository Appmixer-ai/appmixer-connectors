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

const fs = require('fs');
const path = require('path');

const { walkFiles, makeRelativePath } = require('./validators/_shared');

const REPO_ROOT = path.resolve(__dirname, '..');
const CONNECTORS_ROOT = path.join(REPO_ROOT, 'src', 'appmixer');
const VALIDATORS_DIR = path.join(__dirname, 'validators');
const THRESHOLDS_PATH = path.join(VALIDATORS_DIR, '.thresholds.json');

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

async function main() {

    const relativePath = makeRelativePath(REPO_ROOT);
    const updateThresholds = process.argv.includes('--update-thresholds');
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
    // --connector mode is a debugging view: skip thresholds, print everything.
    const thresholds = connectorFilter ? {} : loadThresholds();
    const nextThresholds = { ...thresholds };

    const results = [];

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
                failures.push(`[${validator.name}] ${relativePath(filePath)}: ${message}`);
            },
            addWarning(filePath, message) {
                warnings.push(`[${validator.name}] ${relativePath(filePath)}: ${message}`);
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

    // --connector mode: print every failure + warning, never fail CI.
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
        console.log(`\nConnector "${connectorFilter}": ${totalFailures} failure(s), ${totalWarnings} warning(s).`);
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
