'use strict';

const lib = require('../../lib');

const schema = {
    campaign_id: {
        type: 'string',
        title: 'Campaign Id'
    },
    created_at: {
        type: 'string',
        title: 'Created At'
    },
    current_status: {
        type: 'string',
        title: 'Current Status'
    },
    name: {
        type: 'string',
        title: 'Name'
    },
    type: {
        type: 'string',
        title: 'Type'
    },
    type_code: {
        type: 'number',
        title: 'Type Code'
    },
    updated_at: {
        type: 'string',
        title: 'Updated At'
    }
};

module.exports = {
    async receive(context) {

        const {
            after_date: afterDate,
            before_date: beforeDate,
            outputType
        } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Campaigns', value: 'campaigns' });
        }

        // https://v3.developer.constantcontact.com/api_reference/index.html#!/Email_Campaigns/listEmailCampaigns
        const params = {};

        if (afterDate) {
            params.after_date = afterDate;
        }

        if (beforeDate) {
            params.before_date = beforeDate;
        }
        params.limit = 500;
        const { data } = await context.httpRequest({
            method: 'GET',
            url: 'https://api.cc.email/v3/emails',
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`
            },
            params
        });

        const records = data.campaigns || [];

        if (records.length === 0) {
            return context.sendJson({}, 'notFound');
        }

        return lib.sendArrayOutput({ context, records, outputType });
    }
};
