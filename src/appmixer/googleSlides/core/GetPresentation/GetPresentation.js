'use strict';

const lib = require('../../lib');

module.exports = {
    async receive(context) {
        const { presentationId, fields } = context.messages.in.content;

        if (!presentationId) {
            throw new context.CancelError('Presentation ID is required!');
        }

        // Normalize the multiselect fields input
        const normalizedFields = fields ?
            lib.normalizeMultiselectInput(fields, context, 'Fields') : undefined;

        let encodedFields;
        if (normalizedFields) {
            encodedFields = normalizedFields.join(',');
        }

        // https://developers.google.com/workspace/slides/api/reference/rest/v1/presentations/get
        const { data } = await context.httpRequest({
            method: 'GET',
            url: `https://slides.googleapis.com/v1/presentations/${presentationId}`,
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`
            },
            params: {
                fields: encodedFields
            }
        });

        return context.sendJson(data, 'out');
    }
};
