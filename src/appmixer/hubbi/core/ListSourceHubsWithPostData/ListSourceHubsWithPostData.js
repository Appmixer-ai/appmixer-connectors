'use strict';

const lib = require('../../lib');

const SCHEMA = {
    key: { type: 'string', title: 'Conversion Key' },
    name: { type: 'string', title: 'Name' }
};

module.exports = {

    async receive(context) {

        const { outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, SCHEMA, { label: 'Hubs', value: 'result' });
        }

        const baseUrl = context.auth.baseUrl.replace(/\/$/, '');
        const response = await context.httpRequest({
            method: 'GET',
            url: `${baseUrl}/Flows/Home/ListSourceHubsWithPostData?clientKey=${encodeURIComponent(context.auth.clientKey)}`,
            headers: {
                'Authorization': `Bearer ${context.auth.token}`,
                'Accept': 'application/json'
            }
        });

        const hubs = response.data || [];

        return lib.sendArrayOutput({ context, outputType, records: hubs });
    },

    toSelectArray(msg) {
        const items = msg.result || (Array.isArray(msg) ? msg : []);
        return items.map(hub => ({ label: hub.name, value: hub.key }));
    }
};
