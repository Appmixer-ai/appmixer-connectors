'use strict';

const lib = require('../../lib');

// Maximum page size of the endpoint, and a cap on the number of pages so that a
// single call cannot exhaust the content API rate limit (60 requests per minute).
const PER_PAGE = 50;
const MAX_PAGES = 20;

const ITEM_SCHEMA = {
    type: 'object',
    required: ['id', 'name', 'createdAt', 'updatedAt'],
    properties: {
        id: { type: 'string', title: 'Transactional Email ID', example: 'cll42l54f20i1la0lfooe3z12' },
        name: { type: 'string', title: 'Name', example: 'Sign up confirmation' },
        url: { type: 'string', title: 'URL', example: 'https://app.loops.so/transactional/cll42l54f20i1la0lfooe3z12' },
        draftEmailMessageId: { type: ['string', 'null'], title: 'Draft Email Message ID', example: 'cle5f7g9h1i3j5k7l9m1n3p5' },
        publishedEmailMessageId: { type: ['string', 'null'], title: 'Published Email Message ID', example: 'cle5f7g9h1i3j5k7l9m1n3p5' },
        transactionalGroupId: { type: ['string', 'null'], title: 'Transactional Group ID', example: 'clg7n5p3q1r9s7t5u3v1w9y7' },
        createdAt: { type: 'string', format: 'date-time', title: 'Created At', example: '2025-06-29T07:47:39.370Z' },
        updatedAt: { type: 'string', format: 'date-time', title: 'Updated At', example: '2025-06-29T07:47:39.370Z' },
        dataVariables: { type: 'array', title: 'Data Variables', items: { type: 'string' }, example: ['confirmationUrl'] }
    }
};

const fetchAll = async (context, fetchPage) => {

    const records = [];
    let cursor;
    for (let page = 0; page < MAX_PAGES; page++) {
        const params = { perPage: String(PER_PAGE) };
        if (cursor) params.cursor = cursor;
        const data = await fetchPage(params);
        records.push(...(data?.data || []));
        cursor = data?.pagination?.nextCursor;
        if (!cursor) break;
    }
    return records;
};

module.exports = {

    ITEM_SCHEMA,

    // https://loops.so/docs/api-reference/list-transactional-emails
    async receive(context) {

        const { outputType } = context.messages.in.content;
        const { generateOutputPortOptions, isSource } = context.properties;

        if (generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, ITEM_SCHEMA.properties, {
                label: 'Transactional Emails',
                value: 'result'
            });
        }

        if (isSource) {
            // Inspector dropdown: cached, and never an error popup.
            try {
                const records = await fetchAll(context,
                    params => lib.requestCached(context, '/v1/transactional-emails', params));
                return context.sendJson({ result: records }, 'out');
            } catch (err) {
                return context.sendJson({ result: [] }, 'out');
            }
        }

        const records = await fetchAll(context, async params => {
            const { data } = await lib.request(context, { path: '/v1/transactional-emails', params });
            return data;
        });
        return lib.sendArrayOutput({ context, outputType, records });
    },

    toSelectArray({ result }) {

        return (result || []).map(email => ({ label: email.name, value: email.id }));
    }
};
