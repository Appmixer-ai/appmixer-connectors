'use strict';

const lib = require('../../lib');

// GET /data takes queries shorter than 2,048 characters, POST /data up to 16,000 (WQL REST API reference).
const MAX_GET_QUERY_LENGTH = 2048;
// One response carries at most 10,000 rows; the rest is read with limit + offset,
// which both GET and POST take as query parameters.
const PAGE_SIZE = 10000;

module.exports = {

    async receive(context) {

        const { query } = context.messages.in.content;

        if (!query) {
            throw new context.CancelError('Query is required!');
        }

        const url = `${lib.restBaseUrl(context, lib.WQL_SERVICE)}/data`;
        const usePost = query.length >= MAX_GET_QUERY_LENGTH;

        const rows = [];
        let total = 0;
        for (;;) {
            const paging = { limit: PAGE_SIZE, offset: rows.length };
            const { data } = await lib.request(context, {
                method: usePost ? 'POST' : 'GET',
                url,
                headers: lib.authHeaders(context),
                params: usePost ? paging : { query, ...paging },
                ...(usePost ? { data: { query } } : {})
            });
            const page = Array.isArray(data?.data) ? data.data : [];
            rows.push(...page);
            // The largest "total" seen counts: a page that reports none must not end the loop early.
            if (Number.isInteger(data?.total)) {
                total = Math.max(total, data.total);
            }
            if (page.length < PAGE_SIZE || (total > 0 && rows.length >= total)) {
                break;
            }
        }

        return context.sendJson({ result: rows, count: rows.length, total: total || rows.length }, 'out');
    }
};
