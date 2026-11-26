'use strict';

const { Readable } = require('stream');
const lib = require('../../lib');

const MB = 1024 * 1024;
// Qlik accepts a file up to 500 MB in the data-files request itself; a larger one is uploaded
// to the temp-contents service first and referenced by tempContentFileId (qlik.dev, "Create data
// files"). The tenant's own limits from GET /api/v1/data-files/quotas take precedence.
const DEFAULT_DIRECT_UPLOAD_LIMIT = 500 * MB;
// How long the temporary upload is kept for the data-files request, in seconds.
const TEMP_CONTENT_TTL = 3600;

const formatSize = (bytes) => (bytes / MB).toFixed(bytes < 10 * MB ? 1 : 0) + ' MB';

/**
 * A multipart/form-data body with the parts the Data Files API reads: "Json" (the request
 * description) and, when given, "File" (the content, streamed from the Appmixer file).
 * Built by hand so the request does not depend on the FormData support of the HTTP client,
 * and so the file is never held in memory as a whole.
 * @param {object} json
 * @param {object} [file] { open: async () => Readable, length: number|undefined, name: string }
 * @returns {{ stream: Readable, contentType: string, length: number|undefined }}
 */
const multipartBody = (json, file) => {

    const boundary = '----appmixer' + Date.now().toString(16) + Math.random().toString(16).slice(2);
    let head = '--' + boundary + '\r\n'
        + 'Content-Disposition: form-data; name="Json"\r\n'
        + 'Content-Type: application/json\r\n\r\n'
        + JSON.stringify(json) + '\r\n';
    if (file) {
        const safeName = String(file.name).replace(/["\r\n]/g, '_');
        head += '--' + boundary + '\r\n'
            + 'Content-Disposition: form-data; name="File"; filename="' + safeName + '"\r\n'
            + 'Content-Type: application/octet-stream\r\n\r\n';
    }
    const tail = (file ? '\r\n' : '') + '--' + boundary + '--\r\n';
    const headBuffer = Buffer.from(head, 'utf8');
    const tailBuffer = Buffer.from(tail, 'utf8');

    const stream = Readable.from((async function* () {
        yield headBuffer;
        if (file) {
            for await (const chunk of await file.open()) {
                yield Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
            }
        }
        yield tailBuffer;
    })());
    const fileLength = file ? file.length : 0;
    return {
        stream,
        contentType: 'multipart/form-data; boundary=' + boundary,
        length: Number.isFinite(fileLength) ? headBuffer.length + fileLength + tailBuffer.length : undefined
    };
};

/**
 * The upload limits of the user: { maxFileSize, maxLargeFileSize, maxSize, size } in bytes, or {}
 * when the tenant does not answer them (the defaults then apply and Qlik checks the rest).
 * @param {object} context
 * @returns {Promise<object>}
 */
const getQuotas = async (context) => {

    try {
        const { data } = await lib.apiRequest(context, { path: '/api/v1/data-files/quotas' });
        return (data && typeof data === 'object') ? data : {};
    } catch (err) {
        if (err.status && err.status < 500 && err.status !== 429) {
            return {};
        }
        throw err;
    }
};

/**
 * Fail before any byte is sent when the file is over the user's limits.
 * @param {object} context
 * @param {object} quotas
 * @param {number|undefined} size
 * @param {object|undefined} existing the data file that will be replaced
 */
const checkSize = (context, quotas, size, existing) => {

    if (!Number.isFinite(size)) {
        return;
    }
    // maxFileSize only decides between the direct and the temp-contents upload; the largest file
    // the user may store at all is maxLargeFileSize.
    const maxFile = Number(quotas.maxLargeFileSize);
    if (maxFile > 0 && size > maxFile) {
        throw new context.CancelError('The file is ' + formatSize(size) + ', over the Qlik Cloud limit of '
            + formatSize(maxFile) + ' for one data file.');
    }
    const maxSize = Number(quotas.maxSize);
    const used = Number(quotas.size);
    if (maxSize > 0 && Number.isFinite(used)) {
        const freed = existing && Number(existing.size) > 0 ? Number(existing.size) : 0;
        if (used - freed + size > maxSize) {
            throw new context.CancelError('The file is ' + formatSize(size) + ' and only '
                + formatSize(Math.max(0, maxSize - used + freed)) + ' of the ' + formatSize(maxSize)
                + ' data file storage of the user is free.');
        }
    }
};

/**
 * Upload a large file to the temp-contents service (streamed) and return its ID.
 * @param {object} context
 * @param {string} fileId
 * @param {string} name
 * @param {number} size
 * @returns {Promise<string>}
 */
const uploadTempContent = async (context, fileId, name, size) => {

    const stream = await context.getFileReadStream(fileId);
    const response = await lib.apiRequest(context, {
        method: 'POST',
        path: '/api/v1/temp-contents',
        params: { filename: name.split('/').pop(), ttl: TEMP_CONTENT_TTL },
        headers: { 'Content-Type': 'application/octet-stream', 'Content-Length': size },
        data: stream,
        maxBodyLength: Infinity
    });
    const location = (response.headers && (response.headers.location || response.headers.Location)) || '';
    const id = location.split('?')[0].split('/').filter(Boolean).pop();
    if (!id) {
        throw new context.CancelError('Qlik Cloud stored the temporary upload but returned no location for it.');
    }
    return id;
};

module.exports = {

    multipartBody,
    checkSize,

    async receive(context) {

        const { fileId, fileName, spaceId, replace } = context.messages.in.content;
        if (!fileId) {
            throw new context.CancelError('File is required!');
        }

        const info = await context.getFileInfo(fileId);
        const name = fileName || (info && info.filename);
        if (!name) {
            throw new context.CancelError('File Name is required when the file has no name.');
        }
        const size = info && Number.isFinite(Number(info.length)) ? Number(info.length) : undefined;

        const connectionId = await lib.dataFilesConnectionId(context, spaceId);
        let existing;
        if (replace !== false) {
            const params = { name, limit: 1 };
            if (connectionId) {
                params.connectionId = connectionId;
            }
            const { data } = await lib.apiRequest(context, { path: '/api/v1/data-files', params });
            existing = ((data && data.data) || []).find(item => item.name === name);
        }

        const quotas = await getQuotas(context);
        checkSize(context, quotas, size, existing);
        const directLimit = Number(quotas.maxFileSize) > 0 ? Number(quotas.maxFileSize) : DEFAULT_DIRECT_UPLOAD_LIMIT;

        const json = { name };
        if (connectionId) {
            json.connectionId = connectionId;
        }
        let file;
        if (Number.isFinite(size) && size > directLimit) {
            json.tempContentFileId = await uploadTempContent(context, fileId, name, size);
        } else {
            file = { name, length: size, open: () => context.getFileReadStream(fileId) };
        }

        const { stream, contentType, length } = multipartBody(json, file);
        const headers = { 'Content-Type': contentType };
        if (length !== undefined) {
            headers['Content-Length'] = length;
        }
        const { data } = await lib.apiRequest(context, {
            method: existing ? 'PUT' : 'POST',
            path: '/api/v1/data-files' + (existing ? '/' + encodeURIComponent(existing.id) : ''),
            headers,
            data: stream,
            maxBodyLength: Infinity
        });
        return context.sendJson(lib.mapDataFile(data), 'out');
    }
};
