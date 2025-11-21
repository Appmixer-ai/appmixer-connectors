'use strict';

const lib = require('../../lib');
const schema = { 'b64_json': { 'type': 'string', 'title': 'B64 Json' }, 'revised_prompt': { 'type': 'string', 'title': 'Revised Prompt' } };

module.exports = {
    async receive(context) {

        const { model, prompt, n, size, response_format, user, outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Data' });
        }

        // Validate required inputs
        if (!model) {
            throw new context.CancelError('Model is required!');
        }
        if (!prompt) {
            throw new context.CancelError('Prompt is required!');
        }

        // https://docs.x.ai/docs/images
        const requestData = {
            model: model,
            prompt: prompt,
            n: n || 1,
            response_format: response_format || 'b64_json'
        };

        if (user) {
            requestData.user = user;
        }

        const { data } = await context.httpRequest({
            method: 'POST',
            url: 'https://api.x.ai/v1/images/generations',
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`,
                'Content-Type': 'application/json'
            },
            data: requestData
        });

        const records = data.data || [];

        return lib.sendArrayOutput({ context, records, outputType });
    }
};
