'use strict';

const lib = require('../../lib');

const EVENT_TYPE = 'response_completed';

/**
 * The response as the trigger emits it. Shared by receive() and test().
 * @param {object} context
 * @param {string} responseId
 * @returns {Promise<object>}
 */
const fetchResponse = (context, responseId) => {

    const { surveyId, simple } = context.properties;
    return lib.getResponseForTrigger(context, surveyId, responseId, { simple });
};

module.exports = {

    async start(context) {

        const { surveyId } = context.properties;
        if (!surveyId) {
            throw new context.CancelError('Survey is required!');
        }
        return lib.startWebhook(context, {
            name: 'Appmixer New Response ' + context.componentId,
            eventType: EVENT_TYPE,
            objectType: 'survey',
            objectIds: [String(surveyId)]
        });
    },

    async stop(context) {

        return lib.stopWebhook(context);
    },

    async receive(context) {

        if (context.messages.webhook) {
            const event = await lib.readWebhookEvent(context, EVENT_TYPE);
            const resources = (event && event.resources) || {};
            // Only responses of the watched survey. The response is read back from the API with the
            // account's token, so the event only says which response to read.
            if (event && event.object_id && String(resources.survey_id) === String(context.properties.surveyId)) {
                const response = await fetchResponse(context, event.object_id);
                await context.sendJson(response, 'out');
            }
            return context.response();
        }
    },

    // Flow Test Mode: the newest completed response of the survey, through the same request as receive().
    async test(context) {

        const { surveyId } = context.properties;
        if (!surveyId) {
            throw new context.CancelError('Survey is required!');
        }
        const responseId = await lib.findLatestResponseId(context, surveyId);
        if (!responseId) {
            throw new context.CancelError('The survey has no completed response to use as test data. Complete the survey once first.');
        }
        return context.sendJson(await fetchResponse(context, responseId), 'out');
    }
};
