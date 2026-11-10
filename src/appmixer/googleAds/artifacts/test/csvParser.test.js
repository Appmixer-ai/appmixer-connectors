'use strict';

const assert = require('assert');
const { Readable } = require('stream');
const { countRows, readChunk } = require('../../csvParser');

const CSV = [
    'Email, Phone ,FirstName',
    'a@example.com,+420123,Alice',
    '',
    '"b,c@example.com",+420456',
    'c@example.com,+420789,Carl,extra',
    'd@example.com,+420000,Dan'
].join('\n') + '\n';

const stream = (text = CSV) => Readable.from([text]);

describe('googleAds csvParser (csv-parse 7)', () => {

    it('countRows counts data rows, skipping the header and empty lines', async () => {

        assert.strictEqual(await countRows(stream()), 4);
    });

    it('countRows honours a custom delimiter', async () => {

        assert.strictEqual(await countRows(stream('Email;Phone\na@example.com;1\nb@example.com;2\n'), ';'), 2);
    });

    it('readChunk maps rows to objects keyed by trimmed headers', async () => {

        const rows = await readChunk(stream(), { startRow: 0, rowCount: 10 });
        assert.deepStrictEqual(rows, [
            { Email: 'a@example.com', Phone: '+420123', FirstName: 'Alice' },
            { Email: 'b,c@example.com', Phone: '+420456', FirstName: '' },
            { Email: 'c@example.com', Phone: '+420789', FirstName: 'Carl' },
            { Email: 'd@example.com', Phone: '+420000', FirstName: 'Dan' }
        ]);
    });

    it('readChunk returns the requested window of rows', async () => {

        const rows = await readChunk(stream(), { startRow: 1, rowCount: 2 });
        assert.deepStrictEqual(rows.map(row => row.Email), ['b,c@example.com', 'c@example.com']);
    });
});
