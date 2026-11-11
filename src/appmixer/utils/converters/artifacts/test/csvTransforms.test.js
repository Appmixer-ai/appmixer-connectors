'use strict';

const assert = require('assert');
const { Readable } = require('stream');
const { pipeline } = require('stream/promises');
const { getCSVReadStream, csvToJsonTransform } = require('../../csvTransforms');

// Parse a CSV string with the converters' csv-parse stream and collect the records.
async function parseRecords(csv) {

    const records = [];
    const parser = getCSVReadStream();
    parser.on('data', record => records.push(record));
    await pipeline(Readable.from([csv]), parser);
    return records;
}

// Run the full CSV -> JSON conversion (parser + JSON transform) and return the JSON text.
async function csvToJsonText(csv) {

    let out = '';
    const toJson = csvToJsonTransform();
    toJson.on('data', chunk => out += chunk.toString());
    await pipeline(Readable.from([csv]), getCSVReadStream(), toJson);
    return out;
}

describe('utils.converters csvTransforms (csv-parse 7)', () => {

    it('uses the header row for keys and casts numbers and booleans', async () => {

        const records = await parseRecords('Name,Age,Active\nAlice,30,true\nBob,1.5e+3,FALSE\n');
        assert.deepStrictEqual(records, [
            { Name: 'Alice', Age: 30, Active: true },
            { Name: 'Bob', Age: 1500, Active: false }
        ]);
    });

    it('strips the BOM and trims header and cell whitespace', async () => {

        const records = await parseRecords('\uFEFFName , Email\n  Alice ,a@example.com\n');
        assert.deepStrictEqual(records, [{ Name: 'Alice', Email: 'a@example.com' }]);
    });

    it('trims non-breaking spaces (csv-parse 7 trims ECMAScript whitespace)', async () => {

        const records = await parseRecords('a,b\n\u00A0x\u00A0,\ty\t\n');
        assert.deepStrictEqual(records, [{ a: 'x', b: 'y' }]);
    });

    it('keeps quoted delimiters inside a cell', async () => {

        const records = await parseRecords('Name,Email\n"Doe, John","j@example.com"\n');
        assert.deepStrictEqual(records, [{ Name: 'Doe, John', Email: 'j@example.com' }]);
    });

    it('accepts rows with fewer or more cells than the header (relax_column_count)', async () => {

        const records = await parseRecords('A,B,C\n1,2\n3,4,5,6\n');
        assert.deepStrictEqual(records, [{ A: 1, B: 2 }, { A: 3, B: 4, C: 5 }]);
    });

    it('accepts numeric header names (columns function converts them to strings)', async () => {

        const records = await parseRecords('1,2,x\n3,4,y\n');
        assert.deepStrictEqual(records, [{ 1: 3, 2: 4, x: 'y' }]);
    });

    it('does not let a __proto__ header replace the record prototype', async () => {

        const records = await parseRecords('__proto__,name\npolluted,Alice\n');
        assert.strictEqual(records.length, 1);
        assert.strictEqual(Object.getPrototypeOf(records[0]), Object.prototype);
        assert.strictEqual(records[0].name, 'Alice');
        assert.strictEqual({}.polluted, undefined);
    });

    it('converts a CSV file to a JSON array', async () => {

        const json = await csvToJsonText('Name,Age\nAlice,30\nBob,40\n');
        assert.deepStrictEqual(JSON.parse(json), [{ Name: 'Alice', Age: 30 }, { Name: 'Bob', Age: 40 }]);
    });

    it('converts a header-only CSV file to an empty JSON array', async () => {

        const json = await csvToJsonText('Name,Age\n');
        assert.deepStrictEqual(JSON.parse(json), []);
    });
});
