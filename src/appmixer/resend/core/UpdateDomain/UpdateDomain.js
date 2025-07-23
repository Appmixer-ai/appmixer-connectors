
/* eslint-disable camelcase */
'use strict';

module.exports = {

    async receive(context) {

        const { id, open_tracking, click_tracking, tls } = context.messages.in.content;

        if (!id) {
            throw new context.CancelError('Domain ID is required.');
        }

        const update_data = {};
        if (open_tracking !== undefined) {
            update_data.open_tracking = open_tracking;
        }
        if (click_tracking !== undefined) {
            update_data.click_tracking = click_tracking;
        }
        if (tls !== undefined) {
            update_data.tls = tls;
        }

        await context.httpRequest({
            method: 'PATCH',
            url: 'https://api.resend.com/domains/' + id,
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`
            },
            data: update_data
        });

        return context.sendJson({}, 'out');
    }
};
