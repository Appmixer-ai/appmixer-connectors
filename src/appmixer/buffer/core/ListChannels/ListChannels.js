'use strict';

const lib = require('../../lib');

const ITEM_SCHEMA = {
    type: 'object',
    required: ['id', 'name', 'service', 'organizationId'],
    properties: {
        id: { type: 'string', title: 'Channel ID', example: '5f8e1c2b3a4d5e6f7a8b9c0d' },
        name: { type: 'string', title: 'Name', example: 'acme' },
        displayName: { type: 'string', title: 'Display Name', example: 'Acme Inc.' },
        service: { type: 'string', title: 'Service', example: 'linkedin' },
        type: { type: 'string', title: 'Type', example: 'page' },
        descriptor: { type: 'string', title: 'Descriptor', example: 'LinkedIn Page' },
        avatar: { type: 'string', title: 'Avatar', example: 'https://example.com/avatars/acme.png' },
        organizationId: { type: 'string', title: 'Organization ID', example: '5e7a1b2c3d4e5f6a7b8c9d0e' },
        timezone: { type: 'string', title: 'Timezone', example: 'Europe/London' },
        isDisconnected: { type: 'boolean', title: 'Is Disconnected', example: false },
        isLocked: { type: 'boolean', title: 'Is Locked', example: false },
        isQueuePaused: { type: 'boolean', title: 'Is Queue Paused', example: false },
        externalLink: { type: 'string', title: 'External Link', example: 'https://www.linkedin.com/company/acme' },
        createdAt: { type: 'string', format: 'date-time', title: 'Created At', example: '2025-01-15T10:30:00.000Z' },
        updatedAt: { type: 'string', format: 'date-time', title: 'Updated At', example: '2026-02-01T08:00:00.000Z' }
    }
};

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
