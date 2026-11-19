'use strict';

const lib = require('../../lib');

// GET /data takes queries shorter than 2,048 characters, POST /data up to 16,000 (WQL REST API reference).
const MAX_GET_QUERY_LENGTH = 2048;

module.exports = {

    async receive(context) {

        const { query } = context.messages.in.content;

        if (!query) {
            throw new context.CancelError('Query is required!');
        }

        const url = `${lib.restBaseUrl(context, lib.WQL_SERVICE)}/data`;
        const request = query.length < MAX_GET_QUERY_LENGTH
            ? { method: 'GET', url, params: { query } }
            : { method: 'POST', url, data: { query } };

        const { data } = await context.httpRequest({ ...request, headers: lib.authHeaders(context) });
        const rows = Array.isArray(data?.data) ? data.data : [];

        return context.sendJson({ result: rows, count: rows.length, total: data?.total ?? rows.length }, 'out');
    }
};
