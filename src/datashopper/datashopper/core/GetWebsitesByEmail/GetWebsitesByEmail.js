'use strict';

module.exports = {
    async receive(context) {
        const { email } = context.messages.in.content;
        const { baseUrl, apiKey } = context.auth;
        const { isSource } = context.properties;

        try {
            const response = await context.httpRequest({
                method: 'POST',
                url: `${baseUrl}/api/v2/websites/by-email`,
                headers: {
                    'X-API-Key': apiKey,
                    'Content-Type': 'application/json'
                },
                data: {
                    email: email
                }
            });

            if (response.data.success) {
                if (isSource) {
                    return context.sendJson({ websites: response.data.data }, 'out');
                }
                return context.sendArray(response.data.data, 'out');
            } else {
                throw new Error('Failed to fetch websites');
            }
        } catch (error) {
            if (error.response) {
                const status = error.response.status;
                if (status === 401) {
                    throw new Error('Missing X-API-Key header');
                } else if (status === 403) {
                    throw new Error('Invalid API key');
                } else if (status === 404) {
                    throw new Error('User not found');
                } else if (status === 422) {
                    throw new Error('Validation error: invalid email format');
                }
            }
            throw error;
        }
    },

    websitesToSelectArray({ websites }) {
        return (websites || []).map(website => ({
            label: website.label,
            value: website.value
        }));
    }
};
