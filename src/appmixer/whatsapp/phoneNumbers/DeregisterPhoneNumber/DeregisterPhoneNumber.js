'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { phoneNumberId } = context.messages.in.content;

        if (!phoneNumberId) {
            throw new context.CancelError('Phone Number ID is required!');
        }

        const { data } = await lib.apiRequest(context, {
            method: 'POST',
            path: `/${phoneNumberId}/deregister`
        });

        return context.sendJson({ success: !!data.success }, 'out');
    }
};
