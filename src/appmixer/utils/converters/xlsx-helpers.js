'use strict';
const path = require('path');
const { pipeline } = require('node:stream/promises');
const { Writable } = require('node:stream');
const { readSheet, InvalidSpreadsheetError } = require('read-excel-file/node');
const writeExcelFile = require('write-excel-file/node');
const { parse: parseHtml } = require('node-html-parser');
const { stringify: stringifyCsv } = require('csv-stringify/sync');
const { getCSVReadStream, castValue } = require('./csvTransforms');

const ZIP_LOCAL_FILE_HEADER_SIGNATURE = 0x04034b50;
const ZIP_END_OF_CENTRAL_DIRECTORY_SIGNATURE = 0x06054b50;
const ZIP_END_OF_CENTRAL_DIRECTORY_MIN_LENGTH = 22;
const ZIP_MAX_COMMENT_LENGTH = 0xFFFF;

// Every converter turns its input into this table shape; every output format is rendered from it.
// `header` holds the column titles, `rows` the data rows with the same length as `header`.
// Cell values are strings, numbers, booleans, Date objects or null (empty cell).

function createSpreadsheetValidationError(context, message) {

    if (context?.CancelError) {
        return new context.CancelError(message);
    }

    return new Error(message);
}

function assertValidZipArchive(buffer, context) {

    if (buffer.length < ZIP_END_OF_CENTRAL_DIRECTORY_MIN_LENGTH
        || buffer.readUInt32LE(0) !== ZIP_LOCAL_FILE_HEADER_SIGNATURE) {
        throw createSpreadsheetValidationError(context, 'Invalid spreadsheet file: expected a ZIP-based workbook.');
    }

    const minimumOffset = Math.max(0, buffer.length - ZIP_END_OF_CENTRAL_DIRECTORY_MIN_LENGTH - ZIP_MAX_COMMENT_LENGTH);
    let endOfCentralDirectoryOffset = -1;

    for (let offset = buffer.length - ZIP_END_OF_CENTRAL_DIRECTORY_MIN_LENGTH; offset >= minimumOffset; offset--) {
        if (buffer.readUInt32LE(offset) === ZIP_END_OF_CENTRAL_DIRECTORY_SIGNATURE) {
            endOfCentralDirectoryOffset = offset;
            break;
        }
    }

    if (endOfCentralDirectoryOffset === -1) {
        throw createSpreadsheetValidationError(context, 'Invalid spreadsheet file: missing ZIP footer.');
    }

    const centralDirectorySize = buffer.readUInt32LE(endOfCentralDirectoryOffset + 12);
    const centralDirectoryOffset = buffer.readUInt32LE(endOfCentralDirectoryOffset + 16);
    if (centralDirectorySize === 0xFFFFFFFF || centralDirectoryOffset === 0xFFFFFFFF) {
        // ZIP64 archive: the real values live in the ZIP64 end-of-central-directory record.
        // The spreadsheet reader validates those itself.
        return;
    }
    const centralDirectoryEnd = centralDirectoryOffset + centralDirectorySize;

    if (centralDirectoryEnd > endOfCentralDirectoryOffset) {
        throw createSpreadsheetValidationError(context, 'Invalid spreadsheet file: truncated ZIP archive.');
    }
}

// The readers need the whole file in memory (a workbook is a ZIP archive), so cap the input size.
// Override with the CONVERTERS_MAX_FILE_SIZE config value (bytes).
const DEFAULT_MAX_FILE_SIZE = 50 * 1024 * 1024;

function assertFileSize(context, fileInfo) {

    const limit = Number(context.config?.CONVERTERS_MAX_FILE_SIZE) || DEFAULT_MAX_FILE_SIZE;
    if (fileInfo.length > limit) {
        throw createSpreadsheetValidationError(context,
            `File is too large (${fileInfo.length} bytes). Max file size is ${Math.round(limit / 1024 / 1024)} MB.`);
    }
}

function readStreamToBuffer(readStream) {

    return new Promise((resolve, reject) => {
        const buffers = [];
        readStream
            .on('data', chunk => buffers.push(chunk))
            .on('error', reject)
            .on('end', () => resolve(Buffer.concat(buffers)));
    });
}

function isEmptyCell(value) {

    return value === null || value === undefined || value === '';
}

