'use strict';

module.exports = {
    async receive(context) {

        const { type, text, format } = context.messages.in.content;

        // Validate type parameter (common barcode types)
        const validTypes = [
            'qrcode', 'code128', 'code39', 'code93', 'codabar', 'ean8', 'ean13',
            'upca', 'upce', 'i25', 'datamatrix', 'pdf417', 'aztec'
        ];
        
        if (!validTypes.includes(type.toLowerCase())) {
            console.warn(`Warning: '${type}' may not be a valid barcode type. Valid types include: ${validTypes.join(', ')}`);
        }

        // Prepare request body
        const requestBody = { type, value: text };
        if (format) {
            requestBody.format = format;
        }

        try {
            // https://apidocs.pdf.co/?#barcode-generate
            const { data } = await context.httpRequest({
                method: 'POST',
                url: 'https://api.pdf.co/v1/barcode/generate',
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

