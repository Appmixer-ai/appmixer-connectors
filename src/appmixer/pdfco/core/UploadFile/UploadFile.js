'use strict';

module.exports = {
    async receive(context) {

        const { file, name } = context.messages.in.content;

        // Validate required parameters
        if (!file) {
            throw new Error('File parameter is required');
        }

        let endpoint;
        let requestBody;

        try {
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

                // Check if the API returned an error
                if (data.error === true) {
                    console.error('PDFco API returned error:', data.message || 'Unknown error');
                }

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

            // Check if the API returned an error
            if (data.error === true) {
                console.error('PDFco API returned error:', data.message || 'Unknown error');
            }

            return context.sendJson(data, 'out');
        } catch (error) {
            // Handle HTTP errors and API errors
            if (error.response) {
                const { status, data: errorData } = error.response;
                console.error(`PDFco API error [${status}]:`, errorData);

                // Return error response in the expected format
                return context.sendJson({
                    error: true,
                    status: status,
                    message: errorData?.message || errorData?.error || `HTTP ${status} error`,
                    url: null,
                    outputLinkValidTill: null,
                    name: null,
                    credits: 0,
                    remainingCredits: 0,
                    duration: 0
                }, 'out');
            }

            // Re-throw other errors (network issues, etc.)
            throw error;
        }
    }
};

