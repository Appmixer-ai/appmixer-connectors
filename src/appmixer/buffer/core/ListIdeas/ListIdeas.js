'use strict';

const lib = require('../../lib');

const ITEM_SCHEMA = require('../../schemas/idea.json');

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
