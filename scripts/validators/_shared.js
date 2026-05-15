'use strict';

const fs = require('fs');
const path = require('path');

const IGNORED_DIRS = new Set(['node_modules', '.git', 'dist', 'coverage', '.cache']);

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

function makeRelativePath(repoRoot) {

    return function relativePath(filePath) {
        return path.relative(repoRoot, filePath);
    };
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

module.exports = {
    walkFiles,
    readJson,
    makeRelativePath,
    parseVersion,
    compareVersions
};
