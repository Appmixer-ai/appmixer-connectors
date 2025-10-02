
'use strict';

const lib = require('../../lib');
const schema = { 'id': { 'type': 'string', 'title': 'Id' }, 'email': { 'type': 'string', 'title': 'Email' }, 'name': { 'type': 'string', 'title': 'Name' } };

module.exports = {
    async receive(context) {

        const { limit, page_token, outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Results' });
        }

        // https://dev.frontapp.com/reference
        const { data } = await context.httpRequest({
            method: 'GET',
            url: 'https://api2.frontapp.com/teammates',
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`
            }
        });

        return lib.sendArrayOutput({ context, records: data._results, outputType });
    }
};
