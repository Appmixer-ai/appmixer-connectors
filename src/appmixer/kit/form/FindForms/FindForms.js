'use strict';

const lib = require('../../lib');

module.exports = {
    async receive(context) {

        const {
            status,
            type,
            outputType
        } = context.messages.in.content;
        const { generateOutputPortOptions, isSource } = context.properties;

        if (generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Forms' });
        }

        const params = {
            per_page: 1000
        };

        // Add filter parameters if provided
        if (status) {
            params.state = status;
        }
        if (type) {
            params.type = type;
        }

        // https://developers.kit.com/api-reference/forms/list-forms
        const { data } = await context.httpRequest({
            method: 'GET',
            url: 'https://api.kit.com/v4/forms',
            headers: {
                'X-Kit-Api-Key': context.auth.apiKey
            },
            params
        });

        if (isSource) {
            return context.sendJson({ result: data.forms }, 'out');
        }

        if (data.forms.length === 0) {
            return context.sendJson({}, 'notFound');
        }

        return lib.sendArrayOutput({ context, records: data.forms, outputType });
    },

    toSelectArray({ result }) {

        return result.map(form => {
            return { label: form.name, value: form.id };
        });
    }
};

const schema = {
    id: { type: 'string', title: 'Form ID' },
    name: { type: 'string', title: 'Form Name' },
    created_at: { type: 'string', title: 'Created At' },
    type: { type: 'string', title: 'Form Type' },
    format: { type: 'string', title: 'Format' },
    embed_js: { type: 'string', title: 'Embed JS URL' },
    embed_url: { type: 'string', title: 'Embed URL' },
    archived: { type: 'boolean', title: 'Archived' },
    uid: { type: 'string', title: 'Form UID' }
};
