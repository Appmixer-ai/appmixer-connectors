
'use strict';

const lib = require('../../lib.generated');

module.exports = {
    async receive(context) {

        const { file, types } = context.messages.in.content;

        // Validate required parameters
        if (!file) {
            throw new Error('File parameter is required');
        }

        // Prepare request body
        const requestBody = { url: file };
        if (types && Array.isArray(types) && types.length > 0) {
            requestBody.types = types.join(',');
        }

        try {
            // https://apidocs.pdf.co/?#barcode-reader (correct endpoint: /v1/barcode/read/from/url)
            const { data } = await context.httpRequest({
                method: 'POST',
                url: 'https://api.pdf.co/v1/barcode/read/from/url',
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
                    barcodes: [],
                    pageCount: 0,
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

