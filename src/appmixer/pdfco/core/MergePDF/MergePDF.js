'use strict';

module.exports = {
    async receive(context) {

        const { files, name } = context.messages.in.content;

        // Validate required parameters
        if (!files || !Array.isArray(files) || files.length === 0) {
            throw new Error('Files parameter is required and must be a non-empty array');
        }

        // Prepare request body
        const requestBody = { url: files.join(',') };
        if (name) {
            requestBody.name = name;
        }

        try {
            // https://apidocs.pdf.co/?#pdf-merge
            const { data } = await context.httpRequest({
                method: 'POST',
                url: 'https://api.pdf.co/v1/pdf/merge',
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

