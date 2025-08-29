'use strict';

const lib = require('../../lib');

module.exports = {
    async receive(context) {

        const {
            sequenceId,
            addedAfter,
            addedBefore,
            createdAfter,
            createdBefore,
            status,
            outputType
        } = context.messages.in.content;
        const { generateOutputPortOptions } = context.properties;

        // Validate required input
        if (!sequenceId) {
            throw new context.CancelError('Sequence ID is required!');
        }

        if (generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Subscribers' });
        }

        const params = {
            per_page: 1000
        };

        // Add filter parameters if provided
        if (status) {
            params.state = status;
        }
        if (createdAfter) {
            params.created_after = createdAfter;
        }
        if (createdBefore) {
            params.created_before = createdBefore;
        }
        if (addedAfter) {
            params.added_after = addedAfter;
        }
        if (addedBefore) {
            params.added_before = addedBefore;
        }

        // https://developers.kit.com/api-reference/sequences/list-subscribers-for-a-sequence
        const { data } = await context.httpRequest({
            method: 'GET',
            url: `https://api.kit.com/v4/sequences/${sequenceId}/subscribers`,
            headers: {
                'X-Kit-Api-Key': context.auth.apiKey
            },
            params
        });

        if (data.subscribers.length === 0) {
            return context.sendJson({}, 'notFound');
        }

        return lib.sendArrayOutput({ context, records: data.subscribers, outputType });
    }
};

const schema = {
    'id': { 'type': 'string', 'title': 'Subscriber ID' },
    'first_name': { 'type': 'string', 'title': 'First Name' },
    'email_address': { 'type': 'string', 'title': 'Email Address' },
    'state': { 'type': 'string', 'title': 'State' },
    'created_at': { 'type': 'string', 'title': 'Created At' },
    'added_at': { 'type': 'string', 'title': 'Added At' },
    'fields': { 'type': 'object', 'title': 'Fields' }
};
