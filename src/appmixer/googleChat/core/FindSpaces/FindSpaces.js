
'use strict';

const lib = require('../../lib');

// Schema for a single space item
const spaceSchema = {
    name: {
        type: 'string',
        title: 'Name'
    },
    type: {
        type: 'string',
        title: 'Type'
    },
    displayName: {
        type: 'string',
        title: 'Display Name'
    },
    externalUserAllowed: {
        type: 'boolean',
        title: 'External User Allowed'
    },
    spaceThreadingState: {
        type: 'string',
        title: 'Space Threading State'
    },
    spaceType: {
        type: 'string',
        title: 'Space Type'
    },
    spaceHistoryState: {
        type: 'string',
        title: 'Space History State'
    },
    createTime: {
        type: 'string',
        title: 'Create Time'
    },
    lastActiveTime: {
        type: 'string',
        title: 'Last Active Time'
    },
    membershipCount: {
        type: 'object',
        properties: {
            joinedDirectHumanUserCount: {
                type: 'number',
                title: 'Membership Count.Joined Direct Human User Count'
            }
        },
        title: 'Membership Count'
    },
    customer: {
        type: 'string',
        title: 'Customer'
    },
    spaceUri: {
        type: 'string',
        title: 'Space Uri'
    }
};

module.exports = {
    async receive(context) {

        const { spaceTypes, outputType } = context.messages.in.content;

        // Normalize spaceTypes to ensure it's always an array
        const normalizedSpaceTypes = spaceTypes ?
            lib.normalizeMultiselectInput(spaceTypes, context, 'Space Types') : undefined;

        // Generate output port schema dynamically based on the outputType
        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(
                context,
                outputType,
                spaceSchema,
                { label: 'Spaces' }
            );
        }

        const params = {
            pageSize: 1000
        };

        // Build filter query from selected space types
        if (normalizedSpaceTypes?.length > 0) {
            const validTypes = normalizedSpaceTypes.filter(type =>
                ['SPACE', 'GROUP_CHAT', 'DIRECT_MESSAGE'].includes(type)
            );

            if (validTypes.length > 0) {
                params.filter = validTypes.length === 1
                    ? `spaceType = "${validTypes[0]}"`
                    : validTypes.map(type => `spaceType = "${type}"`).join(' OR ');
            }
        }

        // https://developers.google.com/workspace/chat/api/reference/rest/v1/spaces/list
        const { data } = await context.httpRequest({
            method: 'GET',
            url: 'https://chat.googleapis.com/v1/spaces',
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`
            },
            params
        });

        const spaces = data?.spaces || [];

        if (spaces.length === 0) {
            return context.sendJson({}, 'notFound');
        }

        await context.log({ step: 'http-request-success', response: data });

        return lib.sendArrayOutput({ context, records: spaces, outputType });
    }
};
