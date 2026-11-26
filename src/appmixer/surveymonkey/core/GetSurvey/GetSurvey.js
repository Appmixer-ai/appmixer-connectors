'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { surveyId } = context.messages.in.content;

        if (!surveyId) {
            throw new context.CancelError('Survey is required!');
        }

        const survey = await lib.getSurveyDetails(context, surveyId);
        return context.sendJson(survey, 'out');
    }
};
