'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { meetingId } = context.messages.in.content;

        if (!meetingId) {
            throw new context.CancelError('Meeting ID is required!');
        }

        // tl;dv returns the transcript only once processing has finished. A 404 here is a
        // legitimate "not ready yet" state (transcripts lag the meeting by minutes), so it
        // is routed to the dedicated `notReady` port rather than thrown as an error.
        let response;
        try {
            response = await context.httpRequest({
                method: 'GET',
                url: `${lib.API_BASE_URL}/${lib.API_VERSION}/meetings/${encodeURIComponent(meetingId)}/transcript`,
                headers: lib.getHeaders(context)
            });
        } catch (error) {
            if (error && error.response && error.response.status === 404) {
                return context.sendJson({ meetingId }, 'notReady');
            }
            throw lib.toCancelError(context, error);
        }

        return context.sendJson(response.data, 'out');
    }
};
