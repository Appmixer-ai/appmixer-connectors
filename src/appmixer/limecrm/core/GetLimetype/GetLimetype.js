'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        if (!context.messages.in.content.limetype) {
            throw new context.CancelError('Limetype is required!');
        }
        const limetype = lib.assertName(context, context.messages.in.content.limetype, 'Limetype');
        const result = await lib.getLimetype(context, limetype);
        return context.sendJson(result, 'out');
    }
};
