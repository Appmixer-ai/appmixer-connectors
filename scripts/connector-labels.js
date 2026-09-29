#!/usr/bin/env node
'use strict';

/**
 * Connector labels — one GitHub label per releasable unit, named after the
 * connector ref the e2e tooling already uses (`appmixer:microsoft:mail`).
 *
 *   A label per bundle.json directory:  src/appmixer/microsoft/mail -> appmixer:microsoft:mail
 *   A label per shared connector root:  a directory above several bundles that
 *                                       ships files of its own (microsoft/auth.js,
 *                                       microsoft-commons.js, ...) -> appmixer:microsoft
 *
 *   Collapsed vendors (mcpservers):     one label for all their bundles -> appmixer:mcpservers
 *
 * Usage
 *   node scripts/connector-labels.js list     [--filter <prefix>]
 *   node scripts/connector-labels.js map      [--filter <prefix>]   path-prefix map as JSON
 *   node scripts/connector-labels.js flow <flow.json>               write the map into the
 *                                                                   PR-labelling integration
 *   node scripts/connector-labels.js labeler  [--filter <prefix>]   > .github/labeler.yml
 *   node scripts/connector-labels.js sync --repo <owner/repo> [--filter <prefix>] [--dry-run]
 *
 * New PRs are labelled by an Appmixer integration
 * (.github/appmixer-flows/pr-connector-labels.json), not a GitHub Action; after adding
 * a connector, run `sync` for both repos and `flow` on that file, then republish it.
 *
 * `--filter` keeps labels starting with the given ref prefix, e.g. `appmixer:microsoft`.
 * `sync` creates missing labels and updates colour/description of existing ones
 * through `gh label create --force`; it never deletes a label.
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'src');
const COLOR = '5319e7';
// GitHub rejects label names longer than this.
const MAX_LABEL = 50;
const COLLAPSED = ['mcpservers'];

function walk(dir, found) {

    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (!entry.isDirectory() || entry.name === 'node_modules' || entry.name.startsWith('.')) {
            continue;
        }
        const full = path.join(dir, entry.name);
        if (fs.existsSync(path.join(full, 'bundle.json'))) {
            found.push(full);
        }
        walk(full, found);
    }
    return found;
}

function refOf(dir) {

    return path.relative(SRC, dir).split(path.sep).join(':');
}

function relSrc(dir) {

    return path.relative(ROOT, dir).split(path.sep).join('/');
}

/**
 * Every label with the path globs that route a changed file to it.
 * @return {Array<{ name: string, dir: string, globs: string[] }>}
 */
