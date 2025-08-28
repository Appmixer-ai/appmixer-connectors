'use strict';

const lib = require('../../lib');

module.exports = {
    async receive(context) {

        const {
            status,
            emailAddress,
            createdAfter,
            createdBefore,
            updatedAfter,
            updatedBefore,
            outputType
        } = context.messages.in.content;
        const { generateOutputPortOptions, isSource } = context.properties;

        if (generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Subscribers' });
        }

        const params = {
            per_page: isSource ? 50 : 1000
        };

        // Add filter parameters if provided
        if (status) {
            params.state = status;
        }
        if (emailAddress) {
            params.email_address = emailAddress;
        }
        if (createdAfter) {
            params.created_after = createdAfter;
        }
        if (createdBefore) {
            params.created_before = createdBefore;
        }
        if (updatedAfter) {
            params.updated_after = updatedAfter;
        }
        if (updatedBefore) {
            params.updated_before = updatedBefore;
        }

        // https://developers.kit.com/api-reference/subscribers/list-subscribers
        const { data } = await context.httpRequest({
            method: 'GET',
            url: 'https://api.kit.com/v4/subscribers',
            headers: {
                'X-Kit-Api-Key': context.auth.apiKey
            },
            params
        });

        if (isSource) {
            return context.sendJson({ result: data.subscribers }, 'out');
        }

        if (data.subscribers.length === 0) {
            return context.sendJson({}, 'notFound');
        }

        return lib.sendArrayOutput({ context, records: data.subscribers, outputType });
    },

    toSelectArray({ result }) {

        return result.map(subscriber => {
            return { label: subscriber.email_address, value: subscriber.id };
        });
    }
};

const schema = {
    'id': { 'type': 'string', 'title': 'Subscriber ID' },
    'first_name': { 'type': 'string', 'title': 'First Name' },
    'email_address': { 'type': 'string', 'title': 'Email Address' },
    'state': { 'type': 'string', 'title': 'State' },
    'created_at': { 'type': 'string', 'title': 'Created At' },
    'fields': { 'type': 'object', 'title': 'Fields' }
};
