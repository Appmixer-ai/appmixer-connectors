'use strict';

const lib = require('../../lib');

const ITEM_SCHEMA = require('../../schemas/channel.json');

module.exports = {

    ITEM_SCHEMA,

    async receive(context) {

        const { organizationId, outputType } = context.messages.in.content;
        const { isSource } = context.properties;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, ITEM_SCHEMA.properties, { label: 'Channels', value: 'result' });
        }

        let channels;
        try {
            channels = isSource
                ? await lib.callCached(context, { op: 'channels', organizationId }, () => lib.listChannels(context, organizationId))
                : await lib.listChannels(context, organizationId);
        } catch (err) {
            if (isSource) {
                return context.sendJson({ result: [], count: 0 }, 'out');
            }
            throw err;
        }

        return lib.sendArrayOutput({ context, outputType: isSource ? 'array' : outputType, records: channels });
    },

    toSelectArray({ result }) {

        return (result || []).map(channel => ({
            label: `${channel.displayName || channel.name} (${channel.service})`,
            value: channel.id
        }));
    }
};
