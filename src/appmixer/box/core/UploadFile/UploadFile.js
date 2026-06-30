'use strict';

const FormData = require('form-data');

module.exports = {

    async receive(context) {

        const { fileId, parentId, fileName: fileNameInput } = context.messages.in.content;

        if (!fileId) {
            throw new context.CancelError('File is required!');
        }

        // Get file information from Appmixer storage
        let fileInfo;
        try {
            fileInfo = await context.getFileInfo(fileId);
        } catch (error) {
            throw new context.CancelError('Invalid File ID. Failed to get file information.');
        }

        if (fileInfo.size > 50 * 1024 * 1024) {
            throw new context.CancelError('Maximum file size is 50MB.');
        }

        // Determine filename
        const fileName = fileNameInput || fileInfo.filename;

        // Get file stream from Appmixer storage
        const fileStream = await context.getFileReadStream(fileId);

        // Create form data for multipart/form-data upload
        const form = new FormData();
        const attributes = {
            name: fileName,
            parent: {
                id: parentId || '0'
            }
        };

        form.append('attributes', JSON.stringify(attributes));
        form.append('file', fileStream, {
            filename: fileName,
            contentType: fileInfo.contentType || 'application/octet-stream'
        });

        // https://developer.box.com/reference/post-files-content/
        try {
            const { data } = await context.httpRequest({
                method: 'POST',
                url: 'https://upload.box.com/api/2.0/files/content',
                headers: {
                    'Authorization': `Bearer ${context.auth.accessToken}`,
                    ...form.getHeaders()
                },
                data: form
            });

            return context.sendJson(data, 'out');
        } catch (error) {
            if (error.statusCode === 409) {
                throw new context.CancelError(`A file named "${fileName}" already exists in the target folder.`);
            }
            throw error;
        }
    }
};
