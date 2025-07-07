
'use strict';

const lib = require('../../lib.generated');

module.exports = {
    async receive(context) {

        const { html, url, paperSize, orientation } = context.messages.in.content;

        // Validate required parameters
        if (!html && !url) {
            throw new Error('Either html or url parameter is required');
        }

        let endpoint, requestBody;
        
        if (url) {
            // URL to PDF conversion
            endpoint = 'https://api.pdf.co/v1/pdf/convert/from/url';
            requestBody = { url };
        } else {
            // HTML to PDF conversion
            endpoint = 'https://api.pdf.co/v1/pdf/convert/from/html';
            requestBody = { html };
        }
        
        // Add common optional parameters
        if (paperSize) {
            requestBody.paperSize = paperSize;
        }
        if (orientation) {
            requestBody.orientation = orientation;
        }

        try {
            // https://apidocs.pdf.co/?#html-to-pdf or #url-to-pdf
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
                    pageCount: 0,
                    credits: 0,
                    remainingCredits: 0,
                    duration: 0,
                    name: null,
                    outputLinkValidTill: null
                }, 'out');
            }
            
            // Re-throw other errors (network issues, etc.)
            throw error;
        }
    }
};

