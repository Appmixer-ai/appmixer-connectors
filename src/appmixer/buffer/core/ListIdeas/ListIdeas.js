'use strict';

const lib = require('../../lib');

const ITEM_SCHEMA = {
    type: 'object',
    required: ['id', 'organizationId'],
    properties: {
        id: { type: 'string', title: 'Idea ID', example: '6a0b1c2d3e4f5a6b7c8d9e0f' },
        organizationId: { type: 'string', title: 'Organization ID', example: '5e7a1b2c3d4e5f6a7b8c9d0e' },
        groupId: { type: 'string', title: 'Group ID', example: '6a0b1c2d3e4f5a6b7c8d9e10' },
        title: { type: 'string', title: 'Title', example: 'Blog post announcement' },
        text: { type: 'string', title: 'Text', example: 'We just published our guide to social media automation.' },
        createdAt: { type: 'integer', title: 'Created At (Unix)', example: 1772721000 },
        updatedAt: { type: 'integer', title: 'Updated At (Unix)', example: 1772721000 }
    }
};

module.exports = {

    ITEM_SCHEMA,

    async receive(context) {

        const { organizationId, outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, ITEM_SCHEMA.properties, { label: 'Ideas', value: 'result' });
        }

        if (!organizationId) {
            throw new context.CancelError('Organization is required!');
        }

        const query = `query Ideas($first: Int, $input: IdeasInput!) {
            ideas(first: $first, input: $input) {
                edges { node { ${lib.IDEA_FIELDS} } }
            }
        }`;
        const data = await lib.graphql(context, query, { first: lib.PAGE_SIZE, input: { organizationId } });
        const ideas = ((data.ideas && data.ideas.edges) || []).map(edge => lib.mapIdea(edge.node));

        return lib.sendArrayOutput({ context, outputType, records: ideas });
    }
};
