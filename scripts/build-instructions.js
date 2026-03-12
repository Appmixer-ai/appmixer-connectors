#!/usr/bin/env node
/**
 * Build .github/copilot-instructions.md from individual section files
 * in .github/instructions/*.md (sorted by filename).
 *
 * Usage: node scripts/build-instructions.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const IN_DIR = path.join(ROOT, '.github', 'instructions');
const OUTPUT = path.join(ROOT, '.github', 'copilot-instructions.md');

const HEADER = '<!-- DO NOT EDIT — generated from .github/instructions/* by scripts/build-instructions.js -->\n\n';

if (!fs.existsSync(IN_DIR)) {
    console.error(`❌  Instructions directory not found: ${IN_DIR}`);
    process.exit(1);
}

const files = fs.readdirSync(IN_DIR)
    .filter(f => f.endsWith('.md'))
    .sort();

if (files.length === 0) {
    console.error('❌  No .md files found in .github/instructions/');
    process.exit(1);
}

const parts = files.map(file => {
    const content = fs.readFileSync(path.join(IN_DIR, file), 'utf8').trimEnd();
    console.log(`📄  ${file}`);
    return content;
});

const combined = HEADER + parts.join('\n\n') + '\n';
fs.writeFileSync(OUTPUT, combined, 'utf8');

console.log(`\n✅  Built ${OUTPUT} from ${files.length} files (${combined.length} chars)`);
