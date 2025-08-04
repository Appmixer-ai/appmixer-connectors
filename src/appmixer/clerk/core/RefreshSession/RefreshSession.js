'use strict';

module.exports = {
    async receive(context) {
        const {
            sessionId,
            expiredToken,
            refreshToken,
            requestOrigin,
            requestHeaders,
            format,
            requestOriginatingIp
        } = context.messages.in.content;

        // Prepare the request body
        const requestBody = {
            expired_token: expiredToken,
            refresh_token: refreshToken,
            request_origin: requestOrigin
        };

        // Add optional fields if provided
        if (requestHeaders) {
            try {
                requestBody.request_headers = typeof requestHeaders === 'string'
                    ? JSON.parse(requestHeaders)
                    : requestHeaders;
            } catch (error) {
                throw new context.CancelError('Invalid JSON format for request headers');
            }
        }

        if (format) {
            requestBody.format = format;
        }

        if (requestOriginatingIp) {
            requestBody.request_originating_ip = requestOriginatingIp;
        }

        // https://clerk.com/docs/references/backend/overview#sessions
        const { data } = await context.httpRequest({
            method: 'POST',
            url: `https://api.clerk.com/v1/sessions/${sessionId}/refresh`,
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`
            },
            data: requestBody
        });

        return context.sendJson(data, 'out');
    }
};
