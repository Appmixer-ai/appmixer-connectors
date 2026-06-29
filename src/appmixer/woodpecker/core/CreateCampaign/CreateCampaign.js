'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { name, fromName, timezone } = context.messages.in.content;

        if (!name) {
            throw new context.CancelError('Name is required!');
        }

        const data = { name };
        if (fromName) {
            data['from_name'] = fromName;
        }
        if (timezone) {
            data.timezone = timezone;
        }

        const response = await context.httpRequest({
            method: 'POST',
            url: `${lib.API_BASE_URL}/v2/campaigns`,
            headers: lib.getHeaders(context),
            data
        });

        return context.sendJson(response.data, 'out');
    }
};
