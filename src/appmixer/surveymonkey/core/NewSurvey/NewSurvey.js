'use strict';

const lib = require('../../lib');

const EVENT_TYPE = 'survey_created';

module.exports = {

    async start(context) {

        // survey_created webhooks take no object type and no object IDs.
        return lib.startWebhook(context, {
            name: 'Appmixer New Survey ' + context.componentId,
            eventType: EVENT_TYPE
        });
    },

    async stop(context) {

        return lib.stopWebhook(context);
    },

    async receive(context) {

        if (context.messages.webhook) {
            const event = await lib.readWebhookEvent(context, EVENT_TYPE);
            const surveyId = event && (event.object_id || (event.resources || {}).survey_id);
            if (surveyId) {
                // Read back from the API with the account's token; the event only names the survey.
                const survey = await lib.getSurvey(context, surveyId);
                await context.sendJson(survey, 'out');
            }
            return context.response();
        }
    },

    // Flow Test Mode: the most recently modified survey, read the same way as in receive().
    async test(context) {

        const [latest] = await lib.listSurveys(context, { perPage: 1 });
        if (!latest) {
            throw new context.CancelError('The account has no survey to use as test data. Create a survey first.');
        }
        return context.sendJson(await lib.getSurvey(context, latest.id), 'out');
    }
};
