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
                'User-Agent': 'Appmixer (info@appmixer.ai)'
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
        'type': 'string',
        'title': 'Invoice ID'
    },
    'client_key': {
        'type': 'string',
        'title': 'Client Key'
    },
    'number': {
        'type': 'string',
        'title': 'Number'
    },
    'purchase_order': {
        'type': 'string',
        'title': 'Purchase Order'
    },
    'amount': {
        'type': 'number',
        'title': 'Amount'
    },
    'due_amount': {
        'type': 'number',
        'title': 'Due Amount'
    },
    'tax': {
        'type': 'number',
        'title': 'Tax'
    },
    'tax_amount': {
        'type': 'number',
        'title': 'Tax Amount'
    },
    'tax2': {
        'type': 'number',
        'title': 'Tax 2'
    },
    'tax2_amount': {
        'type': 'number',
        'title': 'Tax 2 Amount'
    },
    'discount': {
        'type': 'number',
        'title': 'Discount'
    },
    'discount_amount': {
        'type': 'number',
        'title': 'Discount Amount'
    },
    'subject': {
        'type': 'string',
        'title': 'Subject'
    },
    'notes': {
        'type': 'string',
        'title': 'Notes'
    },
    'state': {
        'type': 'string',
        'title': 'State'
    },
    'period_start': {
        'type': 'string',
        'title': 'Period Start'
    },
    'period_end': {
        'type': 'string',
        'title': 'Period End'
    },
    'issue_date': {
        'type': 'string',
        'title': 'Issue Date'
    },
    'due_date': {
        'type': 'string',
        'title': 'Due Date'
    },
    'payment_term': {
        'type': 'string',
        'title': 'Payment Term'
    },
    'sent_at': {
        'type': 'string',
        'title': 'Sent At'
    },
    'paid_at': {
        'type': 'string',
        'title': 'Paid At'
    },
    'closed_at': {
        'type': 'string',
        'title': 'Closed At'
    },
    'recurring_invoice_id': {
        'type': 'number',
        'title': 'Recurring Invoice ID'
    },
    'created_at': {
        'type': 'string',
        'title': 'Created At'
    },
    'updated_at': {
        'type': 'string',
        'title': 'Updated At'
    },
    'paid_date': {
        'type': 'string',
        'title': 'Paid Date'
    },
    'currency': {
        'type': 'string',
        'title': 'Currency'
    },
    'payment_options': {
        'type': 'array',
        'items': {
            'type': 'string'
        },
        'title': 'Payment Options'
    },
    'client': {
        'type': 'object',
        'properties': {
            'id': { 'type': 'number', 'title': 'Client.Id' },
            'name': { 'type': 'string', 'title': 'Client.Name' }
        },
        'title': 'Client'
    },
    'estimate': {
        'type': 'object',
        'title': 'Estimate'
    },
    'retainer': {
        'type': 'object',
        'title': 'Retainer'
    },
    'creator': {
        'type': 'object',
        'properties': {
            'id': { 'type': 'number', 'title': 'Creator.Id' },
            'name': { 'type': 'string', 'title': 'Creator.Name' }
        },
        'title': 'Creator'
    },
    'line_items': {
        'type': 'array',
        'items': {
            'type': 'object'
        },
        'title': 'Line Items'
    }
};
