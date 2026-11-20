'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { customFieldId } = context.messages.in.content;
        // The Custom Field dropdown (ListCustomFields#toInspector) uses "<id>-<type>" values.
        const id = String(customFieldId ?? '').split('-')[0].trim();
        if (!id) {
            throw new context.CancelError('Custom Field is required!');
        }

        await lib.callAPI(context, 'DELETE', `/projects/api/v3/customfields/${encodeURIComponent(id)}.json`);

        return context.sendJson({}, 'out');
    }
};
