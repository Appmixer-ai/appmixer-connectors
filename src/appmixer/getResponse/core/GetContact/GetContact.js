'use strict';

module.exports = {
    async receive(context) {
        const { contactId } = context.messages.in.content;

        if (!contactId) {
            throw new context.CancelError('Contact ID is required!');
        }

        // https://apireference.getresponse.com/#contacts
        const { data } = await context.httpRequest({
            method: 'GET',
            url: `https://api.getresponse.com/v3/contacts/${contactId}`,
            headers: {
                'X-Auth-Token': `api-key ${context.auth.apiKey}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });

        return context.sendJson(data, 'out');
    }
};
