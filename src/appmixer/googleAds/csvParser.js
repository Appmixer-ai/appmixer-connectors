'use strict';

const { parse } = require('csv-parse');

/**
 * Count the total number of data rows in the CSV (excluding header).
 * @param {ReadableStream} fileStream
 * @param {string} [delimiter=',']
 * @returns {Promise<number>}
 */
async function countRows(fileStream, delimiter = ',') {
    return new Promise((resolve, reject) => {
        let count = 0;

        const parser = parse({
            delimiter,
            relax_column_count: true,
            skip_empty_lines: true,
            from_line: 2 // skip header
        });

        parser.on('readable', () => {
            while (parser.read() !== null) {
                count++;
            }
        });
        parser.on('error', reject);
        parser.on('end', () => resolve(count));

        fileStream.pipe(parser);
    });
}

/**
 * Read a chunk of rows from CSV starting at startRow (0-based, after header).
 *
 * @param {ReadableStream} fileStream
 * @param {object} options
 * @param {number} options.startRow  - 0-based row index (after header) to start reading from
 * @param {number} options.rowCount  - maximum number of rows to return
 * @param {string} [options.delimiter=',']
 * @param {string[]} [options.segmentKeys=[]] - column names that identify segments (used for grouping)
 * @returns {Promise<Array<object>>} parsed rows as objects keyed by header names
 */
async function readChunk(fileStream, { startRow = 0, rowCount, delimiter = ',', segmentKeys = [] }) {
    return new Promise((resolve, reject) => {
        const rows = [];
        let headerRow = null;
        let currentRow = 0; // tracks data rows (after header)

        const parser = parse({
            delimiter,
            relax_column_count: true,
            skip_empty_lines: true
        });

        parser.on('readable', () => {
            let record;
            while ((record = parser.read()) !== null) {
                if (headerRow === null) {
                    // first record is the header
                    headerRow = record.map(h => String(h).trim());
                    continue;
                }

                // Skip rows before startRow
                if (currentRow < startRow) {
                    currentRow++;
                    continue;
                }

                // Stop if we have collected enough rows
                if (rowCount !== undefined && rows.length >= rowCount) {
                    parser.destroy();
                    break;
                }

                // Map record array to object using header
                const rowObj = {};
                headerRow.forEach((header, idx) => {
                    rowObj[header] = record[idx] !== undefined ? String(record[idx]).trim() : '';
                });

                rows.push(rowObj);
                currentRow++;
            }
        });

        parser.on('error', (err) => {
            // Ignore premature close from parser.destroy()
            if (err.code === 'ERR_STREAM_DESTROYED' || err.message === 'Premature close') {
                resolve(rows);
            } else {
                reject(err);
            }
        });
        parser.on('end', () => resolve(rows));
        parser.on('close', () => resolve(rows));

        fileStream.pipe(parser);
    });
}

module.exports = { countRows, readChunk };
