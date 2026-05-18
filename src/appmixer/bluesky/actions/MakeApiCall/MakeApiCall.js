'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { method, nsid, params, body } = context.messages.in.content;

        if (!method) {
            throw new context.CancelError('HTTP Method is required!');
        }

        if (!nsid) {
            throw new context.CancelError('NSID (Endpoint) is required!');
        }

        let parsedParams;
        if (params) {
            try {
                parsedParams = typeof params === 'object' ? params : JSON.parse(params);
            } catch (e) {
                throw new context.CancelError('Query Parameters must be valid JSON.');
            }
        }

        let parsedBody;
        if (body) {
            try {
                parsedBody = typeof body === 'object' ? body : JSON.parse(body);
            } catch (e) {
                throw new context.CancelError('Request Body must be valid JSON.');
            }
        }

        const response = await lib.xrpc(context, {
            method,
            nsid,
            params: parsedParams,
            data: parsedBody
        });

        return context.sendJson({ response }, 'out');
    }
};
