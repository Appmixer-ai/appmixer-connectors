/* eslint-disable camelcase */
'use strict';

module.exports = {
    async receive(context) {
        const { id, open_tracking, click_tracking, tls } = context.messages.in.contents;

        const { data } = await context.httpRequest({
            method: 'PATCH',
            url: 'https://api.resend.com/domains/' + id,
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`,
                'Content-Type': 'application/json'
            },
            data: {
                open_tracking,
                click_tracking,
                tls
            }
        });

        return context.sendJson(data, 'out');
    }
};
