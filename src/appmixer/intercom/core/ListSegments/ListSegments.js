'use strict';

const lib = require('../../lib.generated');
const schema = {
    type: {
        type: 'string',
        title: 'Type'
    },
    id: {
        type: 'string',
        title: 'Segment Id'
    },
    name: {
        type: 'string',
        title: 'Name'
    }
};

module.exports = {

    async receive(context) {

        const { outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Tags' });
        }

        // https://developers.intercom.com/docs/references/rest-api/api.intercom.io/segments/listsegments
        const { data } = await context.httpRequest({
            method: 'GET',
            url: 'https://api.intercom.io/segments',
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`,
                'Intercom-Version': '2.14'
            }
        });

        const records = data.segments || [];
        return lib.sendArrayOutput({ context, records, outputType });
    }
};
