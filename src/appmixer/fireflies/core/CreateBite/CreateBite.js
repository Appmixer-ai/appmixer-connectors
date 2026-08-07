'use strict';

const lib = require('../../lib');

module.exports = {
    async receive(context) {

        const { transcriptId, start, end, name } = context.messages.in.content;

        if (!transcriptId) {
            throw new context.CancelError('Transcript ID is required!');
        }
        if (start === undefined || start === null || start === '') {
            throw new context.CancelError('Start time is required!');
        }
        if (end === undefined || end === null || end === '') {
            throw new context.CancelError('End time is required!');
        }

        // Creates a soundbite (highlight clip) from a section of a transcript,
        // defined by start/end offsets in seconds.
        const query = `
            mutation CreateBite($transcript_id: ID!, $start: Float!, $end: Float!, $name: String) {
                createBite(transcript_id: $transcript_id, start: $start, end: $end, name: $name) {
                    id
                    name
                    status
                }
            }
        `;

        const variables = {
            transcript_id: transcriptId,
            start: parseFloat(start),
            end: parseFloat(end)
        };
        if (name) variables.name = name;

        const data = await lib.makeRequest({ context, query, variables });

        return context.sendJson((data && data.createBite) || {}, 'out');
    }
};
