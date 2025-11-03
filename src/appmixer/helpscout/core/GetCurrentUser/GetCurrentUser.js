
'use strict';

module.exports = {
    async receive(context) {

        const {  } = context.messages.in.content;

        // https://developer.helpscout.com/mailbox-api/endpoints/users/me/
        const { data } = await context.httpRequest({
            method: 'GET',
            url: 'https://api.helpscout.net/v2/users/me',
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`
            }
        });

        return context.sendJson(data, 'out');
    }
};
