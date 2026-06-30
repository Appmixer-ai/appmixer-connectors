const xlsx = require('xlsx');
const path = require('path');

const ZIP_LOCAL_FILE_HEADER_SIGNATURE = 0x04034b50;
const ZIP_END_OF_CENTRAL_DIRECTORY_SIGNATURE = 0x06054b50;
const ZIP_END_OF_CENTRAL_DIRECTORY_MIN_LENGTH = 22;
const ZIP_MAX_COMMENT_LENGTH = 0xFFFF;

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
    const centralDirectoryEnd = centralDirectoryOffset + centralDirectorySize;

    if (centralDirectoryEnd > endOfCentralDirectoryOffset) {
        throw createSpreadsheetValidationError(context, 'Invalid spreadsheet file: truncated ZIP archive.');
    }
}

module.exports.JSON2Workbook = async function(readStream) {

    return new Promise((resolve, reject) => {
        const buffers = [];
        readStream.on('data', (chunk) => {
            buffers.push(chunk);
        }).on('error', err => {
            reject(err);
        }).on('end', () => {
            try {
                const buffer = Buffer.concat(buffers);
                const json = JSON.parse(buffer.toString());
                const workbook = xlsx.utils.book_new();
                const worksheet = xlsx.utils.json_to_sheet(json);
                xlsx.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
                resolve(workbook);
            } catch (err) {
                reject(err);
            }
        });
    });
};

module.exports.CSV2Workbook = async function(readStream) {

    return new Promise((resolve, reject) => {
        const buffers = [];
        readStream.on('data', (chunk) => {
            buffers.push(chunk);
        }).on('error', err => {
            reject(err);
        }).on('end', () => {
            try {
                // Is there BOM at the beginning of the file?
                const isBom = buffers[0].readUInt8(0) === 0xEF
                    && buffers[0].readUInt8(1) === 0xBB
                    && buffers[0].readUInt8(2) === 0xBF;

                if (!isBom) {
                    // If there is no BOM, we need to add it. See #1717.
                    const bom = Buffer.from([0xEF, 0xBB, 0xBF]);
                    buffers[0] = Buffer.concat([bom, buffers[0]]);
                }
                const buffer = Buffer.concat(buffers);
                const workbook = xlsx.read(buffer, { type: 'buffer' });
                resolve(workbook);
            } catch (err) {
                reject(err);
            }
        });
    });
};

module.exports.HTML2Workbook = async function(readStream) {

    return new Promise((resolve, reject) => {
        const buffers = [];
        readStream.on('data', (chunk) => {
            buffers.push(chunk);
        }).on('error', err => {
            reject(err);
        }).on('end', () => {
            try {
                const buffer = Buffer.concat(buffers);
                const workbook = xlsx.read(buffer);
                resolve(workbook);
            } catch (err) {
                reject(err);
            }
        });
    });
};

module.exports.XLSX2Workbook = async function(readStream, context) {

    return new Promise((resolve, reject) => {
        const buffers = [];
        readStream.on('data', (chunk) => {
            buffers.push(chunk);
        }).on('error', err => {
            reject(err);
        }).on('end', () => {
            try {
                const buffer = Buffer.concat(buffers);
                assertValidZipArchive(buffer, context);
                const workbook = xlsx.read(buffer, { type: 'buffer' });
                resolve(workbook);
            } catch (err) {
                reject(err);
            }
        });
    });
};

module.exports.convertFile = async function(context, sourceFileId, converterFunction, bookType, mimeType) {

    const readStream = await context.getFileReadStream(sourceFileId);
    const fileInfo = await context.getFileInfo(sourceFileId);
    const workbook = await converterFunction(readStream, context);
    const outputBuffer = xlsx.write(workbook, { type: 'buffer', bookType: bookType });
    const newFileName = path.parse(fileInfo.filename).name + '.' + bookType;
    const savedFile = await context.saveFile(newFileName, mimeType, outputBuffer);
    return {
        fileId: savedFile.fileId,
        fileName: newFileName
    };
};

/**
 * @deprecated use the csvToJson() function instead
 * @param context
 * @param sourceFileId
 * @param converterFunction
 * @returns {Promise<{fileName: string, fileId}>}
 */
// Since SheetJS does not provide a "json" bookType, we need to have a special case for JSON export using the sheet_to_json() utility.
module.exports.convertFile2JSON = async function(context, sourceFileId, converterFunction) {

    const readStream = await context.getFileReadStream(sourceFileId);
    const fileInfo = await context.getFileInfo(sourceFileId);
    const workbook = await converterFunction(readStream, context);
    const firstWorksheet = workbook.Sheets[workbook.SheetNames[0]];
    const json = xlsx.utils.sheet_to_json(firstWorksheet);
    const newFileName = path.parse(fileInfo.filename).name + '.json';
    const savedFile = await context.saveFile(newFileName, 'application/json', JSON.stringify(json, '\t', 4));
    return {
        fileId: savedFile.fileId,
        fileName: newFileName
    };
};
