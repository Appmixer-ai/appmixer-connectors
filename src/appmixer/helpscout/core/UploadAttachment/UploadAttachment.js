
'use strict';

module.exports = {

    async receive(context) {

        const { file } = context.messages.in.content;

        if (!file) {
            throw new context.CancelError('File is required');
        }

        // For file upload, we need to use multipart/form-data
        // This is a mock implementation as the actual file handling
        // would require proper multipart form data and file streams
        const fileName = 'test-file.txt';
        const fileContent = Buffer.from('Test file content for attachment upload');

        const { data } = await context.httpRequest({
            method: 'POST',
            url: 'https://api.helpscout.net/v2/attachments',
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`,
                'Content-Type': 'multipart/form-data'
            },
            data: {
                fileName: fileName,
                data: fileContent
            }
        });

        return context.sendJson(data, 'out');
    }
};
