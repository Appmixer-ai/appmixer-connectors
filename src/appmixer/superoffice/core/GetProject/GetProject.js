'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { projectId } = context.messages.in.content;

        if (!projectId) {
            throw new context.CancelError('Project ID is required!');
        }

        const item = await lib.getItem(context, 'project', projectId);
        return context.sendJson(item, 'out');
    }
};
