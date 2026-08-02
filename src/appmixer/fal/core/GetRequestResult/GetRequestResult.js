'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { responseUrl, endpointId, requestId } = context.messages.in.content;

        let url = responseUrl;
        if (!url) {
            if (!endpointId || !requestId) {
                throw new context.CancelError('Provide either a Response URL, or both a Model Endpoint Id and a Request Id.');
            }
            url = lib.queueUrls(endpointId, requestId).responseUrl;
        }

        const response = await lib.request(context, {
            method: 'GET',
            url,
            headers: lib.authHeaders(context)
        });

        // fal returns 202 while the request is still queued or in progress.
        if (response.status === 202) {
            throw new context.CancelError(
                'The request is not COMPLETED yet. Poll Get Request Status until the status is COMPLETED, then try again.'
            );
        }

        return context.sendJson({
            result: response.data,
            requestId
        }, 'out');
    }
};
