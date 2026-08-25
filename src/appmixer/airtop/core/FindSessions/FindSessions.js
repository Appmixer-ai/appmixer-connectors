'use strict';

const lib = require('../../lib');

// Schema of a single session item.
const schema = {
    id: { type: 'string', title: 'Session ID', example: '0a5b2c4e-9d31-4d2f-8f7a-6b1d9c3e5a77' },
    status: { type: 'string', title: 'Status', example: 'running' },
    dateCreated: { type: 'string', title: 'Date Created', example: '2026-08-25T09:12:44.000Z' },
    lastActivity: { type: 'string', title: 'Last Activity', example: '2026-08-25T09:14:02.000Z' },
    currentUsage: { type: 'integer', title: 'Current Usage (minutes)', example: 2 },
    cdpUrl: {
        type: 'string',
        title: 'CDP URL',
        example: 'https://api.airtop.ai/sessions/0a5b2c4e-9d31-4d2f-8f7a-6b1d9c3e5a77/cdp'
    },
    cdpWsUrl: {
        type: 'string',
        title: 'CDP WebSocket URL',
        example: 'wss://api.airtop.ai/sessions/0a5b2c4e-9d31-4d2f-8f7a-6b1d9c3e5a77/cdp'
    },
    chromedriverUrl: {
        type: 'string',
        title: 'Chromedriver URL',
        example: 'https://api.airtop.ai/sessions/0a5b2c4e-9d31-4d2f-8f7a-6b1d9c3e5a77/webdriver'
    }
};

module.exports = {

    async receive(context) {

        const { status, outputType = 'array' } = context.messages.in.content || {};

        if (context.properties && context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Sessions' });
        }

        // Return the maximum page the API serves in one call.
        const params = { limit: 100 };
        if (status) {
            params.status = status;
        }

        const { data } = await lib.apiRequest(context, {
            method: 'GET',
            path: '/sessions',
            params
        });

        const payload = lib.unwrap(context, data);
        const records = Array.isArray(payload.sessions) ? payload.sessions : [];

        if (records.length === 0) {
            return context.sendJson({}, 'notFound');
        }

        return lib.sendArrayOutput({ context, records, outputType });
    }
};
