#!/usr/bin/env node
/**
 * Split .github/copilot-instructions.md into individual section files
 * under .github/instructions/<nn>-<slug>.md
 *
 * Usage: node scripts/split-instructions.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SOURCE = path.join(ROOT, '.github', 'copilot-instructions.md');
const OUT_DIR = path.join(ROOT, '.github', 'instructions');

// Map: section header prefix → output filename
const SECTION_FILES = [
    { prefix: 'Appmixer Development',        file: '00-overview.md' },
    { prefix: 'Part 1',                      file: '01-connectors.md' },
    { prefix: 'Part 2',                      file: '02-authentication.md' },
    { prefix: 'Part 3',                      file: '03-plugins.md' },
    { prefix: 'Part 4',                      file: '04-components.md' },
    { prefix: 'Part 5',                      file: '05-component-config.md' },
    { prefix: 'Part 6',                      file: '06-component-behavior.md' },
    { prefix: 'Part 7',                      file: '07-component-types.md' },
    { prefix: 'Part 8',                      file: '08-best-practices.md' },
    { prefix: 'Testing Guidelines',          file: '09-testing.md' },
    { prefix: 'Development instructions',    file: '10-agent-instructions.md' },
];

const content = fs.readFileSync(SOURCE, 'utf8');
const lines = content.split('\n');

// Split into sections by top-level `# ` headers
const sections = [];
let current = null;

for (const line of lines) {
    if (line.startsWith('# ')) {
        if (current) sections.push(current);
        const match = SECTION_FILES.find(s => line.includes(s.prefix));
        current = { header: line, file: match ? match.file : null, lines: [line] };
    } else {
        if (current) current.lines.push(line);
    }
}
if (current) sections.push(current);

// Write output
fs.mkdirSync(OUT_DIR, { recursive: true });

for (const section of sections) {
    if (!section.file) {
        console.warn(`⚠️  No file mapping for: "${section.header}" — skipping`);
        continue;
    }
    const outPath = path.join(OUT_DIR, section.file);
    // Trim trailing blank lines, keep one newline at end
    const text = section.lines.join('\n').trimEnd() + '\n';
    fs.writeFileSync(outPath, text, 'utf8');
    console.log(`✅  ${section.file}  (${section.lines.length} lines)`);
}

console.log(`\nDone. ${sections.filter(s => s.file).length} files written to .github/instructions/`);
