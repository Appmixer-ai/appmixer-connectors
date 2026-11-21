'use strict';

const lib = require('../../lib');

/**
 * A multipart/form-data body with the two parts the Data Files API reads: "Json" (the request
 * description) and "File" (the content). Built by hand so the request does not depend on the
 * FormData support of the HTTP client.
 * @param {object} json
 * @param {Buffer} content
 * @param {string} fileName
 * @returns {{ body: Buffer, contentType: string }}
 */
const multipartBody = (json, content, fileName) => {

    const boundary = '----appmixer' + Date.now().toString(16) + Math.random().toString(16).slice(2);
    const safeName = String(fileName).replace(/["\r\n]/g, '_');
    const head = '--' + boundary + '\r\n'
        + 'Content-Disposition: form-data; name="Json"\r\n'
        + 'Content-Type: application/json\r\n\r\n'
        + JSON.stringify(json) + '\r\n'
        + '--' + boundary + '\r\n'
        + 'Content-Disposition: form-data; name="File"; filename="' + safeName + '"\r\n'
        + 'Content-Type: application/octet-stream\r\n\r\n';
    const tail = '\r\n--' + boundary + '--\r\n';
    return {
        body: Buffer.concat([Buffer.from(head, 'utf8'), content, Buffer.from(tail, 'utf8')]),
        contentType: 'multipart/form-data; boundary=' + boundary
    };
};

const readFile = async (context, fileId) => {

    const stream = await context.getFileReadStream(fileId);
    const chunks = [];
    for await (const chunk of stream) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    return Buffer.concat(chunks);
};

module.exports = {

    multipartBody,

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

        const json = { name };
        if (connectionId) {
            json.connectionId = connectionId;
        }
        const content = await readFile(context, fileId);
        const { body, contentType } = multipartBody(json, content, name);
        const { data } = await lib.apiRequest(context, {
            method: existing ? 'PUT' : 'POST',
            path: '/api/v1/data-files' + (existing ? '/' + encodeURIComponent(existing.id) : ''),
            headers: { 'Content-Type': contentType },
            data: body
        });
        return context.sendJson(lib.mapDataFile(data), 'out');
    }
};
