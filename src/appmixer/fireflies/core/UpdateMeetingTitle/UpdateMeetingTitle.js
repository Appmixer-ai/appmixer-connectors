'use strict';

const lib = require('../../lib');

module.exports = {
    async receive(context) {

        const { transcriptId, title } = context.messages.in.content;

        if (!transcriptId) {
            throw new context.CancelError('Transcript ID is required!');
        }
        if (!title) {
            throw new context.CancelError('Title is required!');
        }

        const query = `
            mutation UpdateMeetingTitle($transcript_id: String!, $title: String!) {
                updateMeetingTitle(transcript_id: $transcript_id, title: $title) {
                    title
                }
            }
        `;

        await lib.makeRequest({ context, query, variables: { transcript_id: transcriptId, title } });

        return context.sendJson({}, 'out');
    }
};
