'use strict';

const lib = require('../lib');

module.exports = {

    async receive(context) {

        const { module: moduleName, recordId } = context.messages.in.content;

        lib.assertModule(context, moduleName);
        if (!recordId) {
            throw new context.CancelError('Record ID is required!');
        }

        const body = await lib.request(context, {
            method: 'DELETE',
            path: `/${moduleName}`,
            params: { ids: String(recordId) }
        });
        lib.recordResult(body);
        return context.sendJson({}, 'out');
    }
};
