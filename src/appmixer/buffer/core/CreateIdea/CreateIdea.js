'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { organizationId, title, text } = context.messages.in.content;

        if (!organizationId) {
            throw new context.CancelError('Organization is required!');
        }
        if (!text) {
            throw new context.CancelError('Text is required!');
        }

        const content = { text };
        if (title) {
            content.title = title;
        }

        // createIdea answers with the Idea itself or an IdeaResponse wrapping it.
        const query = `mutation CreateIdea($input: CreateIdeaInput!) {
            createIdea(input: $input) {
                __typename
                ... on Idea { ${lib.IDEA_FIELDS} }
                ... on IdeaResponse { idea { ${lib.IDEA_FIELDS} } }
                ... on MutationError { message }
            }
        }`;
        const data = await lib.graphql(context, query, { input: { organizationId, content } });
        const result = lib.mutationResult(context, data.createIdea, ['Idea', 'IdeaResponse']);
        const idea = result[lib.TYPENAME] === 'IdeaResponse' ? result.idea : result;

        if (!idea) {
            throw new Error('Buffer did not return the created idea.');
        }
        return context.sendJson(lib.mapIdea(idea), 'out');
    }
};
