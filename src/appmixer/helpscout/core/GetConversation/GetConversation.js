
'use strict';

module.exports = {
    async receive(context) {

        const { id } = context.messages.in.content;

        // https://developer.helpscout.com/mailbox-api/endpoints/conversations/get/
        const { data } = await context.httpRequest({
            method: 'GET',
            url: `https://api.helpscout.net/v2/conversations/${id}`,
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`
            }
        });

        return context.sendJson(data, 'out');
    }
};
