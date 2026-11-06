'use strict';

const assert = require('assert');
const path = require('path');
const { Readable } = require('stream');

const CONVERTERS_DIR = path.join(__dirname, '../../src/appmixer/utils/converters');
const helpers = require(path.join(CONVERTERS_DIR, 'xlsx-helpers.js'));

const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

// An in-memory file store standing in for the engine's file API.
function createContext(config = {}) {

    const files = new Map();
    let nextId = 1;
    const context = {
        config,
        CancelError: class CancelError extends Error {},
        async getFileReadStream(fileId) {
            return Readable.from([files.get(fileId).content]);
        },
        async getFileInfo(fileId) {
            const file = files.get(fileId);
            return { filename: file.filename, length: file.content.length };
        },
        async saveFile(filename, contentType, content) {
            const fileId = `file-${nextId++}`;
            const buffer = Buffer.isBuffer(content) ? content : Buffer.from(content);
            files.set(fileId, { filename, contentType, content: buffer });
            return { fileId, filename, contentType };
        },
        put(filename, content) {
            const fileId = `file-${nextId++}`;
            files.set(fileId, { filename, content: Buffer.from(content) });
            return fileId;
        },
        text(fileId) {
            return files.get(fileId).content.toString('utf8');
        },
        json(fileId) {
            return JSON.parse(context.text(fileId));
        }
    };
    return context;
}

const CSV = 'name,city,age,active,joined\nAlice,Prague,30,true,2024-03-15\nBob,"Brno, CZ",25,false,2023-11-02\n';
const HTML = '<html><body><p>intro</p><table>'
    + '<tr><th>name</th><th>city</th><th>age</th><th>active</th></tr>'
    + '<tr><td>Alice</td><td>Prague &amp; co</td><td>30</td><td>true</td></tr>'
    + '<tr><td>Bob</td><td>Brno</td><td>25</td><td>false</td></tr>'
    + '</table></body></html>';

