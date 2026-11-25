'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { name, color, projectId } = context.messages.in.content;
        if (!name) {
            throw new context.CancelError('Name is required!');
        }

        const tag = { name };
        if (color) {
            tag.color = color;
        }
        if (projectId) {
            tag.projectId = Number(projectId);
        }

        const resp = await lib.callAPI(context, 'POST', '/projects/api/v3/tags.json', { tag });

        return context.sendJson(resp.tag, 'out');
    }
};
