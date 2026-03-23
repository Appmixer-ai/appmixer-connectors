'use strict';

const BASE_URL = 'https://services.leadconnectorhq.com';
const API_VERSION = '2021-07-28';

module.exports = {

    async receive(context) {

        const { contactId } = context.messages.in.content;

        if (!contactId) {
            throw new context.CancelError('Contact ID is required!');
        }

        const response = await context.httpRequest({
            method: 'GET',
            url: `${BASE_URL}/contacts/${contactId}`,
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`,
                'Version': API_VERSION
            }
        });

        return context.sendJson(response.data.contact, 'out');
    }
};
