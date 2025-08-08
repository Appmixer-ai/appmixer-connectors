'use strict';

const lib = require('../../lib');

module.exports = {
    async receive(context) {

        const {
            tagId,
            createdAfter,
            createdBefore,
            status,
            taggedAfter,
            taggedBefore,
            outputType
        } = context.messages.in.content;
        const { generateOutputPortOptions } = context.properties;

        // Validate required input
        if (!tagId) {
            throw new context.CancelError('Tag ID is required!');
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
        if (taggedAfter) {
            params.tagged_after = taggedAfter;
        }
        if (taggedBefore) {
            params.tagged_before = taggedBefore;
        }

        // https://developers.kit.com/api-reference/subscribers/list-subscribers
        const { data } = await context.httpRequest({
            method: 'GET',
            url: `https://api.kit.com/v4/tags/${tagId}/subscribers`,
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
    'tagged_at': { 'type': 'string', 'title': 'Tagged At' },
    'fields': { 'type': 'object', 'title': 'Fields' }
};
