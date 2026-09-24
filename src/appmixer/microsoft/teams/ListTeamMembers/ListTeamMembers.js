'use strict';

const lib = require('../lib');
const { member: ITEM_SCHEMA } = require('../schemas');

// Graph returns up to 999 members per page for teams.
const PAGE_SIZE = 999;

module.exports = {

    ITEM_SCHEMA,

    async receive(context) {

        const { teamId, outputType = 'array' } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, ITEM_SCHEMA.properties, { label: 'Members' });
        }

        if (!teamId) {
            throw new context.CancelError('Team is required!');
        }

        const records = await lib.listAll(context, `/teams/${encodeURIComponent(teamId)}/members`, { $top: PAGE_SIZE });

        return lib.sendArrayOutput({ context, outputType, records });
    }
};
