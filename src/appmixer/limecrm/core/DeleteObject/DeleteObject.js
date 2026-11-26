'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { limetype: rawLimetype, objectId: rawObjectId } = context.messages.in.content;
        if (!rawLimetype) {
            throw new context.CancelError('Limetype is required!');
        }
        if (!rawObjectId) {
            throw new context.CancelError('Object ID is required!');
        }
        const limetype = lib.assertName(context, rawLimetype, 'Limetype');
        const objectId = lib.assertId(context, rawObjectId, 'Object ID');

        await lib.apiCall(context, {
            method: 'DELETE',
            path: '/limeobject/' + encodeURIComponent(limetype) + '/' + objectId + '/'
        });
        return context.sendJson({}, 'out');
    }
};
