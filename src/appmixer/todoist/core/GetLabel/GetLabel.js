'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { labelId } = context.messages.in.content;

        if (!labelId) {
            throw new context.CancelError('Label ID is required.');
        }

        const label = await lib.apiRequest(context, `/labels/${labelId}`);

        // The API returns lowercase field names, so we can return it directly
        return context.sendJson(label, 'out');
    }
};
