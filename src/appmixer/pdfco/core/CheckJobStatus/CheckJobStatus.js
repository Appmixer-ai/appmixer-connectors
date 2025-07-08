'use strict';

module.exports = {
    async receive(context) {

        const { jobId } = context.messages.in.content;

        try {
            // https://apidocs.pdf.co/?#job-status
            const { data } = await context.httpRequest({
                method: 'GET',
                url: `https://api.pdf.co/v1/job/check?jobid=${encodeURIComponent(jobId)}`,
                headers: {
                    'x-api-key': context.apiKey
                }
            });

            // Ensure error field is always present as boolean
            if (typeof data.error === 'undefined') {
                data.error = false;
            }

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
                    status: errorData?.status || status,
                    message: errorData?.message || errorData?.error || `HTTP ${status} error`,
                    jobId: jobId,
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

