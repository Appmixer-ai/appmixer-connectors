'use strict';

const lib = require('../../lib');

const SCHEMA = {
    id: { type: 'string', title: 'Publication ID' },
    name: { type: 'string', title: 'Name' },
    description: { type: 'string', title: 'Description' },
    organization_name: { type: 'string', title: 'Organization Name' },
    referral_program_enabled: { type: 'boolean', title: 'Referral Program Enabled' },
    created: { type: 'integer', title: 'Created' }
};

module.exports = {

    async receive(context) {

        const { outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, SCHEMA, { label: 'Publications', value: 'result' });
        }

        const response = await context.httpRequest({
            method: 'GET',
            url: 'https://api.beehiiv.com/v2/publications',
            headers: {
                Authorization: `Bearer ${context.auth.apiKey}`
            }
        });

        const publications = response.data.data || [];

        return lib.sendArrayOutput({ context, outputType, records: publications });
    },

    toSelectArray(msg) {
        const items = msg.result || (Array.isArray(msg) ? msg : []);
        return items.map(pub => ({ label: pub.name, value: pub.id }));
    }
};
