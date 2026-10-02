'use strict';

const lib = require('../lib');
const { chatMessage: ITEM_SCHEMA } = require('../schemas');

// Graph caps $top at 50 for replies and supports no other query option.
const PAGE_SIZE = 50;

module.exports = {

    ITEM_SCHEMA,

    async receive(context) {

        const { teamId, channelId, messageId, outputType = 'array' } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, ITEM_SCHEMA.properties, { label: 'Replies' });
        }

        const missing = lib.missingMessageInput({ location: 'channel', teamId, channelId, messageId });
        if (missing) {
            throw new context.CancelError(missing);
        }

        const path = `${lib.messagePath({ location: 'channel', teamId, channelId, messageId })}/replies`;
        const records = await lib.listAll(context, path, { $top: PAGE_SIZE });

        return lib.sendArrayOutput({ context, outputType, records });
    }
};
