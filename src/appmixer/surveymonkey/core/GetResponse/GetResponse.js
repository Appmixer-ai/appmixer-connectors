'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { surveyId, responseId, simple } = context.messages.in.content;

        if (!surveyId) {
            throw new context.CancelError('Survey is required!');
        }
        if (!responseId) {
            throw new context.CancelError('Response ID is required!');
        }

        const response = await lib.getResponseDetails(context, surveyId, responseId, { simple });
        return context.sendJson(response, 'out');
    }
};
