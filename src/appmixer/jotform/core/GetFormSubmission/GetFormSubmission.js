'use strict';

module.exports = {

    receive: async function(context) {

        const { id } = context.messages.in.content;
        const regionPrefix = context.auth.regionPrefix || 'api';

        // https://api.jotform.com/docs/#submission-id
        const { data } = await context.httpRequest({
            method: 'GET',
            url: `https://${regionPrefix}.jotform.com/submission/${id}`,
            headers: {
                'APIKEY': context.auth.apiKey
            }
        });

        const response = {
            ...data,
            content: {
                ...data.content,
                answers: Object.values(data.content.answers || {})
            }
        };

        return context.sendJson(response, 'out');
    }
};
