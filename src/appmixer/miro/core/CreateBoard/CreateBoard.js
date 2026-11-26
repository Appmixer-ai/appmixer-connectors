'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { name, description, teamId, projectId, access, teamAccess } = context.messages.in.content;

        if (!name) {
            throw new context.CancelError('Name is required!');
        }

        const data = lib.compact({
            name,
            description,
            teamId: teamId || await lib.defaultTeamId(context),
            projectId,
            policy: { sharingPolicy: { access, teamAccess } }
        });

        const board = await lib.request(context, { method: 'POST', path: '/boards', data });
        return context.sendJson(board, 'out');
    }
};
