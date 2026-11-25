'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const {
            surveyId,
            type,
            name,
            thankYouMessage,
            redirectUrl,
            closeDate,
            responseLimit,
            allowMultipleResponses,
            anonymousType
        } = context.messages.in.content;

        if (!surveyId) {
            throw new context.CancelError('Survey is required!');
        }
        if (!type) {
            throw new context.CancelError('Collector Type is required!');
        }

        const data = { type };
        if (name) {
            data.name = name;
        }
        if (thankYouMessage) {
            data.thank_you_message = thankYouMessage;
        }
        if (redirectUrl) {
            data.redirect_url = redirectUrl;
        }
        if (closeDate) {
            const date = new Date(closeDate);
            if (isNaN(date.getTime())) {
                throw new context.CancelError('Close Date is not a valid date.');
            }
            data.close_date = date.toISOString();
        }
        if (responseLimit !== undefined && responseLimit !== null && responseLimit !== '') {
            data.response_limit = Number(responseLimit);
        }
        if (allowMultipleResponses && type !== 'email') {
            data.allow_multiple_responses = true;
        }
        if (anonymousType) {
            data.anonymous_type = anonymousType;
        }

        const collector = await lib.request(context, {
            method: 'POST',
            path: '/surveys/' + lib.encodeId(surveyId) + '/collectors',
            data
        });
        return context.sendJson({ survey_id: String(surveyId), ...collector }, 'out');
    }
};
