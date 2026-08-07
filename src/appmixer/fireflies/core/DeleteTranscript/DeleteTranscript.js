'use strict';

const lib = require('../../lib');

module.exports = {
    async receive(context) {

        const { transcriptId } = context.messages.in.content;

        if (!transcriptId) {
            throw new context.CancelError('Transcript ID is required!');
        }

        // Rate limited by Fireflies to 10 requests per minute. Irreversible.
        const query = `
            mutation DeleteTranscript($transcript_id: String!) {
                deleteTranscript(transcript_id: $transcript_id) {
                    id
                    title
                }
            }
        `;

        await lib.makeRequest({ context, query, variables: { transcript_id: transcriptId } });

        return context.sendJson({}, 'out');
    }
};
