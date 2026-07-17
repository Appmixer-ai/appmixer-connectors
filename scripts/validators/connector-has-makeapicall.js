'use strict';

// What this validator checks
// --------------------------
// Every connector SHOULD ship a generic MakeApiCall component — a "call any
// endpoint" escape hatch that lets flow builders reach endpoints we haven't
// wrapped in a dedicated component yet. This validator asserts that each
// connector root (a directory holding a bundle.json) contains a component
// folder named `MakeApiCall` (the `MakeAPICall` casing is also accepted, since
// a few older connectors use it).
//
// What counts as a connector
// --------------------------
// One bundle.json == one connector. Connectors can be nested under a vendor
// namespace (e.g. google/gmail, microsoft/sharepoint), so the search for a
// MakeApiCall folder is scoped to the connector's own subtree and STOPS at any
// nested bundle.json — a child connector's MakeApiCall must not credit its
// parent (and vice versa).
//
// The presence check hits the filesystem directly (not context.componentFiles)
// so it stays correct under --changed, where componentFiles is filtered to the
// diff: changing only a connector's bundle.json must still see its existing
// MakeApiCall on disk.
//
// Threshold-gated (ratchet)
// -------------------------
// Listed in scripts/validators/.thresholds.json with a cap equal to the number
// of connectors still missing MakeApiCall. CI fails only when the count goes UP
// (a new connector ships without one); as connectors gain MakeApiCall the count
// drops and the threshold can be ratcheted down with --update-thresholds. The
// target floor is 0.
//
// Connectors that legitimately have no remote API to call (engine-internal
// utility bundles such as utils/*) are suppressed via
// scripts/validators/_ignore-list.js with a recorded reason, like every other
// validator's known deviations.

const fs = require('fs');
const path = require('path');

const IGNORED_DIRS = new Set(['node_modules', '.git', 'dist', 'coverage', '.cache']);

function isMakeApiCallName(name) {

    return /^MakeApi?Call$/i.test(name);
}

// Walks `dir` looking for a MakeApiCall component folder (a directory named
// MakeApiCall/MakeAPICall that holds a component.json). Does NOT descend into a
// subdirectory that contains its own bundle.json — that subtree is a separate
// connector and owns its own MakeApiCall.
function hasMakeApiCall(dir) {

    let entries;

    try {
        entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch (err) {
        return false;
    }

    const subDirs = [];

    for (const entry of entries) {
        if (!entry.isDirectory() || IGNORED_DIRS.has(entry.name)) {
            continue;
        }

        const fullPath = path.join(dir, entry.name);

        if (isMakeApiCallName(entry.name) && fs.existsSync(path.join(fullPath, 'component.json'))) {
            return true;
        }

        subDirs.push(fullPath);
    }

    for (const subDir of subDirs) {
        // A nested connector boundary — its MakeApiCall belongs to it, not here.
        if (fs.existsSync(path.join(subDir, 'bundle.json'))) {
            continue;
        }

        if (hasMakeApiCall(subDir)) {
            return true;
        }
    }

    return false;
}

module.exports = {
    name: 'connector-has-makeapicall',
    description: 'Every connector ships a generic MakeApiCall component (ratchet)',
    run(context) {
        for (const bundlePath of context.bundleFiles) {
            const connectorRoot = path.dirname(bundlePath);

            if (!hasMakeApiCall(connectorRoot)) {
                context.addFailure(bundlePath, 'connector has no MakeApiCall component — add a generic "call any endpoint" component (core/MakeApiCall) following the standard in issue #1459');
            }
        }
    }
};
