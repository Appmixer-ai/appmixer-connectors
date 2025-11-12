'use strict';

const lib = require('../../lib');

const schema = {
    'id': { 'type': 'string', 'title': 'Monitor ID' },
    'name': { 'type': 'string', 'title': 'Name' },
    'description': { 'type': 'string', 'title': 'Description' },
    'query': { 'type': 'string', 'title': 'Query' },
    'operator': { 'type': 'string', 'title': 'Operator' },
    'threshold': { 'type': 'number', 'title': 'Threshold' }
};

module.exports = {

    async receive(context) {

        const { outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Monitors', value: 'monitors' });
        }

        const { data } = await context.httpRequest({
            method: 'GET',
            url: 'https://api.axiom.co/v1/monitors',
            headers: {
                'Authorization': `Bearer ${context.auth.apiToken}`,
                'Content-Type': 'application/json'
            }
        });

        const monitors = Array.isArray(data) ? data : [];

        return lib.sendArrayOutput({ context, records: monitors, outputType });
    }
};
