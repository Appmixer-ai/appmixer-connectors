#!/usr/bin/env node
/**
 * Build .github/copilot-instructions.md from the CANONICAL instruction sources
 * in the public Appmixer-ai/appmixer-skills repository (instructions/*.md).
 *
 * This repo no longer carries instruction sources — the same single-source
 * pattern the validators follow (CLI suite -> appmixer@dev). Copilot still
 * needs its instructions at the magic path .github/copilot-instructions.md,
 * so the generated file IS committed here; re-run this script to refresh it
 * after the skills repo's instructions change.
 *
 * Usage: node scripts/build-instructions.js
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const OUTPUT = path.join(ROOT, '.github', 'copilot-instructions.md');
// The DEV branch, on purpose: this repo's dev tracks the skills repo's dev,
// the same alignment the validators follow (CLI dev -> appmixer@dev). Releases
// flow dev -> main in the skills repo, so main would lag behind the rules
// agents are actually building against here.
const TARBALL_URL = 'https://codeload.github.com/Appmixer-ai/appmixer-skills/tar.gz/refs/heads/dev';

const HEADER = '<!-- DO NOT EDIT — generated from the Appmixer-ai/appmixer-skills repository\n'
    + '     (instructions/*.md) by scripts/build-instructions.js.\n'
    + '     To change the content, open a PR against appmixer-skills, then re-run\n'
    + '     the script here to refresh this file. -->\n\n';

const workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'appmixer-instructions-'));

try {
    const tarball = path.join(workDir, 'skills.tgz');
    execFileSync('curl', ['-sSfL', TARBALL_URL, '-o', tarball]);
    execFileSync('tar', ['xzf', tarball, '--strip-components=1', '-C', workDir]);

    const inDir = path.join(workDir, 'instructions');
    const files = fs.readdirSync(inDir).filter((f) => f.endsWith('.md')).sort();

    if (files.length === 0) {
        throw new Error('No .md files found in the skills repo instructions/ directory.');
    }

    const sections = files.map((f) => fs.readFileSync(path.join(inDir, f), 'utf8').trim());
    fs.writeFileSync(OUTPUT, HEADER + sections.join('\n\n---\n\n') + '\n');
    console.log(`✅  Built ${path.relative(ROOT, OUTPUT)} from ${files.length} section(s) of appmixer-skills:`);
    for (const f of files) console.log(`   - ${f}`);
} finally {
    fs.rmSync(workDir, { recursive: true, force: true });
}
