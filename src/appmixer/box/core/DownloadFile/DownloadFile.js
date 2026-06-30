'use strict';

module.exports = {

    async receive(context) {

        const { fileId, version } = context.messages.in.content;

        if (!fileId) {
            throw new context.CancelError('File ID is required!');
        }

        // https://developer.box.com/reference/get-files-id-content/
        const params = {};
        if (version) {
            params.version = version;
        }

        const response = await context.httpRequest({
            method: 'GET',
            url: `https://api.box.com/2.0/files/${fileId}/content`,
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`
            },
            params: params,
            responseType: 'arraybuffer'
        });

        // Get file metadata from response headers
        const contentDisposition = response.headers['content-disposition'] || '';

        // Parse filename from content-disposition header
        // Handle both "filename=..." and "filename*=UTF-8''..." formats
        let fileName = fileId;
        if (contentDisposition) {
            // Try to extract filename from standard format first
            const match = contentDisposition.match(/filename="?([^";\n]+)"?/);
            if (match && match[1]) {
                fileName = match[1];
            } else {
                // Try RFC 5987 format (filename*=UTF-8''...)
                const match2 = contentDisposition.match(/filename\*=UTF-8''(.+?)(?:;|$)/);
                if (match2 && match2[1]) {
                    fileName = decodeURIComponent(match2[1]);
                }
            }
        }

        const contentType = response.headers['content-type'] || 'application/octet-stream';

        // Save the file and get fileId
        const savedFile = await context.saveFileStream(fileName, response.data);

        return context.sendJson({
            fileId: savedFile.fileId,
            fileName,
            contentType,
            size: savedFile.length
        }, 'out');
    }
};
