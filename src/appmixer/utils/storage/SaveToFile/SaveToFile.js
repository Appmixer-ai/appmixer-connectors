'use strict';
const flatten = require('@json2csv/transforms').flatten();
const { Transform: Json2csvTransform } = require('@json2csv/node');
const { Readable, PassThrough, Transform } = require('stream');
const JSONStream = require('JSONStream');

/**
 * A helper function for converting the JSON object to a csv.
 * Converts a string to a json object, if possible.
 * @param {string} jsonString
 */
const tryParseJSON = function(jsonString) {

    try {
        const o = JSON.parse(jsonString);
        if (o && typeof o === 'object') {
            return o;
        }
    } catch (e) {
    }

    return jsonString;
};

const convertToCSV = async function(storeListCursor, resStream, errorHandler) {

    const input = new Readable({ objectMode: true });
    // eslint-disable-next-line no-underscore-dangle
    input._read = () => {};

    const defaultIterationMax = 10;
    const keySamples = [];
    const keys = [];
    let i = 0;

    try {
        for (let element = await storeListCursor.next(); element != null; element = await storeListCursor.next()) {
            // sample the first defaultIterationMax records
            if (i < defaultIterationMax) {
                keySamples.push(element);
            }
            input.push(element);
            i += 1;
        }
    } catch (err) {
        errorHandler(err);
    }

    input.push(null);

    // detect json fields and flatten them
    // iterate over the keySamples
    try {
        keySamples.forEach((element) => {
            // keep getting that .value cannot be read of null despite the check above
            const flattenInput = tryParseJSON(element);
            const flattenOutput = Object.keys(flatten(flattenInput));
            // go over each key and add it to the keys array if it doesn't exist
            flattenOutput.forEach((key) => {
                if (!keys.includes(key)) {
                    keys.push(key);
                }
            });
            i++;
        });
        // config for the json2csv Parser
        const opts = {
            fields: keys,
            transforms: [flatten] // flatten is imported
        };
        const transformOpts = { highWaterMark: 16384, encoding: 'utf-8' };
        const json2csv = new Json2csvTransform(opts, {}, { ...transformOpts, objectMode: true });
        input.pipe(json2csv).pipe(resStream);
    } catch (err) {
        errorHandler(err);
    }
};

module.exports = {

    async receive(context) {

        const { fileName = 'new File', sortBy, fileType, flattenValue, storeId } = context.messages.in.content;
        const sorter = {};
        sorter[sortBy] = 1;

        let cursor;
        try {
            cursor = await context.store.getCursor(storeId, {}, { sort: { ...sorter } });
            const count = await cursor.count();

            let stream;

            if (flattenValue && fileType === 'csv') {
                // Save original next before overriding
                const originalNext = cursor.next.bind(cursor);

                cursor.next = async () => {
                    const record = await originalNext();
                    if (record) {
                        return {
                            key: record.key,
                            value: tryParseJSON(record.value)
                        };
                    }
                    return record;
                };

                let pt = new PassThrough();
                convertToCSV(cursor, pt, err => {
                    // send error to client
                    pt.push('\n' + err);
                    pt.push(null);
                });

                const file = await context.saveFileStream(fileName, pt);
                return context.sendJson({ fileId: file.fileId, nRecords: count }, 'out');
            }

            if (!flattenValue && fileType === 'csv') {
                // Create a simple CSV transform for key-value pairs
                const csvTransform = new Transform({
                    writableObjectMode: true,
                    readableObjectMode: false,
                    transform(chunk, encoding, callback) {
                        try {
                            const key = String(chunk?.key ?? '').replace(/"/g, '""');
                            let rawValue = typeof chunk?.value === 'string'
                                ? chunk.value
                                : JSON.stringify(chunk?.value ?? '');
                            // Mitigate formula/CSV injection in spreadsheets
                            if (/^[=+\-@]/.test(rawValue.trim())) rawValue = `'${rawValue}`;
                            const value = rawValue.replace(/"/g, '""');
                            callback(null, `"${key}","${value}"\n`);
                        } catch (err) {
                            callback(err);
                        }
                    }
                });

                // Add CSV header
                csvTransform.push('"key","value"\n');

                stream = cursor.stream().pipe(csvTransform);
            } else {
                stream = cursor.stream().pipe(JSONStream.stringify());
            }
            const file = await context.saveFileStream(fileName, stream);
            return context.sendJson({ fileId: file.fileId, nRecords: count }, 'out');
        } finally {
            cursor?.close();
        }
    }
};
