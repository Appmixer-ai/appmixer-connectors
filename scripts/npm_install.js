#!/usr/bin/env node
'use strict';

const fs = require('fs').promises;
const path = require('path');
const { spawn } = require('child_process');

const ROOT = process.cwd();
const SEARCH_DIR = path.join(ROOT, 'src', 'appmixer');
const MAX_JOBS = Number(process.env.MAX_JOBS) || 10;
const NPM_CMD = process.env.NPM_CMD || 'npm';
const NPM_ARGS = ['install', '--no-package-lock', '--no-audit', '--no-fund'];

async function collectPackageJson(startDir) {
    const results = [];

    async function walk(dir) {
        let entries;
        try {
            entries = await fs.readdir(dir, { withFileTypes: true });
        } catch (err) {
            return; // ignore directories we cannot read
        }

        for (const e of entries) {
            if (e.name === 'node_modules') continue;
            const full = path.join(dir, e.name);
            if (e.isDirectory()) {
                await walk(full);
            } else if (e.isFile() && e.name === 'package.json') {
                results.push(full);
            }
        }
    }

    await walk(startDir);
    results.sort();
    return results;
}

async function runAll(packageFiles) {
    if (packageFiles.length === 0) {
        console.log('No package.json files found in src/appmixer/');
        return 0;
    }

    console.log(`Found ${packageFiles.length} package.json files to process`);

    const total = packageFiles.length;
    let index = 0;
    const activeChildren = new Set();
    let failed = false;
    const results = [];

    return new Promise((resolve) => {
        function launchOne() {
            if (failed) return;
            if (index >= total) {
                if (activeChildren.size === 0) resolve(results);
                return;
            }

            const pkgPath = packageFiles[index++];
            const dir = path.dirname(pkgPath);

            const child = spawn(NPM_CMD, NPM_ARGS, { cwd: dir, stdio: 'inherit', shell: true });
            activeChildren.add(child);

            child.on('close', (code, signal) => {
                activeChildren.delete(child);
                const rc = code === 0 ? 0 : code || 1;
                if (rc === 0) {
                    console.log(`✓ Completed: ${dir}`);
                } else {
                    console.error(`✗ Failed: ${dir} (code=${rc}${signal ? ` signal=${signal}` : ''})`);
                }

                results.push({ dir, rc });

                if (rc !== 0) {
                    failed = true;
                    console.error('Failure detected, terminating remaining installs...');
                    for (const c of Array.from(activeChildren)) {
                        try { c.kill('SIGTERM'); } catch (e) { /* ignore */ }
                    }
                    setTimeout(() => {
                        for (const c of Array.from(activeChildren)) {
                            try { c.kill('SIGKILL'); } catch (e) { /* ignore */ }
                        }
                        resolve(results);
                    }, 200);
                    return;
                }

                if (!failed) launchOne();

                if (!failed && index >= total && activeChildren.size === 0) {
                    resolve(results);
                }
            });

            child.on('error', (err) => {
                activeChildren.delete(child);
                console.error(`✗ Failed to spawn npm for ${dir}: ${err.message}`);
                results.push({ dir, rc: 1 });
                failed = true;
                console.error('Failure detected, terminating remaining installs...');
                for (const c of Array.from(activeChildren)) {
                    try { c.kill('SIGTERM'); } catch (e) { /* ignore */ }
                }
                setTimeout(() => {
                    for (const c of Array.from(activeChildren)) {
                        try { c.kill('SIGKILL'); } catch (e) { /* ignore */ }
                    }
                    resolve(results);
                }, 200);
            });
        }

        const initial = Math.min(MAX_JOBS, total);
        for (let i = 0; i < initial; i++) launchOne();
    });
}

async function main() {
    try {
        const stat = await fs.stat(SEARCH_DIR).catch(() => null);
        if (!stat || !stat.isDirectory()) {
            console.log('No package.json files found in src/appmixer/');
            process.exit(0);
        }

        const packageFiles = await collectPackageJson(SEARCH_DIR);
        const results = await runAll(packageFiles);

        const failed = (results || []).some(r => r.rc !== 0);
        if (failed) process.exit(1);
        console.log('All dependencies installed successfully');
        process.exit(0);
    } catch (err) {
        console.error('Unexpected error:', err);
        process.exit(2);
    }
}

if (require.main === module) {
    main();
}