/**
 * Column titles for a sheet whose first row is the header, named the way SheetJS did it:
 * a blank title becomes `__EMPTY`, `__EMPTY_1`, ... and a repeated title gets a numeric suffix
 * (`name`, `name_1`, `name_2`), so no column is lost and every key stays distinct.
 */
function normalizeHeader(cells) {

    const used = new Set();
    let emptyIndex = 0;
    return cells.map(cell => {
        let title = isEmptyCell(cell) ? '' : String(cell).trim();
        if (!title) {
            title = emptyIndex === 0 ? '__EMPTY' : `__EMPTY_${emptyIndex}`;
            emptyIndex++;
        }
        if (used.has(title)) {
            let suffix = 1;
            while (used.has(`${title}_${suffix}`)) {
                suffix++;
            }
            title = `${title}_${suffix}`;
        }
        used.add(title);
        return title;
    });
}

function objectsToTable(objects) {

    const header = [];
    const known = new Set();
    objects.forEach(object => {
        Object.keys(object || {}).forEach(key => {
            if (!known.has(key)) {
                known.add(key);
                header.push(key);
            }
        });
    });
    const rows = objects.map(object => header.map(key => {
        const value = object?.[key];
        if (value !== null && typeof value === 'object' && !(value instanceof Date)) {
            return JSON.stringify(value);
        }
        return value === undefined ? null : value;
    }));
    return { header, rows };
}

function tableToObjects({ header, rows }) {

    return rows.map(row => {
        const object = {};
        header.forEach((key, index) => {
            const value = row[index];
            if (!isEmptyCell(value)) {
                object[key] = value;
            }
        });
        return object;
    });
}

function isBlankRow(row) {

    return row.every(isEmptyCell);
}

/**
 * Turn the first row of a sheet into the header and drop trailing blank rows. A row that is
 * wider than the header extends the header with `__EMPTY…` columns, so no cell is dropped.
 */
function sheetRowsToTable(sheetRows) {

    const rows = sheetRows.slice();
    while (rows.length && isBlankRow(rows[rows.length - 1])) {
        rows.pop();
    }
    if (!rows.length) {
        return { header: [], rows: [] };
    }
    const width = Math.max(...rows.map(row => row.length));
    const headerCells = rows[0].slice();
    while (headerCells.length < width) {
        headerCells.push(null);
    }
    const header = normalizeHeader(headerCells);
    const data = rows.slice(1).map(row => header.map((title, index) => {
        const value = row[index];
        return isEmptyCell(value) ? null : value;
    }));
    return { header, rows: data };
}

function textCellValue(value) {

    if (isEmptyCell(value)) return '';
    if (value instanceof Date) return value.toISOString();
    return String(value);
}

