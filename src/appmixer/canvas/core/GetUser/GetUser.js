'use strict';

const Canvas = require('../../canvas-sdk');
module.exports = {

    async receive(context) {

        const { auth } = context;
        const accessToken = auth.accessToken;
        const client = new Canvas(accessToken, context);

        const { userId } = context.messages.in.content;
        if (!userId) {
            throw new context.CancelError('User ID is required');
        }


        const { data } = await client.getUser(userId);
        return context.sendJson(data, 'out');
    }
};
