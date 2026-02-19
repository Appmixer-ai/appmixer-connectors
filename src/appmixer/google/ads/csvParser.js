/**
 * CSV parsing utilities for Google Ads Customer Match uploads.
 * Chunk-based reading: reads N rows starting from a given row offset.
 * Automatic header/column detection via data pattern analysis.
 */

const { parse } = require('csv-parse');

// SHA256 hash pattern (64 hex characters)
const SHA256_PATTERN = /^[a-fA-F0-9]{64}$/;

// Common header names for email/hash columns
const EMAIL_HEADER_NAMES = ['email', 'hash', 'hashed_email', 'hashedemail', 'sha256', 'user_id', 'userid', 'id'];

// Common header names for segment columns
const SEGMENT_HEADER_NAMES = ['segment', 'segments', 'group', 'category', 'type', 'audience', 'list'];

module.exports = {

    isHash(value) {
        return SHA256_PATTERN.test(value?.trim() || '');
    },

    isSegmentValue(value, segmentKeys) {
        const trimmed = value?.trim()?.toLowerCase();
        return segmentKeys.some(key => key.toLowerCase() === trimmed);
    },

    isHeaderName(value) {
        const trimmed = value?.trim()?.toLowerCase();
        if (!trimmed) return false;
        if (this.isHash(value)) return false;
        const allKnownHeaders = [...EMAIL_HEADER_NAMES, ...SEGMENT_HEADER_NAMES];
        return allKnownHeaders.includes(trimmed);
    },

    /**
     * Detect column indices from the first data row(s).
     * Returns { emailColumnIndex, segmentColumnIndex, hasHeaders }
     */
    detectColumns(firstRow, secondRow, segmentKeys, context) {
        let emailColumnIndex = -1;
        let segmentColumnIndex = -1;
        let hasHeaders = false;

        const firstRowHasHeaders = firstRow.some(cell => this.isHeaderName(cell));

        if (firstRowHasHeaders) {
            hasHeaders = true;

            for (let i = 0; i < firstRow.length; i++) {
                const header = firstRow[i]?.trim()?.toLowerCase();
                if (EMAIL_HEADER_NAMES.includes(header) && emailColumnIndex === -1) {
                    emailColumnIndex = i;
                }
                if (SEGMENT_HEADER_NAMES.includes(header) && segmentColumnIndex === -1) {
                    segmentColumnIndex = i;
                }
            }

            if (secondRow && (emailColumnIndex === -1 || segmentColumnIndex === -1)) {
                for (let i = 0; i < secondRow.length; i++) {
                    const value = secondRow[i]?.trim();
                    if (emailColumnIndex === -1 && this.isHash(value)) {
                        emailColumnIndex = i;
                    }
                    if (segmentColumnIndex === -1 && this.isSegmentValue(value, segmentKeys)) {
                        segmentColumnIndex = i;
                    }
                }
            }
        } else {
            for (let i = 0; i < firstRow.length; i++) {
                const value = firstRow[i]?.trim();
                if (emailColumnIndex === -1 && this.isHash(value)) {
                    emailColumnIndex = i;
                }
                if (segmentColumnIndex === -1 && this.isSegmentValue(value, segmentKeys)) {
                    segmentColumnIndex = i;
                }
            }
        }

        if (emailColumnIndex === -1) {
            emailColumnIndex = 0;
        }
        if (segmentColumnIndex === -1) {
            segmentColumnIndex = 1;
        }
        if (emailColumnIndex === segmentColumnIndex) {
            segmentColumnIndex = emailColumnIndex === 0 ? 1 : 0;
        }

        return { emailColumnIndex, segmentColumnIndex, hasHeaders };
    },

    /**
     * Count total data rows in a CSV file (fast, streaming, no data stored).
     * Detects and skips header row using the same logic as readChunk.
     * @param {ReadableStream} fileStream - fresh file stream (destroyed after use)
     * @param {object} options - { columnSeparator, segmentKeys }
     * @param {object} context - Appmixer context
     * @returns {Promise<number>} total data row count
     */
    countRows(fileStream, options, context) {
        const { columnSeparator = ',', segmentKeys = [] } = options;
        const self = this;

        return new Promise((resolve, reject) => {
            const parser = parse({
                columns: false,
                delimiter: columnSeparator,
                skip_empty_lines: true,
                relax_quotes: true
            });

            let count = 0;
            let headerDetected = false;
            const firstRows = [];

            parser.on('readable', function() {
                let row;
                while ((row = parser.read()) !== null) {
                    if (!headerDetected) {
                        firstRows.push(row);
                        if (firstRows.length >= 2) {
                            const detection = self.detectColumns(firstRows[0], firstRows[1], segmentKeys, context);
                            headerDetected = true;
                            // If first row was a header, count starts at 1 (second row); otherwise both are data
                            count = detection.hasHeaders ? 1 : 2;
                        }
                        continue;
                    }
                    count++;
                }
            });

            parser.on('end', () => {
                // Handle files with 0 or 1 rows
                if (!headerDetected && firstRows.length > 0) {
                    count = firstRows.length;
                }
                resolve(count);
            });

            parser.on('error', (err) => {
                fileStream.destroy();
                reject(err);
            });

            fileStream.pipe(parser);
        });
    },

    /**
     * Read a chunk of CSV rows. Opens parser, skips startRow data rows,
     * collects up to rowCount parsed rows, then destroys the stream.
     * Caller reopens the file for each chunk call.
     *
     * @param {ReadableStream} fileStream - fresh file stream (destroyed after use)
     * @param {object} options - { startRow, rowCount, columnSeparator, segmentKeys }
     * @param {object} context - Appmixer context for logging
     * @returns {Promise<{ rows: Array<{segment: string, email: string}>, rowsRead: number }>}
     */
    readChunk(fileStream, options, context) {
        const { startRow = 0, rowCount = 1000, columnSeparator = ',', segmentKeys = [] } = options;
        const self = this;

        return new Promise((resolve, reject) => {
            const parser = parse({
                columns: false,
                delimiter: columnSeparator,
                skip_empty_lines: true,
                relax_quotes: true
            });

            let emailColumnIndex = -1;
            let segmentColumnIndex = -1;
            let columnsDetected = false;
            let dataRowIndex = 0;
            const firstRows = [];
            const rows = [];
            let finished = false;

            const done = () => {
                if (finished) return;
                finished = true;
                parser.removeAllListeners();
                fileStream.unpipe(parser);
                parser.destroy();
                fileStream.destroy();
                resolve({ rows, rowsRead: rows.length });
            };

            parser.on('readable', function() {
                if (finished) return;
                let row;
                while ((row = parser.read()) !== null) {
                    if (finished) return;

                    // Column detection from first 2 raw rows
                    if (!columnsDetected) {
                        firstRows.push(row);
                        if (firstRows.length >= 2) {
                            const detection = self.detectColumns(firstRows[0], firstRows[1], segmentKeys, context);
                            emailColumnIndex = detection.emailColumnIndex;
                            segmentColumnIndex = detection.segmentColumnIndex;
                            columnsDetected = true;

                            // Process buffered data rows (skip header if detected)
                            const startIdx = detection.hasHeaders ? 1 : 0;
                            for (let i = startIdx; i < firstRows.length; i++) {
                                if (dataRowIndex >= startRow) {
                                    const parsed = parseRow(firstRows[i], emailColumnIndex, segmentColumnIndex);
                                    if (parsed) rows.push(parsed);
                                    if (rows.length >= rowCount) { done(); return; }
                                }
                                dataRowIndex++;
                            }
                        }
                        continue;
                    }

                    // Skip rows until startRow
                    if (dataRowIndex < startRow) {
                        dataRowIndex++;
                        continue;
                    }

                    // Collect rows
                    const parsed = parseRow(row, emailColumnIndex, segmentColumnIndex);
                    if (parsed) rows.push(parsed);
                    dataRowIndex++;

                    if (rows.length >= rowCount) { done(); return; }
                }
            });

            parser.on('end', () => {
                if (finished) return;
                // Handle single-row CSV
                if (!columnsDetected && firstRows.length > 0) {
                    const detection = self.detectColumns(firstRows[0], null, segmentKeys, context);
                    emailColumnIndex = detection.emailColumnIndex;
                    segmentColumnIndex = detection.segmentColumnIndex;
                    columnsDetected = true;
                    const startIdx = detection.hasHeaders ? 1 : 0;
                    for (let i = startIdx; i < firstRows.length; i++) {
                        if (dataRowIndex >= startRow) {
                            const parsed = parseRow(firstRows[i], emailColumnIndex, segmentColumnIndex);
                            if (parsed) rows.push(parsed);
                        }
                        dataRowIndex++;
                    }
                }
                done();
            });

            parser.on('error', (err) => {
                if (finished) return;
                finished = true;
                parser.removeAllListeners();
                parser.destroy();
                fileStream.destroy();
                reject(err);
            });

            fileStream.on('error', (err) => {
                if (finished) return;
                finished = true;
                parser.removeAllListeners();
                parser.destroy();
                fileStream.destroy();
                reject(err);
            });

            fileStream.pipe(parser);
        });
    },

    validateParsingOptions(options, context) {
        const { columnSeparator = ',' } = options;
        if (typeof columnSeparator !== 'string' || columnSeparator.length !== 1) {
            throw new context.CancelError('columnSeparator must be a single character string');
        }
    }
};

function parseRow(row, emailColumnIndex, segmentColumnIndex) {
    const maxIndex = Math.max(segmentColumnIndex, emailColumnIndex);
    if (row.length <= maxIndex) return null;

    const segment = row[segmentColumnIndex]?.trim();
    const email = row[emailColumnIndex]?.trim();
    if (!segment || !email) return null;

    return { segment, email };
}
