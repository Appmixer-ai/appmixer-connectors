'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const {
            clientId,
            projectId,
            state,
            from,
            to,
            updatedSince,
            outputType
        } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Invoices', value: 'invoices' });
        }

        const params = {
            per_page: 2000
        };

        if (clientId) {
            params.client_id = clientId;
        }

        if (projectId) {
            params.project_id = projectId;
        }

        if (state) {
            params.state = state;
        }

        if (from) {
            params.from = from;
        }

        if (to) {
            params.to = to;
        }

        if (updatedSince) {
            params.updated_since = updatedSince;
        }

        // https://help.getharvest.com/api-v2/invoices-api/invoices/invoices/#list-all-invoices
        const { data } = await context.httpRequest({
            method: 'GET',
            url: 'https://api.harvestapp.com/v2/invoices',
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`,
                'Harvest-Account-Id': context.auth.accountId,
                'User-Agent': 'Appmixer'
            },
            params: params
        });

        const invoices = data.invoices || [];

        if (invoices.length === 0) {
            return context.sendJson({}, 'notFound');
        }

        return lib.sendArrayOutput({ context, records: invoices, outputType });
    }
};

const schema = {
    'id': {
        'type': 'number',
        'title': 'Invoice ID'
    },
    'number': {
        'type': 'string',
        'title': 'Number'
    },
    'state': {
        'type': 'string',
        'title': 'State'
    },
    'amount': {
        'type': 'number',
        'title': 'Amount'
    },
    'due_amount': {
        'type': 'number',
        'title': 'Due Amount'
    },
    'subject': {
        'type': 'string',
        'title': 'Subject'
    },
    'issue_date': {
        'type': 'string',
        'title': 'Issue Date'
    },
    'due_date': {
        'type': 'string',
        'title': 'Due Date'
    },
    'client': {
        'type': 'object',
        'properties': {
            'id': { 'type': 'number', 'title': 'Client.Id' },
            'name': { 'type': 'string', 'title': 'Client.Name' }
        },
        'title': 'Client'
    },
    'currency': {
        'type': 'string',
        'title': 'Currency'
    },
    'created_at': {
        'type': 'string',
        'title': 'Created At'
    },
    'updated_at': {
        'type': 'string',
        'title': 'Updated At'
    }
};
