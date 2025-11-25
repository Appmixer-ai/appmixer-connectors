'use strict';

const lib = require('../../lib');

const schema = {
    id: {
        type: 'string',
        title: 'Customer Id'
    },
    status: {
        type: 'string',
        title: 'Status'
    },
    custom_data: {
        type: 'null',
        title: 'Custom Data'
    },
    name: {
        type: 'string',
        title: 'Name'
    },
    email: {
        type: 'string',
        title: 'Email'
    },
    marketing_consent: {
        type: 'boolean',
        title: 'Marketing Consent'
    },
    locale: {
        type: 'string',
        title: 'Locale'
    },
    created_at: {
        type: 'string',
        title: 'Created At'
    },
    updated_at: {
        type: 'string',
        title: 'Updated At'
    },
    import_meta: {
        type: 'null',
        title: 'Import Meta'
    }
};

module.exports = {
    async receive(context) {

        const { email, name, status, outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Customers', value: 'customers' });
        }

        const params = {
            per_page: 200,
            order_by: 'id[ASC]'
        };

        if (email) {
            // Handle comma-separated emails by splitting and trimming
            const emailArray = email.split(',').map(e => e.trim()).filter(e => e.length > 0);
            if (emailArray.length > 0) {
                params.email = emailArray;
            }
        }

        if (name) {
            params.search = name;
        }

        if (status) {
            // Normalize multiselect input for status field
            const normalizedStatus = lib.normalizeMultiselectInput(status, context, 'Status');
            if (normalizedStatus.length > 0) {
                params.status = normalizedStatus;
            }
        }

        // https://developer.paddle.com/api-reference/customers/list-customers
        const { data } = await context.httpRequest({
            method: 'GET',
            url: 'https://api.paddle.com/customers',
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`
            },
            params
        });

        const customers = data.data || [];

        if (customers.length === 0) {
            return context.sendJson({}, 'notFound');
        }

        return lib.sendArrayOutput({ context, records: customers, outputType });
    }
};
