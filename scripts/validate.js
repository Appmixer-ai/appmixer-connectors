'use strict';

const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..');
const CONNECTORS_ROOT = path.join(REPO_ROOT, 'src', 'appmixer');
const IGNORED_DIRS = new Set(['node_modules', '.git', 'dist', 'coverage', '.cache']);

const failures = [];

function walkFiles(dirPath, matcher, result = []) {

    let entries;

    try {
        entries = fs.readdirSync(dirPath, { withFileTypes: true });
    } catch (err) {
        return result;
    }

    for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);

        if (entry.isDirectory()) {
            if (!IGNORED_DIRS.has(entry.name)) {
                walkFiles(fullPath, matcher, result);
            }
            continue;
        }

        if (matcher(fullPath)) {
            result.push(fullPath);
        }
    }

    return result;
}

function readJson(filePath) {

    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function relativePath(filePath) {

    return path.relative(REPO_ROOT, filePath);
}

function addFailure(filePath, message) {

    failures.push(`${relativePath(filePath)}: ${message}`);
}

function parseVersion(version) {

    const match = /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?$/.exec(version);

    if (!match) {
        return null;
    }

    return {
        major: Number(match[1]),
        minor: Number(match[2]),
        patch: Number(match[3]),
        prerelease: match[4] || ''
    };
}

function compareVersions(left, right) {

    for (const key of ['major', 'minor', 'patch']) {
        if (left[key] !== right[key]) {
            return left[key] - right[key];
        }
    }

    if (left.prerelease === right.prerelease) {
        return 0;
    }

    if (!left.prerelease) {
        return 1;
    }

    if (!right.prerelease) {
        return -1;
    }

    return left.prerelease.localeCompare(right.prerelease, undefined, {
        numeric: true,
        sensitivity: 'base'
    });
}

function validateBundleVersions(bundlePath) {

    let bundle;

    try {
        bundle = readJson(bundlePath);
    } catch (error) {
        addFailure(bundlePath, `failed to parse JSON: ${error.message}`);
        return;
    }

    const currentVersion = parseVersion(bundle.version || '');

    if (!currentVersion) {
        addFailure(bundlePath, `invalid bundle version '${bundle.version || ''}'`);
        return;
    }

    const changelog = bundle.changelog;

    if (!changelog || typeof changelog !== 'object' || Array.isArray(changelog)) {
        addFailure(bundlePath, 'missing or invalid changelog object');
        return;
    }

    const changelogVersions = Object.keys(changelog);

    if (changelogVersions.length === 0) {
        addFailure(bundlePath, 'changelog must contain at least one version');
        return;
    }

    const parsedChangelogVersions = changelogVersions.map((version) => ({
        raw: version,
        parsed: parseVersion(version)
    }));

    const invalidVersion = parsedChangelogVersions.find(({ parsed }) => !parsed);

    if (invalidVersion) {
        addFailure(bundlePath, `invalid changelog version '${invalidVersion.raw}'`);
        return;
    }

    parsedChangelogVersions.sort((left, right) => compareVersions(left.parsed, right.parsed));

    const latestVersion = parsedChangelogVersions.at(-1).raw;

    if (bundle.version !== latestVersion) {
        addFailure(bundlePath, `bundle version '${bundle.version}' does not match latest changelog version '${latestVersion}'`);
    }
}

function getSchemaProperties(schema) {

    if (!schema || typeof schema !== 'object' || Array.isArray(schema)) {
        return new Set();
    }

    const properties = schema.properties;

    if (!properties || typeof properties !== 'object' || Array.isArray(properties)) {
        return new Set();
    }

    return new Set(Object.keys(properties));
}

function schemaUsesUnsupportedExpressions(schema) {

    if (!schema || typeof schema !== 'object' || Array.isArray(schema)) {
        return false;
    }

    // TODO: we should ideally support these at some point,
    // but for now we want to allow them in the schema without causing false positives in the inspector validation
    if (Array.isArray(schema.oneOf) || Array.isArray(schema.anyOf)) {
        return true;
    }

    for (const value of Object.values(schema)) {
        if (Array.isArray(value)) {
            for (const item of value) {
                if (schemaUsesUnsupportedExpressions(item)) {
                    return true;
                }
            }
            continue;
        }

        if (schemaUsesUnsupportedExpressions(value)) {
            return true;
        }
    }

    return false;
}

function schemaHasPropertyPath(schema, inputName) {

    if (!inputName) {
        return false;
    }

    const directProperties = getSchemaProperties(schema);

    if (directProperties.has(inputName)) {
        return true;
    }

    const parts = inputName.split('.');
    let currentSchema = schema;

    for (const part of parts) {
        if (!currentSchema || typeof currentSchema !== 'object' || Array.isArray(currentSchema)) {
            return false;
        }

        const properties = currentSchema.properties;

        if (!properties || typeof properties !== 'object' || Array.isArray(properties) || !properties[part]) {
            return false;
        }

        currentSchema = properties[part];
    }

    return true;
}

function validateInspectorAgainstSchema(filePath, location, schema, inspector) {

    if (!schema || typeof schema !== 'object' || Array.isArray(schema)) {
        return;
    }

    if (schemaUsesUnsupportedExpressions(schema)) {
        return;
    }

    if (!inspector || typeof inspector !== 'object' || Array.isArray(inspector)) {
        return;
    }

    const inputs = inspector.inputs;

    if (!inputs || typeof inputs !== 'object' || Array.isArray(inputs)) {
        return;
    }

    for (const inputName of Object.keys(inputs)) {
        if (!schemaHasPropertyPath(schema, inputName)) {
            addFailure(filePath, `${location} inspector input '${inputName}' is missing from schema.properties`);
        }
    }
}

function validateComponentSchemas(componentPath) {

    let component;

    try {
        component = readJson(componentPath);
    } catch (error) {
        addFailure(componentPath, `failed to parse JSON: ${error.message}`);
        return;
    }

    const inPorts = Array.isArray(component.inPorts) ? component.inPorts : [];

    for (let index = 0; index < inPorts.length; index++) {
        const inPort = inPorts[index];
        validateInspectorAgainstSchema(componentPath, `inPorts[${index}]`, inPort.schema, inPort.inspector);
    }
}

function getQuotaResources(quotaPath) {

    try {
        delete require.cache[require.resolve(quotaPath)];
        const quotaModule = require(quotaPath);
        const rules = Array.isArray(quotaModule && quotaModule.rules) ? quotaModule.rules : [];

        return new Set(
            rules
                .map((rule) => rule && rule.resource)
                .filter((resource) => typeof resource === 'string' && resource.length > 0)
        );
    } catch (error) {
        addFailure(quotaPath, `failed to load quota file: ${error.message}`);
        return null;
    }
}

function managerToQuotaPath(manager) {

    if (typeof manager !== 'string' || !manager.startsWith('appmixer:')) {
        return null;
    }

    const managerParts = manager.split(':').slice(1);
    return path.join(CONNECTORS_ROOT, ...managerParts, 'quota.js');
}

function normalizeQuotaResources(resources) {

    if (typeof resources === 'string') {
        return [resources];
    }

    if (Array.isArray(resources)) {
        return resources.filter((resource) => typeof resource === 'string' && resource.length > 0);
    }

    return [];
}

function validateQuotaResources(componentPath) {

    let component;

    try {
        component = readJson(componentPath);
    } catch (error) {
        addFailure(componentPath, `failed to parse JSON: ${error.message}`);
        return;
    }

    const quota = component.quota;

    if (!quota || typeof quota !== 'object' || Array.isArray(quota)) {
        return;
    }

    const resources = normalizeQuotaResources(quota.resources);

    if (resources.length === 0) {
        return;
    }

    if (!quota.manager) {
        addFailure(componentPath, `quota.resources references ${resources.join(', ')} but quota.manager is missing`);
        return;
    }

    const quotaPath = managerToQuotaPath(quota.manager);

    if (!quotaPath) {
        addFailure(componentPath, `unsupported quota manager '${quota.manager}'`);
        return;
    }

    if (!fs.existsSync(quotaPath)) {
        addFailure(componentPath, `quota manager '${quota.manager}' points to missing file ${relativePath(quotaPath)}`);
        return;
    }

    const knownResources = getQuotaResources(quotaPath);

    if (!knownResources) {
        return;
    }

    for (const resource of resources) {
        if (!knownResources.has(resource)) {
            addFailure(componentPath, `quota resource '${resource}' is not defined in ${relativePath(quotaPath)}`);
        }
    }
}

function main() {

    const bundleFiles = walkFiles(CONNECTORS_ROOT, (filePath) => path.basename(filePath) === 'bundle.json');
    const componentFiles = walkFiles(CONNECTORS_ROOT, (filePath) => path.basename(filePath) === 'component.json');

    for (const bundleFile of bundleFiles) {
        validateBundleVersions(bundleFile);
    }

    for (const componentFile of componentFiles) {
        validateComponentSchemas(componentFile);
        validateQuotaResources(componentFile);
    }

    if (failures.length > 0) {
        console.error('Validation failed.');

        for (const failure of failures) {
            console.error(`- ${failure}`);
        }

        process.exitCode = 1;
        return;
    }

    console.log(`Validation passed for ${bundleFiles.length} bundle.json files and ${componentFiles.length} component.json files.`);
}

main();
