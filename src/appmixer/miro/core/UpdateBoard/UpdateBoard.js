'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { boardId: rawBoardId, name, description, access, teamAccess } = context.messages.in.content;
        if (!rawBoardId) {
            throw new context.CancelError('Board is required!');
        }
        const boardId = lib.requireId(context, rawBoardId, 'Board');

        const data = lib.compact({
            name,
            description,
            policy: { sharingPolicy: { access, teamAccess } }
        });
        if (!Object.keys(data).length) {
            throw new context.CancelError('Set at least one field to update.');
        }

        await lib.request(context, { method: 'PATCH', path: '/boards/' + boardId, data });
        return context.sendJson({}, 'out');
    }
};
