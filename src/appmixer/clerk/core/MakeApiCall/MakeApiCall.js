'use strict';

module.exports = {

    async receive(context) {

        const { url, method, body } = context.messages.in.content;

        const requestOptions = {
            method: method,
            url: url,
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`,
                'Content-Type': 'application/json'
            }
        };

        if (body) {
            requestOptions.data = JSON.parse(body);
        }

        try {
            const response = await context.httpRequest(requestOptions);

            return context.sendJson({
                status: response.status,
                headers: response.headers,
                body: response.data
            }, 'out');
        } catch (error) {
            // If Axios throws an error, the response is in error.response.data
            const axiosError = error.response?.data;
            // Extract meaningful error messages from Clerk API responses
            const errorMessage = axiosError?.errors?.[0]?.message ||
                                axiosError?.message ||
                                JSON.stringify(axiosError) ||
                                '';
            error.message = `${error.message}: ${errorMessage}`;
            throw error;
        }
    }
};