function escapeHtml(text) {

    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

// ---------------------------------------------------------------------------------------------------------------
// Readers: (readStream, context) -> table

module.exports.JSON2Workbook = async function(readStream, context) {

    const buffer = await readStreamToBuffer(readStream);
    let json;
    try {
        json = JSON.parse(buffer.toString());
    } catch (err) {
        throw createSpreadsheetValidationError(context, `Invalid JSON file: ${err.message}`);
    }
    if (!Array.isArray(json)) {
        throw createSpreadsheetValidationError(context, 'Invalid JSON file: expected an array of objects, one object per row.');
    }
    return objectsToTable(json);
};

module.exports.CSV2Workbook = async function(readStream) {

    const records = [];
    await pipeline(
        readStream,
        getCSVReadStream(),
        new Writable({
            objectMode: true,
            write(record, encoding, callback) {
                records.push(record);
                callback();
            }
        })
    );
    return objectsToTable(records);
};

module.exports.HTML2Workbook = async function(readStream, context) {

    const buffer = await readStreamToBuffer(readStream);
    const root = parseHtml(buffer.toString());
    const table = root.querySelector('table');
    if (!table) {
        throw createSpreadsheetValidationError(context, 'Invalid HTML file: no <table> element found.');
    }
    const sheetRows = table.querySelectorAll('tr').map(tr => {
        return tr.querySelectorAll('th, td').map(cell => castValue(cell.text.trim()));
    });
    return sheetRowsToTable(sheetRows);
};

module.exports.XLSX2Workbook = async function(readStream, context) {

    const buffer = await readStreamToBuffer(readStream);
    assertValidZipArchive(buffer, context);
    let sheetRows;
    try {
        // The first sheet, as a 2D array of typed cells (string, number, boolean, Date, null).
        sheetRows = await readSheet(buffer);
    } catch (err) {
        if (err instanceof InvalidSpreadsheetError || err?.name === 'InvalidSpreadsheetError') {
            throw createSpreadsheetValidationError(context, `Invalid spreadsheet file: ${err.message}`);
        }
        throw err;
    }
    return sheetRowsToTable(sheetRows);
};

// ---------------------------------------------------------------------------------------------------------------
// Writers: table -> Buffer

function xlsxCell(value) {

    if (isEmptyCell(value)) return null;
    if (typeof value === 'number') return { value, type: Number };
    if (typeof value === 'boolean') return { value, type: Boolean };
    if (value instanceof Date) return { value, type: Date, format: 'yyyy-mm-dd hh:mm:ss' };
    return { value: String(value), type: String };
}

async function writeXlsx({ header, rows }) {

    const sheetData = [
        header.map(title => ({ value: title, type: String })),
        ...rows.map(row => row.map(xlsxCell))
    ];
    return writeExcelFile(sheetData).toBuffer();
}

function writeCsv({ header, rows }) {

    const csv = stringifyCsv([header, ...rows], {
        cast: {
            boolean: value => String(value),
            date: value => value.toISOString()
        }
    });
    // UTF-8 BOM so that Excel opens the file with the right encoding.
    return Buffer.from('﻿' + csv, 'utf8');
}

function writeHtml({ header, rows }) {

    // Same structure as the SheetJS export: every cell, header included, is a <td>, first row = header.
    const headerHtml = `<tr>${header.map(title => `<td>${escapeHtml(title)}</td>`).join('')}</tr>`;
    const rowsHtml = rows.map(row => {
        return `<tr>${row.map(value => `<td>${escapeHtml(textCellValue(value))}</td>`).join('')}</tr>`;
    }).join('');
    const html = '<html><head><meta charset="utf-8"/><title>Table Export</title></head>'
        + `<body><table>${headerHtml}${rowsHtml}</table></body></html>`;
    return Buffer.from(html, 'utf8');
}

async function writeTable(table, bookType) {

    switch (bookType) {
        case 'xlsx': return writeXlsx(table);
        case 'csv': return writeCsv(table);
        case 'html': return writeHtml(table);
        default: throw new Error(`Unsupported output format: ${bookType}`);
    }
}

/**
 * Convert the source file with `converterFunction` (one of the *2Workbook readers) and save it
 * as `bookType` ('xlsx', 'csv' or 'html') under the source file name with the new extension.
 * @return {Promise<{fileId: string, fileName: string}>}
 */
module.exports.convertFile = async function(context, sourceFileId, converterFunction, bookType, mimeType) {

    const fileInfo = await context.getFileInfo(sourceFileId);
    assertFileSize(context, fileInfo);
    const readStream = await context.getFileReadStream(sourceFileId);
    const table = await converterFunction(readStream, context);
    const outputBuffer = await writeTable(table, bookType);
    const newFileName = path.parse(fileInfo.filename).name + '.' + bookType;
    const savedFile = await context.saveFile(newFileName, mimeType, outputBuffer);
    return {
        fileId: savedFile.fileId,
        fileName: newFileName
    };
};

/**
 * Convert the source file with `converterFunction` and save it as JSON: an array with one object
 * per row, keyed by the column titles; empty cells are left out.
 * @return {Promise<{fileId: string, fileName: string}>}
 */
module.exports.convertFile2JSON = async function(context, sourceFileId, converterFunction) {

    const fileInfo = await context.getFileInfo(sourceFileId);
    assertFileSize(context, fileInfo);
    const readStream = await context.getFileReadStream(sourceFileId);
    const table = await converterFunction(readStream, context);
    const json = tableToObjects(table);
    const newFileName = path.parse(fileInfo.filename).name + '.json';
    const savedFile = await context.saveFile(newFileName, 'application/json', JSON.stringify(json, null, 4));
    return {
        fileId: savedFile.fileId,
        fileName: newFileName
    };
};
