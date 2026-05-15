'use strict';

// Entry point for repository validation. Discovers and runs every validator
// in ./validators (any *.js file that does not start with an underscore).
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

async function main() {

    const relativePath = makeRelativePath(REPO_ROOT);
    const failures = [];

    const bundleFiles = walkFiles(CONNECTORS_ROOT, (filePath) => path.basename(filePath) === 'bundle.json');
    const componentFiles = walkFiles(CONNECTORS_ROOT, (filePath) => path.basename(filePath) === 'component.json');

    const validators = discoverValidators();

    for (const validator of validators) {
        const before = failures.length;

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

        const found = failures.length - before;
        const status = found === 0 ? 'OK' : `${found} issue(s)`;
        console.log(`- ${validator.name}: ${status}`);
    }

    if (failures.length > 0) {
        console.error('\nValidation failed:');

        for (const failure of failures) {
            console.error(`- ${failure}`);
        }

        process.exitCode = 1;
        return;
    }

    console.log(`\nValidation passed (${validators.length} validators, ${bundleFiles.length} bundle.json, ${componentFiles.length} component.json).`);
}

main().catch((error) => {
    console.error('Validation crashed:', error);
    process.exitCode = 1;
});
