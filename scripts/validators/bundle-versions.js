'use strict';

// What this validator checks
// --------------------------
// For every `bundle.json` under src/appmixer:
//   1. `bundle.version` is valid semver (MAJOR.MINOR.PATCH[-prerelease]).
//   2. `bundle.changelog` exists, is a plain object, and is non-empty.
//   3. Every key in `bundle.changelog` is valid semver.
//   4. `bundle.version` equals the highest semver among `Object.keys(bundle.changelog)`.
//
// Why
// ---
// The marketplace UI shows the changelog of the version published as `bundle.version`.
// If the two drift, users see stale notes after a bump, or the new version ships with
// no notes at all. Catching it in CI prevents that class of bug.

const { readJson, parseVersion, compareVersions } = require('./_shared');

function validateBundle(bundlePath, addFailure) {

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

module.exports = {
    name: 'bundle-versions',
    description: 'bundle.json version matches the latest changelog entry',
    run(context) {
        for (const bundlePath of context.bundleFiles) {
            validateBundle(bundlePath, context.addFailure);
        }
    }
};
