'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { projectId } = context.messages.in.content;

        if (!projectId) {
            throw new context.CancelError('Project ID is required!');
        }

        await lib.deleteItem(context, 'project', projectId);
        return context.sendJson({}, 'out');
    }
};
