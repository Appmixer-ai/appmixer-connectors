'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const input = context.messages.in.content;
        const { projectId } = input;

        if (!projectId) {
            throw new context.CancelError('Project ID is required!');
        }

        await lib.updateItem(context, 'project', projectId, input);
        return context.sendJson({}, 'out');
    }
};
