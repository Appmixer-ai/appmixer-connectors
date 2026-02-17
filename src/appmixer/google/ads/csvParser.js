/**
 * CSV parsing utilities for Google Ads Customer Match uploads
 * Supports automatic header detection and column recognition
 */

const { parse } = require('csv-parse');

// SHA256 hash pattern (64 hex characters)
const SHA256_PATTERN = /^[a-fA-F0-9]{64}$/;

// Common header names for email/hash columns
const EMAIL_HEADER_NAMES = ['email', 'hash', 'hashed_email', 'hashedemail', 'sha256', 'user_id', 'userid', 'id'];

// Common header names for segment columns
const SEGMENT_HEADER_NAMES = ['segment', 'segments', 'group', 'category', 'type', 'audience', 'list'];

module.exports = {

    /**
     * Check if a value looks like a SHA256 hash
     */
    isHash(value) {
        return SHA256_PATTERN.test(value?.trim() || '');
    },

    /**
     * Check if a value matches any of the segment keys from the mapping
     */
    isSegmentValue(value, segmentKeys) {
        const trimmed = value?.trim()?.toLowerCase();
        return segmentKeys.some(key => key.toLowerCase() === trimmed);
    },

    /**
     * Check if a value looks like a header name (not data)
     */
    isHeaderName(value) {
        const trimmed = value?.trim()?.toLowerCase();
        if (!trimmed) return false;
        
        // If it's a hash, it's data not a header
        if (this.isHash(value)) return false;
        
        // Check against known header names
        const allKnownHeaders = [...EMAIL_HEADER_NAMES, ...SEGMENT_HEADER_NAMES];
        return allKnownHeaders.includes(trimmed);
    },

    /**
     * Detect column indices from the first data row
     * Returns { emailColumnIndex, segmentColumnIndex, hasHeaders }
     */
    detectColumns(firstRow, secondRow, segmentKeys, context) {
        let emailColumnIndex = -1;
        let segmentColumnIndex = -1;
        let hasHeaders = false;

        // Check if first row looks like headers
        const firstRowHasHeaders = firstRow.some(cell => this.isHeaderName(cell));
        
        if (firstRowHasHeaders) {
            hasHeaders = true;
            context.log('info', 'Detected header row in CSV');
            
            // Find columns by header names
            for (let i = 0; i < firstRow.length; i++) {
                const header = firstRow[i]?.trim()?.toLowerCase();
                
                if (EMAIL_HEADER_NAMES.includes(header) && emailColumnIndex === -1) {
                    emailColumnIndex = i;
                    context.log('info', `Found email column at index ${i} (header: "${firstRow[i]}")`);
                }
                
                if (SEGMENT_HEADER_NAMES.includes(header) && segmentColumnIndex === -1) {
                    segmentColumnIndex = i;
                    context.log('info', `Found segment column at index ${i} (header: "${firstRow[i]}")`);
                }
            }
            
            // If we found headers but not specific columns, try to detect from second row
            if (secondRow && (emailColumnIndex === -1 || segmentColumnIndex === -1)) {
                for (let i = 0; i < secondRow.length; i++) {
                    const value = secondRow[i]?.trim();
                    
                    if (emailColumnIndex === -1 && this.isHash(value)) {
                        emailColumnIndex = i;
                        context.log('info', `Detected email/hash column at index ${i} (by hash pattern)`);
                    }
                    
                    if (segmentColumnIndex === -1 && this.isSegmentValue(value, segmentKeys)) {
                        segmentColumnIndex = i;
                        context.log('info', `Detected segment column at index ${i} (by segment value match)`);
                    }
                }
            }
        } else {
            // No headers - detect columns from first row data
            context.log('info', 'No header row detected, analyzing data patterns');
            
            for (let i = 0; i < firstRow.length; i++) {
                const value = firstRow[i]?.trim();
                
                if (emailColumnIndex === -1 && this.isHash(value)) {
                    emailColumnIndex = i;
                    context.log('info', `Detected email/hash column at index ${i} (by hash pattern)`);
                }
                
                if (segmentColumnIndex === -1 && this.isSegmentValue(value, segmentKeys)) {
                    segmentColumnIndex = i;
                    context.log('info', `Detected segment column at index ${i} (by segment value match: "${value}")`);
                }
            }
        }

        // Fallback to defaults if detection failed
        if (emailColumnIndex === -1) {
            emailColumnIndex = 0;
            context.log('warn', 'Could not detect email column, using default index 0');
        }
        
        if (segmentColumnIndex === -1) {
            segmentColumnIndex = 1;
            context.log('warn', 'Could not detect segment column, using default index 1');
        }

        // Ensure columns are different
        if (emailColumnIndex === segmentColumnIndex) {
            context.log('warn', 'Email and segment columns detected as same index, adjusting');
            segmentColumnIndex = emailColumnIndex === 0 ? 1 : 0;
        }

        return { emailColumnIndex, segmentColumnIndex, hasHeaders };
    },

    /**
     * Parse CSV file and group emails by segment with automatic column detection
     */
    async parseCSV(fileStream, options, context) {
        const { columnSeparator = ',', segmentKeys = [] } = options;
        const segmentGroups = {};
        const MAX_SEGMENT_SIZE = 100000;

        return new Promise((resolve, reject) => {
            const rows = [];
            let emailColumnIndex = -1;
            let segmentColumnIndex = -1;
            let hasHeaders = false;
            let columnsDetected = false;
            let dataStartIndex = 0;

            const parser = parse({
                columns: false,
                delimiter: columnSeparator,
                skip_empty_lines: true,
                relax_quotes: true
            });

            let rowCount = 0;
            let skippedCount = 0;
            let lastLogTime = Date.now();

            parser.on('readable', function() {
                let row;
                while ((row = parser.read()) !== null) {
                    rows.push(row);
                    
                    // Detect columns after reading first two rows
                    if (!columnsDetected && rows.length >= 2) {
                        const detection = module.exports.detectColumns(rows[0], rows[1], segmentKeys, context);
                        emailColumnIndex = detection.emailColumnIndex;
                        segmentColumnIndex = detection.segmentColumnIndex;
                        hasHeaders = detection.hasHeaders;
                        dataStartIndex = hasHeaders ? 1 : 0;
                        columnsDetected = true;
                        
                        context.log('info', `Column detection complete: email=${emailColumnIndex}, segment=${segmentColumnIndex}, hasHeaders=${hasHeaders}`);
                    }
                }
            });

            parser.on('error', (error) => {
                context.log('error', `CSV parsing error: ${error.message}`);
                reject(error);
            });

            parser.on('end', () => {
                // Handle case where we have less than 2 rows
                if (!columnsDetected && rows.length > 0) {
                    const detection = module.exports.detectColumns(rows[0], null, segmentKeys, context);
                    emailColumnIndex = detection.emailColumnIndex;
                    segmentColumnIndex = detection.segmentColumnIndex;
                    hasHeaders = detection.hasHeaders;
                    dataStartIndex = hasHeaders ? 1 : 0;
                }

                // Process all data rows
                for (let i = dataStartIndex; i < rows.length; i++) {
                    const row = rows[i];
                    rowCount++;

                    const now = Date.now();
                    if ((now - lastLogTime) > 5000) {
                        context.log('info', `Processing progress: ${rowCount} rows...`);
                        lastLogTime = now;
                    }

                    const maxIndex = Math.max(segmentColumnIndex, emailColumnIndex);
                    if (row.length <= maxIndex) {
                        skippedCount++;
                        continue;
                    }

                    const segment = row[segmentColumnIndex]?.trim();
                    const hashedEmail = row[emailColumnIndex]?.trim();

                    if (!segment || !hashedEmail) {
                        skippedCount++;
                        continue;
                    }

                    if (!segmentGroups[segment]) {
                        segmentGroups[segment] = [];
                    }

                    if (segmentGroups[segment].length < MAX_SEGMENT_SIZE) {
                        segmentGroups[segment].push(hashedEmail);
                    } else if (segmentGroups[segment].length === MAX_SEGMENT_SIZE) {
                        context.log('warn', `Segment '${segment}' reached maximum size (${MAX_SEGMENT_SIZE}). Additional users will be skipped.`);
                        segmentGroups[segment].push(hashedEmail);
                    }
                }

                context.log('info', `CSV parsing complete: ${rowCount} data rows processed, ${skippedCount} skipped`);
                const totalUsers = Object.values(segmentGroups).reduce((sum, arr) => sum + arr.length, 0);
                context.log('info', `Total valid users: ${totalUsers} across ${Object.keys(segmentGroups).length} segments`);
                resolve(segmentGroups);
            });

            fileStream.pipe(parser);
        });
    },

    /**
     * Validate CSV parsing options (simplified - most detection is automatic now)
     */
    validateParsingOptions(options, context) {
        const { columnSeparator = ',' } = options;

        if (typeof columnSeparator !== 'string' || columnSeparator.length !== 1) {
            throw new context.CancelError('columnSeparator must be a single character string');
        }
    }
};
