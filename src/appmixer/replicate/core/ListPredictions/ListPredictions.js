
'use strict';

const lib = require('../../lib.generated');
const schema = {
    'id': { 'type': 'string', 'title': 'Id' },
    'status': { 'type': 'string', 'title': 'Status' },
    'created_at': { 'type': 'string', 'title': 'Created At' },
    'started_at': { 'type': 'string', 'title': 'Started At' },
    'completed_at': { 'type': 'string', 'title': 'Completed At' },
    'version': { 'type': 'string', 'title': 'Version' },
    'model': { 'type': 'string', 'title': 'Model' },
    'input': { 'type': 'object', 'title': 'Input' },
    'output': { 'type': 'object', 'title': 'Output' },
    'error': { 'type': 'string', 'title': 'Error' },
    'logs': { 'type': 'string', 'title': 'Logs' },
    'metrics': { 'type': 'object', 'title': 'Metrics' }
};

module.exports = {
    async receive(context) {

        const { outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Predictions' });
        }

        let url = 'https://api.replicate.com/v1/predictions';

        // https://replicate.com/docs/reference/http#predictions.list
        const { data } = await context.httpRequest({
            method: 'GET',
            url,
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`
            }
        });

        const records = data.results || data || [];
        return lib.sendArrayOutput({ context, records, outputType });
    }
};
