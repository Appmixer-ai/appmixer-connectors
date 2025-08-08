'use strict';

const lib = require('../../lib');

module.exports = {
    async receive(context) {

        const {
            formId,
            addedAfter,
            addedBefore,
            createdAfter,
            createdBefore,
            status,
            outputType
        } = context.messages.in.content;
        const { generateOutputPortOptions } = context.properties;

        // Validate required input
        if (!formId) {
            throw new context.CancelError('Form ID is required!');
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

        // https://developers.kit.com/api-reference/forms/list-subscribers-for-a-form
        const { data } = await context.httpRequest({
            method: 'GET',
            url: `https://api.kit.com/v4/forms/${formId}/subscribers`,
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
    'id': { 'type': 'integer', 'title': 'Subscriber ID' },
    'first_name': { 'type': 'string', 'title': 'First Name' },
    'email_address': { 'type': 'string', 'title': 'Email Address' },
    'state': { 'type': 'string', 'title': 'State' },
    'created_at': { 'type': 'string', 'title': 'Created At' },
    'added_at': { 'type': 'string', 'title': 'Added At' },
    'fields': {
        'type': 'object',
        'title': 'Fields'
    },
    'referrer': { 'type': 'string', 'title': 'Referrer' },
    'referrer_utm_parameters': {
        'type': 'object',
        'title': 'Referrer UTM Parameters',
        'properties': {
            'source': { 'type': 'string', 'title': 'Referrer UTM Parameters.Source' },
            'medium': { 'type': 'string', 'title': 'Referrer UTM Parameters.Medium' },
            'campaign': { 'type': 'string', 'title': 'Referrer UTM Parameters.Campaign' },
            'term': { 'type': 'string', 'title': 'Referrer UTM Parameters.Term' },
            'content': { 'type': 'string', 'title': 'Referrer UTM Parameters.Content' }
        }
    }
};
