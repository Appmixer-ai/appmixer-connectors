'use strict';

const pathModule = require('path');
const lib = require('../../lib');

const EXT_BY_MIME = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'video/mp4': 'mp4',
    'video/3gpp': '3gp',
    'audio/aac': 'aac',
    'audio/mp4': 'm4a',
    'audio/mpeg': 'mp3',
    'audio/amr': 'amr',
    'audio/ogg': 'ogg',
    'application/pdf': 'pdf',
    'application/msword': 'doc',
    'application/vnd.ms-excel': 'xls',
    'application/vnd.ms-powerpoint': 'ppt',
    'text/plain': 'txt'
};

module.exports = {

    async receive(context) {

        const { mediaId, fileName } = context.messages.in.content;

        if (!mediaId) {
            throw new context.CancelError('Media ID is required!');
        }

        // Step 1 — resolve the short-lived URL + MIME type
        const meta = await lib.apiRequest(context, {
            method: 'GET',
            path: `/${mediaId}`
        });

        const mediaUrl = meta.data.url;
        const mimeType = meta.data.mime_type;

        // Step 2 — download the binary (with the same Bearer token)
        const download = await context.httpRequest({
            method: 'GET',
            url: mediaUrl,
            responseType: 'stream',
            headers: { 'Authorization': `Bearer ${context.auth.accessToken}` }
        });

        const ext = EXT_BY_MIME[mimeType] || 'bin';
        const resolvedName = fileName || `whatsapp-media-${mediaId}.${ext}`;

        const saved = await context.saveFileStream(pathModule.normalize(resolvedName), download.data);

        return context.sendJson({
            fileId: saved.fileId,
            fileName: resolvedName,
            mimeType
        }, 'out');
    }
};
