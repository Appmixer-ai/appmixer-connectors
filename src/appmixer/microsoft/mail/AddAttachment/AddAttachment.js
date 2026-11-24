'use strict';

const { makeRequest } = require('../commons');
const commons = require('../../microsoft-commons');

// Microsoft Graph accepts a file attachment in a single request only below 3 MB.
const MAX_SIMPLE_UPLOAD_BYTES = 3 * 1024 * 1024;
// Largest attachment Microsoft Graph accepts through an upload session.
const MAX_UPLOAD_SESSION_BYTES = 150 * 1024 * 1024;
// Upload session chunk: a multiple of 320 KiB and below the 4 MB per-request limit.
const CHUNK_SIZE_BYTES = 320 * 1024 * 10;

const ATTACHMENT_FIELDS = 'id,name,contentType,size,isInline,lastModifiedDateTime';

function toOutput(attachment) {

    return {
        id: attachment.id,
        name: attachment.name,
        contentType: attachment.contentType,
        size: attachment.size,
        isInline: attachment.isInline,
        lastModifiedDateTime: attachment.lastModifiedDateTime
    };
}

async function addSmallAttachment(context, messageId, { name, contentType, content }) {

    const { data } = await makeRequest(context, {
        path: `/me/messages/${encodeURIComponent(messageId)}/attachments`,
        method: 'POST',
        data: {
            '@odata.type': '#microsoft.graph.fileAttachment',
            name,
            contentType,
            contentBytes: content.toString('base64')
        }
    });
    return toOutput(data);
}

async function addLargeAttachment(context, messageId, { name, contentType, content }) {

    const size = content.length;
    const { data: session } = await makeRequest(context, {
        path: `/me/messages/${encodeURIComponent(messageId)}/attachments/createUploadSession`,
        method: 'POST',
        data: {
            AttachmentItem: { attachmentType: 'file', name, size, contentType }
        }
    });

    let response;
    for (let start = 0; start < size; start += CHUNK_SIZE_BYTES) {
        const chunk = content.subarray(start, start + CHUNK_SIZE_BYTES);
        const end = start + chunk.length - 1;
        try {
            // The upload URL carries its own token; an Authorization header makes the request fail.
            response = await context.httpRequest({
                url: session.uploadUrl,
                method: 'PUT',
                data: chunk,
                headers: {
                    'Content-Type': 'application/octet-stream',
                    'Content-Length': chunk.length,
                    'Content-Range': `bytes ${start}-${end}/${size}`
                },
                maxBodyLength: Infinity,
                maxContentLength: Infinity
            });
        } catch (error) {
            throw commons.graphError(error);
        }
    }

    // The last chunk responds with 201 and a Location header pointing to the new attachment.
    const location = response?.headers?.location || response?.headers?.Location || '';
    const match = location.match(/Attachments\('([^']+)'\)/i);
    if (!match) {
        return toOutput({ name, contentType, size, isInline: false });
    }

    const { data } = await makeRequest(context, {
        path: `/me/messages/${encodeURIComponent(messageId)}/attachments/${encodeURIComponent(match[1])}`,
        method: 'GET',
        params: { '$select': ATTACHMENT_FIELDS }
    });
    return toOutput(data);
}

module.exports = {

    MAX_SIMPLE_UPLOAD_BYTES,
    CHUNK_SIZE_BYTES,

    async receive(context) {

        const { messageId, fileId, fileName } = context.messages.in.content;

        if (!messageId) {
            throw new context.CancelError('Message ID is required!');
        }
        if (!fileId) {
            throw new context.CancelError('File ID is required!');
        }

        const fileInfo = await context.getFileInfo(fileId);
        if (fileInfo.length > MAX_UPLOAD_SESSION_BYTES) {
            throw new context.CancelError(
                `The file is ${fileInfo.length} bytes. Microsoft Graph accepts attachments up to 150 MB.`
            );
        }

        const content = await context.loadFile(fileId);
        const file = {
            name: fileName || fileInfo.filename,
            contentType: fileInfo.contentType || 'application/octet-stream',
            content
        };

        const attachment = content.length < MAX_SIMPLE_UPLOAD_BYTES
            ? await addSmallAttachment(context, messageId, file)
            : await addLargeAttachment(context, messageId, file);

        return await context.sendJson(attachment, 'out');
    }
};
