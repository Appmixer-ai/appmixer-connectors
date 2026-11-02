'use strict';

// Every per-connector lib.js that writes the `file` output of a Find/List
// component must produce RFC 4180 CSV: a cell holding a comma, a double quote
// or a line break is quoted with its inner quotes doubled, cells follow the
// header columns (not Object.values of each record), null is an empty cell and
// an empty result set is an empty file. The helper is copy-pasted per connector
// (Appmixer-ai/appmixer-components#2994), so this test drives each copy through
// `sendArrayOutput({ outputType: 'file' })` and parses what it wrote.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '../src/appmixer');

const RECORDS = [
    { name: 'First, "quote"\r\nnext line', tags: ['Ada', 'Ben'], note: null, count: 3 },
    { count: 0, name: 'plain', tags: [], note: { a: 'b,c' } }
];

const EXPECTED_ROWS = [
    ['name', 'tags', 'note', 'count'],
    ['First, "quote"\r\nnext line', '["Ada","Ben"]', '', '3'],
    ['plain', '[]', '{"a":"b,c"}', '0']
];

// Minimal RFC 4180 reader: rows of cells, quoted cells may hold , " \r \n.
function parseCsv(text) {

    const rows = [[]];
    let cell = '';
    let quoted = false;
    for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        if (quoted) {
            if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++; } else if (ch === '"') { quoted = false; } else { cell += ch; }
        } else if (ch === '"') {
            quoted = true;
        } else if (ch === ',') {
            rows[rows.length - 1].push(cell); cell = '';
        } else if (ch === '\n') {
            rows[rows.length - 1].push(cell); cell = ''; rows.push([]);
        } else if (ch === '\r' && text[i + 1] === '\n') {
            // CRLF row terminator
        } else {
            cell += ch;
        }
    }
    rows[rows.length - 1].push(cell);
    if (rows[rows.length - 1].length === 1 && rows[rows.length - 1][0] === '') rows.pop();
    return rows;
}

function walk(dir, out) {

    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (entry.name === 'node_modules' || entry.name === 'artifacts' || entry.name.startsWith('.')) continue;
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(full, out);
        else if (entry.name.endsWith('.js') && !/\.(test|spec)\.js$/.test(entry.name)) {
            // lib.js, lib.generated.js, google-commons.js, hubspot/commons.js, …
            const source = fs.readFileSync(full, 'utf8');
            if (/\btoCsv\b/.test(source) && /sendArrayOutput/.test(source)) out.push(full);
        }
    }
    return out;
}

function fakeContext() {

    const saved = [];
    return {
        saved,
        componentId: 'c1',
        flowDescriptor: { c1: { label: 'Find' } },
        config: {},
        CancelError: Error,
        async saveFileStream(fileName, buffer) {
            saved.push({ fileName, text: buffer.toString('utf8') });
            return { fileId: 'file-1' };
        },
        async sendJson() {},
        async log() {}
    };
}

async function writeCsv(lib, records) {

    const context = fakeContext();
    await lib.sendArrayOutput({ context, outputType: 'file', records });
    assert.strictEqual(context.saved.length, 1, 'one file saved');
    return context.saved[0].text;
}

describe('lib.js toCsv (file outputType)', () => {

    const libs = walk(ROOT, []).sort();

    it('finds the per-connector copies', () => {
        assert(libs.length > 50, `expected dozens of lib.js copies, found ${libs.length}`);
    });

    for (const libPath of libs) {
        const name = path.relative(ROOT, libPath);

        describe(name, () => {

            let lib;
            before(function() {
                try {
                    lib = require(libPath);
                } catch (err) {
                    // A connector-level dependency (redis, jsforce, …) that is not
                    // installed in this checkout: nothing to test here, not a failure.
                    const missing = err.code === 'MODULE_NOT_FOUND' && /Cannot find module '([^']+)'/.exec(err.message);
                    if (missing && missing[1] !== libPath) return this.skip();
                    throw err;
                }
            });

            it('quotes cells with commas, quotes and line breaks and keeps header order', async () => {
                const text = await writeCsv(lib, RECORDS);
                const rows = parseCsv(text);
                assert.deepStrictEqual(rows, EXPECTED_ROWS, `unexpected CSV:\n${text}`);
            });

            it('writes an empty file for an empty result set', async () => {
                // posthog saves a lone newline on purpose (an empty buffer breaks the
                // engine's S3 multipart upload), so only the content has to be empty.
                // tally refuses an empty result set with a CancelError instead; what
                // matters here is that toCsv does not crash on records[0].
                let text;
                try {
                    text = await writeCsv(lib, []);
                } catch (err) {
                    assert.match(err.message, /no records/i);
                    return;
                }
                assert.strictEqual(text.trim(), '');
            });
        });
    }
});
