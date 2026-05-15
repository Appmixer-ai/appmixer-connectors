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
//   - addFailure(filePath, message)   record a failure
//   - relativePath(filePath)          repo-relative path for messages
//   - walkFiles(dir, matcher)         walk helper for custom file discovery

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

async function main() {

    const relativePath = makeRelativePath(REPO_ROOT);
    const updateThresholds = process.argv.includes('--update-thresholds');

    const bundleFiles = walkFiles(CONNECTORS_ROOT, (filePath) => path.basename(filePath) === 'bundle.json');
    const componentFiles = walkFiles(CONNECTORS_ROOT, (filePath) => path.basename(filePath) === 'component.json');

    const validators = discoverValidators();
    const thresholds = loadThresholds();
    const nextThresholds = { ...thresholds };

    const results = [];

    for (const validator of validators) {
        const failures = [];

        const context = {
            repoRoot: REPO_ROOT,
            connectorsRoot: CONNECTORS_ROOT,
            bundleFiles,
            componentFiles,
            walkFiles,
            relativePath,
            addFailure(filePath, message) {
                failures.push(`[${validator.name}] ${relativePath(filePath)}: ${message}`);
            }
        };

        await validator.run(context);

        const found = failures.length;
        const threshold = Object.prototype.hasOwnProperty.call(thresholds, validator.name)
            ? thresholds[validator.name]
            : null;

        let status;
        let regressed = false;

        if (threshold === null) {
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

        console.log(`- ${validator.name}: ${status}`);
        results.push({ validator, failures, threshold, regressed });
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