function collectLabels() {

    const bundleDirs = walk(SRC, []);
    const bundleSet = new Set(bundleDirs);
    let labels = bundleDirs.map(dir => ({
        name: refOf(dir),
        dir: relSrc(dir),
        globs: [`${relSrc(dir)}/**`]
    }));

    // Shared roots: an ancestor below the vendor directory that is not a bundle
    // itself but ships files of its own, so a change there reaches every bundle
    // beneath it. Its own files, and any non-bundle subdirectory (artifacts/),
    // route to the root label.
    const roots = new Set();
    for (const dir of bundleDirs) {
        let parent = path.dirname(dir);
        while (path.dirname(parent) !== SRC && parent !== SRC) {
            if (!bundleSet.has(parent)) {
                roots.add(parent);
            }
            parent = path.dirname(parent);
        }
    }
    for (const dir of roots) {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        const ownFiles = entries.filter(e => e.isFile());
        if (!ownFiles.length) {
            continue;
        }
        const globs = [`${relSrc(dir)}/*`];
        for (const e of entries) {
            const child = path.join(dir, e.name);
            if (e.isDirectory() && e.name !== 'node_modules' && !bundleSet.has(child)
                && !bundleDirs.some(b => b.startsWith(child + path.sep))) {
                globs.push(`${relSrc(child)}/**`);
            }
        }
        labels.push({ name: refOf(dir), dir: relSrc(dir), globs });
    }

    // Vendors whose bundles share one label: generated MCP server wrappers,
    // whose refs also exceed GitHub's 50-character label limit.
    for (const vendor of COLLAPSED) {
        const prefix = `appmixer:${vendor}:`;
        if (labels.some(l => l.name.startsWith(prefix))) {
            const dir = `src/appmixer/${vendor}`;
            labels = labels.filter(l => !l.name.startsWith(prefix));
            labels.push({ name: `appmixer:${vendor}`, dir, globs: [`${dir}/**`] });
        }
    }
    labels = labels.filter(l => l.name.startsWith('appmixer:'));
    const tooLong = labels.filter(l => l.name.length > MAX_LABEL);
    if (tooLong.length) {
        throw new Error(`label name over ${MAX_LABEL} characters: ${tooLong.map(l => l.name).join(', ')}`);
    }

    return labels.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Path-prefix map for the PR-labelling integration: a changed file takes the
 * label of the deepest bundle directory containing it, else of the deepest
 * shared root containing it.
 * @return {{ bundles: Array<[string, string]>, roots: Array<[string, string]> }}
 */
function pathMap(labels) {

    const roots = labels.filter(l => !l.globs[0].endsWith('/**'));
    return {
        bundles: labels.filter(l => !roots.includes(l)).map(l => [l.dir + '/', l.name]),
        roots: roots.map(l => [l.dir + '/', l.name])
    };
}

function arg(name) {

    const i = process.argv.indexOf(name);
    return i === -1 ? undefined : process.argv[i + 1];
}

function main() {

    const command = process.argv[2];
    const filter = arg('--filter');
    const labels = collectLabels().filter(l => !filter || l.name === filter || l.name.startsWith(filter + ':'));

    if (command === 'list') {
        for (const l of labels) {
            console.log(`${l.name.padEnd(44)} ${l.globs.join('  ')}`);
        }
        console.error(`${labels.length} label(s)`);
        return;
    }

    if (command === 'map') {
        process.stdout.write(JSON.stringify(pathMap(labels)) + '\n');
        return;
    }

    if (command === 'flow') {
        // Rewrite the `const MAP = …;` line in the Code Block of the PR-labelling
        // integration (.github/appmixer-flows/pr-connector-labels.json).
        const file = process.argv[3];
        const flow = JSON.parse(fs.readFileSync(file, 'utf8'));
        const block = Object.values(flow.flow).find(c => c.type === 'appmixer.utils.controls.CodeBlock');
        const input = Object.values(block.config.transform.in)[0];
        const lambda = Object.values(input)[0].lambda;
        if (!/const MAP = .*;/.test(lambda.code)) {
            throw new Error(`no "const MAP = …;" line in the Code Block of ${file}`);
        }
        lambda.code = lambda.code.replace(/const MAP = .*;/, `const MAP = ${JSON.stringify(pathMap(labels))};`);
        fs.writeFileSync(file, JSON.stringify(flow, null, 4) + '\n');
        console.error(`${labels.length} label(s) written into ${file}`);
        return;
    }

    if (command === 'labeler') {
        const out = [
            '# Generated by scripts/connector-labels.js — do not edit by hand.',
            '# One label per bundle.json (releasable unit) plus one per shared connector',
            '# root; a PR gets every label whose paths it touches.',
            ''
        ];
        for (const l of labels) {
            out.push(`'${l.name}':`);
            out.push('  - changed-files:');
            out.push('      - any-glob-to-any-file:');
            for (const g of l.globs) {
                out.push(`          - '${g}'`);
            }
        }
        process.stdout.write(out.join('\n') + '\n');
        return;
    }

    if (command === 'sync') {
        const repo = arg('--repo');
        if (!repo) {
            throw new Error('--repo <owner/repo> is required for sync');
        }
        const dryRun = process.argv.includes('--dry-run');
        for (const l of labels) {
            const description = `Connector: ${l.dir}`;
            if (dryRun) {
                console.log(`would sync ${repo}  ${l.name}  (${description})`);
                continue;
            }
            execFileSync('gh', ['label', 'create', l.name, '--repo', repo, '--color', COLOR,
                '--description', description, '--force'], { stdio: 'inherit' });
        }
        console.error(`${labels.length} label(s) ${dryRun ? 'planned' : 'synced'} on ${repo}`);
        return;
    }

    console.error('usage: connector-labels.js <list|labeler|sync> [--filter <prefix>] [--repo <owner/repo>] [--dry-run]');
    process.exit(1);
}

main();
