
'use strict';

const lib = require('../../lib.generated');
module.exports = {
    async receive(context) {

        const { file, name } = context.messages.in.content;

        if (!file) {
            throw new Error('File parameter is required');
        }

        let endpoint, requestBody;
        
        // Determine the appropriate upload method based on file format
        if (file.startsWith('data:')) {
            // Base64 data URI - use base64 upload endpoint
            endpoint = 'https://api.pdf.co/v1/file/upload/base64';
            requestBody = { file };
            if (name) {
                requestBody.name = name;
            }
        } else if (file.startsWith('http://') || file.startsWith('https://')) {
            // URL - use URL upload endpoint
            endpoint = 'https://api.pdf.co/v1/file/upload/url';
            requestBody = { url: file };
            if (name) {
                requestBody.name = name;
            }
        } else {
            // Assume it's file content for small file upload
            endpoint = 'https://api.pdf.co/v1/file/upload';
            // For small file upload, use form-data instead of JSON
            const FormData = require('form-data');
            const formData = new FormData();
            formData.append('file', file);
            if (name) {
                formData.append('name', name);
            }
            
            const { data } = await context.httpRequest({
                method: 'POST',
                url: endpoint,
                headers: {
                    'x-api-key': context.apiKey,
                    ...formData.getHeaders()
                },
                data: formData
            });
            return context.sendJson(data, 'out');
        }

        // For base64 and URL uploads, use JSON
        const { data } = await context.httpRequest({
            method: 'POST',
            url: endpoint,
            headers: {
                'x-api-key': context.apiKey,
                'Content-Type': 'application/json'
            },
            data: requestBody
        });

        return context.sendJson(data, 'out');
    }
};