describe('utils.converters xlsx-helpers', function() {

    let context;

    beforeEach(function() {
        context = createContext();
    });

    it('CSV -> XLSX -> CSV / JSON / HTML keeps rows, types and file names', async function() {

        const csvId = context.put('report.csv', CSV);
        const xlsx = await helpers.convertFile(context, csvId, helpers.CSV2Workbook, 'xlsx', XLSX_MIME);
        assert.strictEqual(xlsx.fileName, 'report.xlsx');

        const csv = await helpers.convertFile(context, xlsx.fileId, helpers.XLSX2Workbook, 'csv', 'text/csv');
        assert.strictEqual(csv.fileName, 'report.csv');
        // Date-looking CSV text stays text, as it did before (the CSV parser only casts numbers and booleans).
        assert.strictEqual(context.text(csv.fileId),
            '﻿name,city,age,active,joined\nAlice,Prague,30,true,2024-03-15\nBob,"Brno, CZ",25,false,2023-11-02\n');

        const json = await helpers.convertFile2JSON(context, xlsx.fileId, helpers.XLSX2Workbook);
        assert.strictEqual(json.fileName, 'report.json');
        assert.deepStrictEqual(context.json(json.fileId), [
            { name: 'Alice', city: 'Prague', age: 30, active: true, joined: '2024-03-15' },
            { name: 'Bob', city: 'Brno, CZ', age: 25, active: false, joined: '2023-11-02' }
        ]);

        const html = await helpers.convertFile(context, xlsx.fileId, helpers.XLSX2Workbook, 'html', 'text/html');
        assert.strictEqual(html.fileName, 'report.html');
        assert.strictEqual(context.text(html.fileId),
            '<html><head><meta charset="utf-8"/><title>Table Export</title></head><body><table>'
            + '<tr><td>name</td><td>city</td><td>age</td><td>active</td><td>joined</td></tr>'
            + '<tr><td>Alice</td><td>Prague</td><td>30</td><td>true</td><td>2024-03-15</td></tr>'
            + '<tr><td>Bob</td><td>Brno, CZ</td><td>25</td><td>false</td><td>2023-11-02</td></tr>'
            + '</table></body></html>');
    });

    it('writes date cells of a workbook as ISO 8601 strings and keeps blank cells out of the JSON', async function() {

        // A workbook with a real date cell, as Excel would save it.
        const writeExcelFile = require(path.join(CONVERTERS_DIR, 'node_modules/write-excel-file/node'));
        const buffer = await writeExcelFile([
            [{ value: 'when', type: String }, { value: 'n', type: String }, { value: 'note', type: String }],
            [{ value: new Date(Date.UTC(2024, 2, 15, 10, 30)), type: Date, format: 'yyyy-mm-dd hh:mm' }, { value: 1.5, type: Number }, null]
        ]).toBuffer();
        const xlsxId = context.put('dates.xlsx', buffer);

        const json = await helpers.convertFile2JSON(context, xlsxId, helpers.XLSX2Workbook);
        assert.deepStrictEqual(context.json(json.fileId), [{ when: '2024-03-15T10:30:00.000Z', n: 1.5 }]);

        const csv = await helpers.convertFile(context, xlsxId, helpers.XLSX2Workbook, 'csv', 'text/csv');
        assert.strictEqual(context.text(csv.fileId), '﻿when,n,note\n2024-03-15T10:30:00.000Z,1.5,\n');
    });

    it('JSON -> XLSX -> JSON keeps numbers, booleans and blank cells, nested values become JSON text', async function() {

        const rows = [
            { name: 'Alice', age: 30, active: true, tags: ['a', 'b'] },
            { name: 'Bob', age: 25.5, active: false, note: 'x' }
        ];
        const jsonId = context.put('people.json', JSON.stringify(rows));
        const xlsx = await helpers.convertFile(context, jsonId, helpers.JSON2Workbook, 'xlsx', XLSX_MIME);
        const back = await helpers.convertFile2JSON(context, xlsx.fileId, helpers.XLSX2Workbook);
        assert.deepStrictEqual(context.json(back.fileId), [
            { name: 'Alice', age: 30, active: true, tags: '["a","b"]' },
            { name: 'Bob', age: 25.5, active: false, note: 'x' }
        ]);
    });

    it('HTML table -> CSV / JSON / XLSX -> HTML casts numeric and boolean text and escapes HTML', async function() {

        const htmlId = context.put('table.html', HTML);
        const csv = await helpers.convertFile(context, htmlId, helpers.HTML2Workbook, 'csv', 'text/csv');
        assert.strictEqual(context.text(csv.fileId), '﻿name,city,age,active\nAlice,Prague & co,30,true\nBob,Brno,25,false\n');

        const json = await helpers.convertFile2JSON(context, htmlId, helpers.HTML2Workbook);
        assert.deepStrictEqual(context.json(json.fileId), [
            { name: 'Alice', city: 'Prague & co', age: 30, active: true },
            { name: 'Bob', city: 'Brno', age: 25, active: false }
        ]);

        const xlsx = await helpers.convertFile(context, htmlId, helpers.HTML2Workbook, 'xlsx', XLSX_MIME);
        const html = await helpers.convertFile(context, xlsx.fileId, helpers.XLSX2Workbook, 'html', 'text/html');
        assert.ok(context.text(html.fileId).includes('<td>Prague &amp; co</td><td>30</td><td>true</td>'));
    });

    it('names blank and repeated header titles like SheetJS and keeps cells beyond the header', async function() {

        const html = '<table><tr><th>name</th><th>name</th><th></th><th>name</th></tr>'
            + '<tr><td>a</td><td>b</td><td>c</td><td>d</td><td>extra1</td><td>extra2</td></tr></table>';
        const json = await helpers.convertFile2JSON(context, context.put('t.html', html), helpers.HTML2Workbook);
        assert.deepStrictEqual(context.json(json.fileId), [
            { name: 'a', name_1: 'b', __EMPTY: 'c', name_2: 'd', __EMPTY_1: 'extra1', __EMPTY_2: 'extra2' }
        ]);
    });

    it('handles an empty CSV file', async function() {

        const emptyId = context.put('empty.csv', '');
        const json = await helpers.convertFile2JSON(context, emptyId, helpers.CSV2Workbook);
        assert.strictEqual(context.text(json.fileId), '[]');
        const xlsx = await helpers.convertFile(context, emptyId, helpers.CSV2Workbook, 'xlsx', XLSX_MIME);
        const back = await helpers.convertFile2JSON(context, xlsx.fileId, helpers.XLSX2Workbook);
        assert.strictEqual(context.text(back.fileId), '[]');
    });

    it('fails with CancelError on an invalid workbook, a non-array JSON file and an HTML file without a table', async function() {

        const cases = [
            [context.put('bad.xlsx', 'not a zip at all, just text'), helpers.XLSX2Workbook, /expected a ZIP-based workbook/],
            [context.put('bad.json', '{"a":1}'), helpers.JSON2Workbook, /expected an array of objects/],
            [context.put('bad.json', 'not json'), helpers.JSON2Workbook, /Invalid JSON file/],
            [context.put('bad.html', '<p>no table</p>'), helpers.HTML2Workbook, /no <table> element/]
        ];
        for (const [fileId, reader, message] of cases) {
            await assert.rejects(helpers.convertFile(context, fileId, reader, 'csv', 'text/csv'), err => {
                assert.ok(err instanceof context.CancelError, `${err.constructor.name}: ${err.message}`);
                assert.match(err.message, message);
                return true;
            });
        }
    });

    it('rejects a ZIP that is not a workbook but accepts the ZIP64 end-of-central-directory marker', async function() {

        // A real ZIP (one stored file) that is no spreadsheet: passes the archive check, fails in the reader.
        const name = Buffer.from('a.txt');
        const data = Buffer.from('hello');
        const local = Buffer.concat([Buffer.from([0x50, 0x4b, 0x03, 0x04]), Buffer.alloc(26), name, data]);
        local.writeUInt16LE(name.length, 26);
        local.writeUInt32LE(data.length, 18);
        local.writeUInt32LE(data.length, 22);
        const central = Buffer.concat([Buffer.from([0x50, 0x4b, 0x01, 0x02]), Buffer.alloc(42), name]);
        central.writeUInt16LE(name.length, 28);
        central.writeUInt32LE(data.length, 20);
        central.writeUInt32LE(data.length, 24);
        const end = Buffer.alloc(22);
        end.writeUInt32LE(0x06054b50, 0);
        end.writeUInt16LE(1, 8);
        end.writeUInt16LE(1, 10);
        end.writeUInt32LE(central.length, 12);
        end.writeUInt32LE(local.length, 16);
        const zip = Buffer.concat([local, central, end]);
        await assert.rejects(helpers.convertFile(context, context.put('x.xlsx', zip), helpers.XLSX2Workbook, 'csv', 'text/csv'),
            err => err instanceof context.CancelError && /Invalid spreadsheet file/.test(err.message));

        // ZIP64 marker: the archive check must not reject it as truncated; the reader reports the real problem.
        const zip64End = Buffer.from(end);
        zip64End.writeUInt32LE(0xFFFFFFFF, 12);
        zip64End.writeUInt32LE(0xFFFFFFFF, 16);
        const zip64 = Buffer.concat([local, central, zip64End]);
        await assert.rejects(helpers.convertFile(context, context.put('x.xlsx', zip64), helpers.XLSX2Workbook, 'csv', 'text/csv'),
            err => err instanceof context.CancelError && !/truncated|missing ZIP footer/.test(err.message));
    });

    it('enforces the input size limit from the module config', async function() {

        const limited = createContext({ CONVERTERS_MAX_FILE_SIZE: 16 });
        const fileId = limited.put('big.csv', CSV);
        await assert.rejects(helpers.convertFile(limited, fileId, helpers.CSV2Workbook, 'xlsx', XLSX_MIME),
            err => err instanceof limited.CancelError && /too large/.test(err.message));
    });
});
